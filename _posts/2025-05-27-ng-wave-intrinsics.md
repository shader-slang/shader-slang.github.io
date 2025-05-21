# Optimizing 2D Gaussian Splatting: From Explicit Sorts to Wave-Powered Ballots

In our journey through neural graphics, we started with an "Neural Graphics in an Afternoon," exploring the exciting possibilities of representing and rendering scenes with machine learning approaches. We then delved into "Neural Graphics: First Principles to Performance," laying down some initial strategies for making these techniques practical. Now, we're ready to roll up our sleeves and explore more advanced performance optimizations, using our familiar 2D differentiable Gaussian splatting example as a testbed.

Let’s look at the modifications added to a new example in the SlangPy samples repository, `balloted-splatting`. This example starts with the same Python code as its predecessor, `diff-splatting`, which we walked through in our previous blog post. 

## Recapping the 2D Differentiable Gaussian Splatting Example

As a quick refresher, these examples implement a 2D Gaussian splatting algorithm. We represent a scene (or in this case, a 2D image) with a collection of 2D Gaussian "blobs," each defined by parameters like center, covariance (shape/rotation), and color. We then render an image by splatting these Gaussians onto a canvas, and Slang's automatic differentiation capabilities allow us to compute how the loss function (the difference between our rendered image and a target) changes with respect to each Gaussian's parameters. This enables us to train the Gaussians to reconstruct a target image.

The Python script (`main.py`) driving this process is identical between the two examples; the evolution we're examining happens within the Slang shader code itself (`diffsplatting2d.slang` vs. `ballotsplatting2d.slang`), specifically in how Gaussians are culled, sorted (or not), and rasterized.

## The `diff-splatting` Approach: A Straightforward Staged Pipeline

The `diff-splatting` example implements the rendering for each tile (a small patch of pixels processed by a GPU workgroup) through a multi-stage process within its main `splatBlobs` Slang function:

1.  **Coarse Rasterization (`coarseRasterize`):** This initial stage identifies which Gaussians potentially affect the current tile. Indices of intersecting Gaussians are stored in `groupshared` memory, using an `Atomic\<uint\>` (`blobCountAT`) to safely manage concurrent writes from multiple threads.  
2.  **Padding (`padBuffer`):** The shared list of blob indices is then padded.  
3.  **Sorting (`bitonicSort`):** A workgroup-level bitonic sort arranges the intersecting blob indices. This sorting ensures Gaussians are composited in the right order.  
4.  **Fine Rasterization (`fineRasterize`):** With a sorted list of relevant Gaussians, each pixel within the tile iterates through them. It evaluates each Gaussian's contribution and blends it with the pixel's current color. This function also has an associated custom backward pass (`fineRasterize\_bwd`) for the differentiation process, which "undoes" the blending operations to propagate gradients.

This staged pipeline is logical and relatively straightforward to follow. However, explicit multi-stage processing involving `groupshared` memory and a full sort can introduce performance overhead and synchronization points.

## `balloted-splatting`: Harnessing GPU Wave Intrinsics

The `balloted-splatting` example presents a more sophisticated and often more performant approach by leveraging **wave intrinsics** (also known as subgroup operations in Vulkan, or shuffle operations in CUDA). These are GPU hardware commands allowing threads within a small, fixed-size group (a "wave" or "subgroup," typically 32 or 64 threads) to communicate and coordinate with very high efficiency.

You can see this in action in the new `cullAndApplyBlobs` function, which effectively replaces the `coarseRasterize`, `padBuffer`, `bitonicSort`, and `fineRasterize` sequence from the previous example.

```slang  
/*
 * cullAndApplyBlobs finds blobs which intersect the current tile and evaluates them in a single pass using
 * wave intrinsics.
 *
 * This uses the multiplicative alpha blending algorithm laid out in the original GS paper (https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/)
 * This is represented as a 'state transition' (transformPixelState) as we go through the blobs in order, so that we can
 * concisely represent the 'state undo' operation in the custom backwards pass (fineRasterize_bwd).
 *
 * In Slang, custom derivative functions can be defined using the `[BackwardDerivative(custom_fn)]` attribute.
 */
[require (subgroup_ballot)]
[require (subgroup_vote)]
[BackwardDerivative(fineRasterize_bwd)]
float4 cullAndApplyBlobs(Blobs blobs, OBB tileBounds, uint localIdx, no_diff float2 uv)
{
    PixelState pixelState = PixelState(float4(0, 0, 0, 1), 0);
    uint numIntersectingBlobs = 0;
    
    // Traverse the list in workgroup-sized chunks. Each lane in the workgroup/wave will be responsible for
    // determining if one gaussian in the chunk intersects the current tile.
    for (uint wgStart = 0, numGaussians = Gaussian2D.count(blobs); wgStart < numGaussians; wgStart += WG_SIZE)
    {
        // lane 0 will load the blob represented at position wgStart, and other lanes will get the subsequent blobs
        Gaussian2D coarseBlob = Gaussian2D.load(blobs, wgStart + localIdx);
        bool intersects = coarseBlob.bounds().intersects(tileBounds);

        // All lanes write to the ballot bitmask to indicate whether intersection is true;
        // so all lanes will have the same value for intersectionMask
        uint intersectionMask = WaveActiveBallot(intersects).x;

        while(intersectionMask != 0)
        {
            // identify the next lane with intersects == true in this chunk
            uint idxInChunk = firstbitlow(intersectionMask);
            uint16_t blobIdx = wgStart + idxInChunk; // then get the index for that blob
         
            intersectionMask &= intersectionMask - 1; // remove the least significant 1 bit from the mask

            float4 blobEval = eval(blobs, blobIdx, uv);
            pixelState = transformPixelState(pixelState, blobEval, blobIdx);

            intersectingBlobList[min(numIntersectingBlobs++, GAUSSIANS_PER_BLOCK - 1)] = blobIdx;
        }

        // if ALL the blobs processed in this chunk are below the alpha threshold,
        // stop processing blobs.
        if (WaveActiveAllTrue(pixelState.value.a < 1.f / 255.f))
        {
            break;
        }
    }

    intersectingBlobCount = numIntersectingBlobs;
    maxCount[localIdx] = pixelState.finalCount;
    finalVal[localIdx] = pixelState.value;
    return pixelState.value;
}
```  
The first thing you’ll likely notice is that this function carries additional annotations compared to the functions in the original diff-splatting example. The `[require (subgroup_ballot)]` and `[require (subgroup_vote)]` annotations use slang’s **capability system** to indicate that this function requires this optional capability to be supported. The Slang compiler is able to identify whether the target it is currently compiling for supports these capabilities, and if not, it will provide a warning. For example, a shader targeting HLSL Shader Model 5 with these capability requirements would result in:

```  
myshader.slang(9): warning 41012: entry point 'computeMain' uses additional capabilities that are not part of the specified profile 'sm_5_0'. The profile setting is automatically updated to include these capabilities: 'sm_6_0'  
```  
So how are we using these new capabilities that we require?

Instead of a multi-pass approach– first identifying intersecting blobs for the current tile, sorting them, and then calculating colors from the shorter list of blobs, we’re now using a single pass through the set of Gaussians to process them all, in workgroup-sized chunks. Within each chunk, each lane (a thread within the wave) is assigned a single Gaussian, and tests whether it intersects the current tile bounds. The crucial improvement here is the `WaveActiveBallot(intersects).x` call. This takes the boolean intersection result from each active lane in the wave, and creates a bitmask. All of the lanes in the wave can access the bitmask, and can therefore understand which Gaussians in the chunk being processed are relevant. The code then iterates through the set bits of this mask, which we’ve called `intersectionMask`. For each intersection Gaussian, its contribution is evaluated, and immediately alpha-blended. We still store the indices for the intersecting blobs, because we will still need them during the custom backward pass.  
One benefit of this approach is that we no longer need to do an explicit workgroup-wide sort. Because we keep the blobs in order during processing, we maintain the needed order for alpha blending. Additionally, we no longer need to use an atomic counter– and thereby introduce the possibility of contention– when we increment the number of intersecting blobs and write the index to the blob list. This might look problematic at first glance, because all of the lanes are writing to the same `intersectingBlobList` in shared memory. But we don’t need to worry about data collisions here because of how we’re coming up with this data. Each lane has its own copy of numIntersectingBlobs, so that variable does not need to be atomically incremented. And each lane also will be operating on the same value in `intersectionMask`, calculated using `WaveActiveBallot`. For this reason, all lanes are storing the same indices in the same order into `intersectingBlobList`, so while technically this is a data race, it’s a benign one.  
We’ve also changed the type for a couple of our storage parameters: `intersectingBlobList` and `maxCount` have both been changed from `uint` to `uint16`, which reduces their memory footprint in `groupshared` memory. As we noted in the previous post, workgroup shared memory is very small. One potential side effect of requesting very large amounts of shared memory for a workgroup is that fewer workgroups can be scheduled simultaneously on a single unit. This is inefficient, because that means that a chunk of the available compute hardware will sit idle.

## The Performance Payoff

Why undertake this refactoring? The shift to a wave intrinsic-based approach in `balloted-splatting` is squarely aimed at **improving performance and efficiency**:

*   **Reduced Synchronization Overhead:** Wave operations are generally tightly coupled with the hardware and can involve less synchronization overhead than operations requiring coordination across an entire workgroup using shared memory.  
*   **Eliminating the Bottleneck of Sorting:** Explicitly sorting data in shared memory (like the `bitonicSort`) is computationally intensive and can be a significant performance bottleneck. The ballot-based approach sidesteps this.  
*   **Better Hardware Utilization:** Wave intrinsics are designed to map directly onto efficient GPU hardware pathways, allowing for faster execution of tasks like voting (balloting), data exchanges (shuffling), and other coordinated operations within a subgroup.

## Looking Ahead

The evolution from `diff-splatting` to `balloted-splatting` provides a concrete example of how understanding and applying modern GPU architectural features can lead to substantial performance gains in neural graphics and other demanding rendering tasks. As we continue to explore this field, such optimization techniques will be crucial for pushing the boundaries of what's possible in real-time.
