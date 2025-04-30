---
layout: post
title: "Neural Graphics in an Afternoon"
date: 2025-04-04 17:00:00
categories: [ "blog", "featured" ]
tags: [slang]
author: "Shannon Woods, NVIDIA, Slang Working Group Chair"
image: /images/posts/2025-04-04-splatterjeep.webp
human_date: "April 4, 2025"
---

The intersection of computer graphics and machine learning is creating exciting new possibilities, from scene reconstruction with NeRFs and Gaussian splats to learning complex material properties. But getting started with neural graphics can seem daunting. Between understanding graphics APIs, shader programming, and automatic differentiation, there’s a lot to learn. That’s why the Slang team is introducing [SlangPy](https://slangpy.shader-slang.org/en/latest/), a new Python package that makes it dramatically easier to build neural graphics applications with Slang. With just a few lines of Python code, you can now:

- Seamlessly call Slang functions on the GPU from Python
- Leverage automatic differentiation without writing complex derivative code
- Eliminate graphics API boilerplate and reduce potential bugs
- Integrate with popular ML frameworks like PyTorch
- Rapidly prototype and experiment with neural graphics techniques

In this article, I’ll show you how to write your first neural graphics program with Slang and SlangPy by walking through our 2D Gaussian Splatting example.

## Example: 2D Gaussian Splatting

Our concrete example, which you can see in action on the [Slang playground](https://shader-slang.org/slang-playground/?demo=gsplat2d-diff.slang), uses 2D Gaussian splats (think of them as fuzzy circular blobs of color) to represent an image. Each splat has properties for:

- Position (where it's centered)
- Sigma (how fuzzy/spread out it is)
- Color

Why are Gaussian splats so powerful? Their mathematical properties make them particularly well-suited for representing visual information. Each Gaussian splat naturally creates smooth gradients from its center outward, which is perfect for capturing how light and color blend in real-world scenes. And because of this smoothness, they are well suited to optimization techniques like the one we are about to explore. In more advanced applications, these properties allow Gaussian splats to represent complex 3D scenes with remarkably high visual quality while maintaining real-time performance – a sweet spot that's made them increasingly popular in computer graphics applications from virtual production to AR/VR.

The challenge is: how do we determine the right parameters for thousands of splats to recreate a specific image? To do this, we can use a technique common in machine learning called gradient descent. Gradient descent can be used to find an optimal solution to a problem by making small adjustments to its inputs and checking whether they bring the result closer to our desired output. The basic idea is that we start with random splat properties, and define a “loss function”, which measures how different the resulting image is from what we want it to be, and then use gradient descent to adjust the splat properties until the difference is minimized.

## The Challenge: Computing Gradients

That's where things get a little tricky. There’s a mathematical operation to express how a function changes as you change one of its inputs– the derivative. A gradient is a collection of partial derivatives of a function with respect to each of its input parameters. If that sounds scary: don’t worry, Slang is here to help!  
  
Without Slang, calculating derivatives of our loss function with respect to every parameter can get very laborious. For complex graphics operations, this means:

- Writing both the function itself, and a corresponding function (the derivative of the original) which calculates the gradients. These are referred to as the “forward” and “backward” forms of the function.
- Making sure that any changes made to the original (forward) form of the function are also done correctly to its differential (backward) form.
- Actually doing the derivatives, which can get extremely complex for an arbitrary shader function

Slang makes this entire process much easier, because it can automatically calculate the backward form of your shader functions for you. You can take advantage of the power of gradient descent without having to wade hip-deep (or even dip your toes) into calculus.

## The Code

Let’s take a look at what it looks like to do this in the code. I’ll first go through a simplified version of the 2D Gaussian splatting example, so it’s very clear how the mechanism works. You can find this example in the SlangPy repository [here](https://github.com/shader-slang/slangpy/tree/main/examples/simplified-splatting). First, we’ll check out the Python side of things. With SlangPy, this code is pretty succinct.

```python
# SPDX-License-Identifier: Apache-2.0 WITH LLVM-exception

import slangpy as spy
import sgl
import pathlib
import imageio
import numpy as np

# Create an SGL device, which will handle setup and invocation of the Slang
# compiler for us. We give it both the slangpy PATH and the local include
# PATH so that it can find Slang shader files
device = sgl.Device(compiler_options={
    "include_paths": [
        spy.SHADER_PATH,
        pathlib.Path(__file__).parent.absolute(),
    ],
})

# Load our Slang module -- we'll take a look at this in just a moment
module = spy.Module.load_from_file(device, "simplediffsplatting2d.slang")

# Create a buffer to store Gaussian blobs. We're going to make a very small one,
# because right now this code is not very efficient, and will take a while to run.
# For now, we are going to create 200 blobs, and each blob will be comprised of 9 
# floats:
#   blob center x and y (2 floats)
#   sigma (a 2x2 covariance matrix - 4 floats)
#   color (3 floats)
NUM_BLOBS = 200
FLOATS_PER_BLOB = 9
# SlangPy lets us create a Tensor and initialize it easily using numpy to generate
# random values. This Tensor includes storage for gradients, because we call .with_grads()
# on the created spy.Tensor.
blobs = spy.Tensor.numpy(device, np.random.rand(
    NUM_BLOBS * FLOATS_PER_BLOB).astype(np.float32)).with_grads()

# Load our target image from a file, using the imageio package,
# and store its width and height in W, H
image = imageio.imread("./jeep.jpg")
W = image.shape[0]
H = image.shape[1]

# Convert the image from RGB_u8 to RGBA_f32 -- we're going 
# to be using texture values during derivative propagation,
# so we need to be dealing with floats here. 
image = (image / 256.0).astype(np.float32)
image = np.concatenate([image, np.ones((W, H, 1), dtype=np.float32)], axis=-1)
input_image = device.create_texture(
    data=image,
    width=W,
    height=H,
    format=sgl.Format.rgba32_float,
    usage=sgl.ResourceUsage.shader_resource)

# Create a per_pixel_loss Tensor to hold the calculated loss, and create gradient storage
per_pixel_loss = spy.Tensor.empty(device, dtype=module.float4, shape=(W, H))
per_pixel_loss = per_pixel_loss.with_grads()
# Set per-pixel loss' derivative to 1 (using a 1-line function in the slang file)
module.ones(per_pixel_loss.grad_in)

# Create storage for the Adam update moments
# The Adam optimization algorithm helps us update the inputs to the function being optimized
# in an efficient manner. It stores two "moments": the first is a moving average of the
# of the gradient of the loss function. The second is a moving average of the squares of these
# gradients. This allows us to "step" in the desired direction while maintaining momentum toward
# the goal
adam_first_moment = spy.Tensor.zeros_like(blobs)
adam_second_moment = spy.Tensor.zeros_like(blobs)

# Pre-allocate a texture to send data to tev occasionally.
current_render = device.create_texture(
    width=W,
    height=H,
    format=sgl.Format.rgba32_float,
    usage=sgl.ResourceUsage.shader_resource | sgl.ResourceUsage.unordered_access)

iterations = 10000
for iter in range(iterations):
    # Back-propagage the unit per-pixel loss with auto-diff.
    module.perPixelLoss.bwds(per_pixel_loss,
                             spy.grid(shape=(input_image.width,input_image.height)),
                             blobs, input_image)

    # Update the parameters using the Adam algorithm
    module.adamUpdate(blobs, blobs.grad_out, adam_first_moment, adam_second_moment)

    # Every 50 iterations, render the blobs out to a texture, and hand it off to tev
    # so that you can visualize the iteration towards ideal
    if iter % 50 == 0:
        module.renderBlobsToTexture(current_render,
                                    blobs,
                                    spy.grid(shape=(input_image.width,input_image.height)))
        sgl.tev.show_async(current_render, name=f"optimization_{(iter // 50):03d}")
    
```

This is the entire Python file for setting up, initializing a set of 2D Gaussian blobs, and kicking off the derivative propagation that calculates the ideal values for all those blob parameters. The setup should be fairly straightforward and explained by the comments, so let’s take a closer look at the “meat” of this file, iterating through our gradient descent.

```python
iterations = 10000
for iter in range(iterations):
    # Back-propagage the unit per-pixel loss with auto-diff.
    module.perPixelLoss.bwds(per_pixel_loss,
                             spy.grid(shape=(input_image.width,input_image.height)),
                             blobs, input_image)
```

What the `module.perPixelLoss.bwds()` call is doing is going into the Slang module we loaded above, finding the `perPixelLoss()` function defined within it, and invoking the backwards differential form. The parameters we pass are:

- `per_pixel_loss` - A tensor we created to store the loss value for each pixel of the calculated image
- `spy.grid(shape=(input_image.width, input_image.height))` - This is part of what makes SlangPy so helpful. Much like the thread ID of a traditional compute kernel, SlangPy has a way for your kernel to know what thread it’s operating on in the context of the full dispatch. But what makes it especially handy for ML use cases is that Slang’s generator functions support arbitrary dimensionality, as opposed to the 3D-maximum in most traditional compute paradigms. There are [several generator methods](https://slangpy.shader-slang.org/en/latest/generators.html) provided by SlangPy; `grid()` is the one we want here because we can be explicit about the shape of the work we’re dispatching. We’re computing the values of a width x height image, and so we want to consider our compute threads in that context, so we provide those values to the grid function, and it will generate appropriate identifier information for each of the invocations of the kernel.
- `blobs` - The tensor full of all the blob parameters, which also has storage for gradients associated with each of the blobs. Those gradients will give us the information we need to know which direction to adjust each parameters to get closer to our desired target output.
- `input_image` - The target image that we’re trying to get our blobs to look like

When this call finishes, per_pixel_loss will contain values representing the results of the loss function for each pixel based on the “calculated image” that results from all of our current blob parameters, and blobs will have a gradient associated with each blob, indicating which direction the parameters should move in order to get closer to the target. The input image will be unchanged.
  
```python
    # Update the parameters using the Adam algorithm
    module.adamUpdate(blobs, blobs.grad_out, adam_first_moment, adam_second_moment)
```

This line calls into a Slang function in our module which provides an [optimized algorithm](https://optimization.cbe.cornell.edu/index.php?title=Adam) for updating our blobs based on the information stored in the blob gradients. It calculates moving averages of these gradients, so that we can update our blob parameters efficiently. You can read more about how Adam works in [the paper](https://arxiv.org/pdf/1412.6980) that introduced it, and you’ll see the implementation in our Slang module in a moment. Don’t worry– it’s less than thirty lines of Slang code!

```python
    # Every 50 iterations, render the blobs out to a texture, and hand it off to tev
    # so that you can visualize the iteration towards ideal
    if iter % 50 == 0:
        module.renderBlobsToTexture(current_render,
                                    blobs,
                                    spy.grid(shape=(input_image.width,input_image.height)))
        sgl.tev.show_async(current_render, name=f"optimization_{(iter // 50):03d}")
```
  
And then finally, we use one last function in our Slang module to render the results of our blobs out to a texture, instead of just keeping them in memory, so that we can visualize the results of the iterations as we go on. We’re doing 10 thousand iterations, though, so looking at every iteration might be overkill, so we’ll only render out every 50th iteration.


Ok! Now, for the Slang side of things.

There’s a bit more to the Slang code, but let’s first take a look at the functions that we called out to from SlangPy just a moment ago. The workhorse of the module is that `perPixelLoss()` function and its helpers:

```hlsl
// simpleSplatBlobs() is a naive implementation of the computation of color for a pixel.
// It will iterate over all of the Gaussians for each pixel, to determine their contributions
// to the pixel color, so this will become prohibitively slow with a very small number of
// blobs, but it reduces the number of steps involved in determining the pixel color.
//
[Differentiable]
float4 simpleSplatBlobs(GradInOutTensor<float, 1> blobsBuffer, uint2 pixelCoord, int2 texSize)
{
    Blobs blobs = {blobsBuffer};
    
    float4 result = {0.0, 0.0, 0.0, 1.0};
    float4 blobColor = {0.0, 0.0, 0.0, 0.0};
    
    // iterate over the full list of Gaussion blobs
    for (uint i = 0; i < SIMPLE_BLOBCOUNT; i++)
    {
        // first, calculate the color of the current blob
		Gaussian2D gaussian = Gaussian2D.load(blobs, i);
		blobColor = gaussian.eval(pixelCoord * (1.0/texSize));
		
		// then, blend with the blobs we've accumulated so far
		result = alphaBlend(result, blobColor);
	}
	
	// Blend with background
	return float4(result.rgb * (1.0 - result.a) + result.a, 1.0);
}

//
// loss() implements the standard L2 loss function to quantify the difference between
// the rendered image and the target texture.
//
[Differentiable]
float loss(uint2 pixelCoord, int2 imageSize, Blobs blobs, Texture2D<float4> targetTexture)
{
	int texWidth;
	int texHeight;
	targetTexture.GetDimensions(texWidth, texHeight);
	int2 texSize = int2(texWidth, texHeight);
	
	// Splat the blobs and calculate the color for this pixel.
	float4 color = simpleSplatBlobs(blobs.blobsBuffer, pixelCoord, imageSize);
	float4 targetColor;
	
	float weight;
	if (pixelCoord.x >= imageSize.x || pixelCoord.y >= imageSize.y)
	{
		return 0.f;
	}
	else
	{
		targetColor = no_diff targetTexture[pixelCoord];
		return dot(color.rgb - targetColor.rgb, color.rgb - targetColor.rgb);
	}
	
	return 0.f;
}

// Differentiable function to compute per-pixel loss
// Parameters:
// output: a 2-dimensional tensor of float4 values, representing the output texture
// pixelCoord: the coordinates of the output pixel whose loss is being calculated
// blobsBuffer: a 1-dimensional tensor of floats, containing the Gaussian blobs

[Differentiable]
void perPixelLoss(GradInOutTensor<float4, 2> output,
				  uint2 pixelCoord,
				  GradInOutTensor<float, 1> blobsBuffer,
				  Texture2D<float4> targetTexture)
{
	uint2 imageSize;
	targetTexture.GetDimensions(imageSize.x, imageSize.y);
	output.set( {pixelCoord.x, pixelCoord.y},
		loss(pixelCoord, imageSize, {blobsBuffer}, targetTexture));
}
```

You can see in this code block that `simpleSplatBlobs()` is doing most of the work: iterating over our entire list of Gaussian blobs, and accumulating their contributions to the color of the pixel we are currently calculating. Keep in mind that `perPixelLoss()` is going to be invoked once for each pixel in the output image, so the function is figuring out the loss value for just a single pixel. 

You might wonder if iterating over our entire list of Gaussians for each pixel in the image might be slow. It is. There are some clever things that we can do to speed up this calculation considerably, which I’ll cover in a follow-up blog post, but for now, let’s just focus on the simple– but slow– version.  
  
This set of functions is responsible for calculating all of the output pixels, as well as the difference between those values and our ideal target image, so they’re invoked not just for propagating loss derivatives (the `module.perPixelLoss.bwds` call we made in Python), but also during the rendering of our output texture, via `renderBlobsToTexture`, which looks like this:

```hlsl
void renderBlobsToTexture(
    RWTexture2D<float4> output,
    GradInOutTensor<float, 1> blobsBuffer,
    uint2 pixelCoord)
{
    uint2 imageSize;
    output.GetDimensions(imageSize.x, imageSize.y);
    output[pixelCoord] = simpleSplatBlobs(blobsBuffer, pixelCoord, imageSize);
}
```
  
As you can see, this function just takes the result of `simpleSplatBlobs`, and writes the value to the appropriate pixel location in the output texture.

The other piece of the equation is the Adam update algorithm:

```hlsl
void adamUpdate(inout float val,
				inout float dVal,
				inout float firstMoment,
				inout float secondMoment)
{
    // Read & reset the derivative
    float g_t = dVal;

    float g_t_2 = g_t * g_t;

    //
    // Perform a gradient update using Adam optimizer rules for
    // a smoother optimization.
    //
    float m_t_prev = firstMoment;
    float v_t_prev = secondMoment;
    float m_t = ADAM_BETA_1 * m_t_prev + (1 - ADAM_BETA_1) * g_t;
    float v_t = ADAM_BETA_2 * v_t_prev + (1 - ADAM_BETA_2) * g_t_2;

    firstMoment = m_t;
    secondMoment = v_t;

    float m_t_hat = m_t / (1 - ADAM_BETA_1);
    float v_t_hat = v_t / (1 - ADAM_BETA_2);

    float update = (ADAM_ETA / (sqrt(v_t_hat) + ADAM_EPSILON)) * m_t_hat;
    val -= update;
    dVal = 0.f;
}
```

This function isn’t marked as differentiable, because we don’t need to do any derivatives here– it’s just a straightforward update of all the blob parameters based on our gradients.  
  
And… that’s essentially it! Other than a few utility functions, this is all you need to write code that trains itself to match an output image. Your first neural graphics shader!
  

<img src="/images/posts/splatting-jeep-final.gif" alt="An animation of the low-fi simplified 2D splatter in action" class="img-fluid">


Now, there are some notable shortcomings in this example– primarily, as mentioned before, that it takes quite a long time to execute. Because we look through our entire list of Gaussian blobs once for every pixel being calculated, at every iteration, it takes about 40 minutes (for me, on a system with a six-year-old graphics card) for all 10,000 iterations to complete. And this is with a very small number of blobs; I limited the number of blobs used to generate the image to 200, because going beyond that point starts to hang my GPU. And because of the small number of blobs, you can see that the image is pretty fuzzy. We could counter this with more, smaller blobs, but doing that will require some clever changes to improve execution speed. Thankfully, this is exactly the sort of work that GPUs are good at! And now that we’ve got the hang of how gradient descent and gaussian splatting work, we can dive into the optimization work in a follow-on blog post.  
  
If you have any questions or comments on this example code, or things you’d like to see covered in future walkthrough blog posts, please join us on the [Slang Discord](https://khr.io/slang-discord) – I and the rest of the Slang team can be found hanging out and answering questions there!
