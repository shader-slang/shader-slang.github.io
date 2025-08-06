---
title: Automatic Differentiation Tutorial - 2
layout: page
description: Autodiff tutorial 2
permalink: "/docs/auto-diff-tutorial-2"
intro_image_absolute: true
intro_image_hide_on_mobile: false
---

## What Will We Learn

In the [last tutorial](auto-diff-tutorial-1.md), we explain basic knowledge about Slang's autodiff feature and introduce some advanced techniques about custom derivative implementation and custom differential type.

In this tutorial, we will walk through a real-world example using what we've learnt from the last tutorial.

We will learn how to implement a tiny Multi-Layer Perceptron (MLP) to approximate a set of polynomial functions using Slang's automatic differentiation capabilities.

### Problem Setup

- **Input**: Two scalar variables x and y

- **Target Function**: A set of polynomial expressions:

$$f(x,y) = \begin{bmatrix}
f_{1}(x,\, y) =&\frac{(x\, + \, y)}{\left( 1\, + \, y^{2} \right)} \\
f_{2}(x,\, y) =&2x + y \\
f_{3}(x,\, y) =&0.5x^{2} + 1.2y \\
f_{4}(x,\, y) =&x + 0.5y^{2}
\end{bmatrix}$$

- **Network Architecture**: 4 inputs → 16 hidden units → 4 outputs

- **Learning Method**: Adam Optimizer

## 2. Mathematical Formulation

### The Learning Problem

Given a neural network $MLP(x,y;\theta)$ with parameters $\theta$, we want to minimize:

$$L(\theta) = \left| \left| MLP(x,y;\theta) - f(x,y) \right| \right|^{2}$$

Where:

- $MLP(x,y;\theta)$ is our neural network\'s output
- $f(x,y)$ is the ground truth polynomial set
- $L(\theta)$ is the [mean squared error](https://en.wikipedia.org/wiki/Mean_squared_error)

### The Workflow will be

- **Forward Pass**: Compute $MLP(x,y;\theta)$ and $L(\theta)$
- **Backward Pass**: Compute $\frac{\partial L}{\partial\theta}$ (gradients w.r.t. parameters)
- **Parameter Update**: $\theta \leftarrow \theta - \alpha\frac{\partial L}{\partial\theta}$ (gradient descent)

## 3. Forward Pass Architecture Design

### 3.1 Top-Level Network Definition

Our MLP is a composition of two feed-forward layers:

```hlsl
public struct MyNetwork
{
    public FeedForwardLayer<4, 16> layer1; // Input to hidden
    public FeedForwardLayer<16, 4> layer2; // Hidden to output

    internal public MLVec<4> _eval(half x, half y)
    {
        // layer2.eval(layer1.eval());
    }

    public half4 eval(no_diff half x, no_diff half y)
    {
        // construct MLVec<4> from x, y
        // call internal _eval
        // convert MLVec<4> to half4
    }
}
```

In our interface methods design, we introduce an internal representation of vector type `MLVec<4>` in the network evaluation. And this design choice will help us hide the details about how we are going to perform the arithmetic/logic operations on the vector type, as they are irrelevant to how the network should be designed. For now, you can treat this type as an opaque type, and we will talk about the detail in later section. Therefore, in the public method, we will just convert the input to `MLVec`, call the internal `_eval` method, and convert `MLVec` back to a normal vector. And in the internal `_eval` method, we will just chain the evaluations of each layer together.
> Note that we are using `half` type, which is [16-bit floating-point type](external/slang/docs/user-guide/02-conventional-features.md#scalar-types) for better thoughput and reducing memory usage.

### 3.2 Feed-Forward Layer Definition

Each layer performs: $LeakyRelu(Wx+x, b)$, so we can create a struct to abstract this as follow:

```hlsl
public struct FeedForwardLayer<int InputSize, int OutputSize>
{
    public NFloat* weights;
    public NFloat* weightsGrad;
    public NFloat* biases;
    public NFloat* biasesGrad;

    public MLVec<OutputSize> eval(MLVec<InputSize> input)
    {
        // out = matrix-multiply-add(input, weight, bias);
        // return leaky_relu(out, alpha);
    }
}
```

The evaluation is very simple, just doing a matrix vector multiplication plus a bias vector, and then performing a LeakyRelu function on it. But note that we use pointers in this struct to reference the parameters (e.g. weight and bias) instead of declaring arrays or even global storage buffers. Because our MLP will be run on the GPU and each evaluation function will be executed per-thread, if we used arrays for each layer, an array would be allocated for each thread and that would explode the GPU memory. For the same reason, we cannot declare a global storage buffer  because each thread will hold a storage buffer that stores the exact same data.
Therefore, the most efficient approach is to use pointers or references to the global storage buffer, so every thread which executes the layer's method can access it.

### 3.3 Vector Type Definition

The `MLVec` type represents vectors:
```hlsl
public struct MLVec<int N>
{
    public half data[N];
    public static MLVec<N> fromArray(half[N] values)
    {
        // construct MLVec<N> from values
    }

    public NFloat[N] toArray()
    {
        return data;
    }
}
```
For `MLVec`, we declare two methods to help us convert from and to a normal array.

**Supporting Operations**:

- Matrix-vector multiplication with bias
```hlsl
MLVec<OutputSize> matMulAdd<int OutputSize, int InputSize>(MLVec<InputSize> input, NFloat* matrix, NFloat* bias);
```
- Transpose version of Matrix-vector multiplication with bias
```hlsl
MLVec<OutputSize> matMulTransposed<int OutputSize, int InputSize>(MLVec<InputSize> input, NFloat* matrix);
```
- Outer product of two vectors
```hlsl
void outerProductAccumulate<int M, int N>(MLVec<M> v0, MLVec<N>v1, NFloat* matrix);
```

The First two operations are straightforwad, which is just matrix vector multiplication and its transpose version. The last operation defines an outer product of two vectors, the result will be a matrix, such that $\text{x} \otimes \text{y} = \text{x} \cdot \text{y}^{T}$, where $\text{x}$ and $\text{y}$ are column vectors with same length.

### 3.4 Loss Function Definition

The loss function measures how far our network output is from the target, given that we have already defined the interfaces for the MLP network, we can simply implement the loss function:

```hlsl
public half loss(MyNetwork* network, half x, half y)
{
    let networkResult = network.eval(x, y); // MLP(x,y; θ)
    let gt = groundtruth(x, y);             // target(x,y)
    let diff = networkResult - gt;          // Error vector
    return dot(diff, diff);                 // square of error
}
```

And the `groundtruth` implementation is as trivial as:

```hlsl
public half4 groundtruth(half x, half y)
{
    return
    {
        (x + y) / (1 + y * y),  // f₁(x,y)
        2 * x + y,              // f₂(x,y)
        0.5 * x * x + 1.2 * y,  // f₃(x,y)
        x + 0.5 * y * y,        // f₄(x,y)
    };
}
```

## 4. Backward Pass Design

After implementing the forward pass of the network evaluation, we then need to implement the backward pass. You will see how effortless it is to implement the backward pass with Slang's autodiff. We're going to start the implementation from the end of the workflow to the beginning, because that's how the direction of the gradients flow.

### 4.1 Backward Pass of Loss

To implement the backward derivative of loss function, we only need to mark the function is `[Differentiable]` as we learnt from [last tutorial](auto-diff-tutorial-1.md#forward-mode-differentiation)

```hlsl
[Differentiable]
public half loss(MyNetwork* network, no_diff half x, no_diff halfy)
{
    let networkResult = network->eval(x, y);    // MLP(x,y; θ)
    let gt = no_diff groundtruth(x, y);         // target(x,y)
    let diff = networkResult - gt;              // Error vector
    return dot(diff, diff);                     // square of error
}
```

And from the Slang kernel function, we just need to call the backward mode of the `loss` function like this:
```hlsl
bwd_diff(loss)(network, input.x, input.y, 1.0h);
```

One important thing to notice is that we are using the [`no_diff` attribute](external/slang/docs/user-guide/07-autodiff.html#excluding-parameters-from-differentiation) to decorate the inputs `x` and `y`, as well as `groudtruth` calculation, because in the backward pass, we only care about the result of $\frac{\partial loss}{\partial\theta}$. The `no_diff` attribute just tells Slang to treat the variables or instructions as non-differentiable, so there will be no backward mode instructions generated for those variables or instructions. In this case, since we don't care about the derivative of loss function with respective of input, therefore we can safely mark them as non-differentiable.

Since `loss` function is differentiable now, every instruction inside this function has to be differentiable except those marked as `no_diff`. Therefore, `network->eval(x, y)` must be differentiable, so next we are going to implement the backward pass for this method.

### 4.2 Automatic Propagation to MLP

Just like the `loss` function, the only thing we need to do for `MyNetwork::eval` in order to use them with autodiff is to mark them as differentiable:
```hlsl
public struct MyNetwork
{
    public FeedForwardLayer<4, 16> layer1; // Input to hidden
    public FeedForwardLayer<16, 4> layer2; // Hidden to output

    [Differentiable]
    internal public MLVec<4> _eval(half x, half y)
    {
        // layer2.eval(layer1.eval());
    }

    [Differentiable]
    public half4 eval(no_diff half x, no_diff half y)
    {
        // construct MLVec<4> from x, y
        // call internal _eval
        // convert MLVec<4> to half4
    }
}
```

## 4.3 Custom Backward Pass for Layers

Following the propagation direction of the gradients, we will next implement the backward derivative of FeedForwardLayer. But here we're going to do something different. Instead of asking Slang to automatically synthesize the backward autodiff for us, we will provide a custom derivative implementation. Because the network parameters and gradients are a buffer storage declared in the layer, we will have to provide a custom derivative to write the gradient back to the global buffer storage. You can reference [progagate derivative to storage buffer](auto-diff-tutorial-1.md#how-to-propagate-derivatives-to-global-buffer-storage) in last tutorial to refresh your memory. Another benefit of providing a custom derivative here is that our layer is just matrix multiplication with bias, and its derivative is quite simple, so there are lots of options to accelerate it with specific hardware (e.g. Nvidia tensor cores). Therefore, it's good practice to implement the custom derivative.

First, let's revisit the mathematical formula, given:
$$Z=W\cdot x+b$$
$$Y=LeakyRelu(Z)$$

Where $W \in R^{m \times n}$, $x \in R^{n}$ and $b \in R^{m}$, the
gradient of $W$, $x$ and $b$ will be:
$$Z = W\cdot x + b$$
$$dZ=dY\cdot(z > 0?1:\alpha)$$
$$dW=dZ\cdot x^{T}$$
$$\text{d}b= \text{d}Z$$
$$dx = W^{T} \cdot dZ$$

Therefore, the implementation should be:
```hlsl
[BackwardDerivativeOf(eval)]
public void evalBwd(inout DifferentialPair<MLVec<InputSize>> x, MLVec<OutputSize> dResult)
{
    let Z = eval(x.p); // Re-compute forward pass to get Z
    // Step 1: Backward through activation function
    // dZ = dY * (Z > 0 ? 1 : alpha)
    for (int i = 0; i < OutputSize; i++)
    {
        if (Z.data[i] < 0.0)
        dResult.data[i] *= 0.01h; // Derivative of leaky ReLU
    }

    // Step 2: Accumulate weight gradients
    // dW = dZ * x^T
    outerProductAccumulate(dResult, x.p, weightsGrad);

    // Step 3: Accumulate bias gradients
    // db = dZ
    for (int i = 0; i < OutputSize; i++)
    {
        NFloat originalValue;
        InterlockedAddF16Emulated(biasesGrad + i, dResult.data[i], originalValue);
    }

    // Step 4: Compute input gradients (for chaining to previous layer)
    // dx = W^T * dZ
    let dx= **matMulTransposed<InputSize>(dResult, weights);
    x= {x.p, dx}; // Update differential pair
}
```

The key point in this implementation is that we use atomic add when writing the gradients to the global storage buffer, e.g.:
```hlsl
InterlockedAddF16Emulated(biasesGrad + i, dResult.data[i], originalValue);
```

In the forward pass we already know that the parameters stored in a global storage buffer is shared by all threads, and so are gradients. Therefore, during backward pass, each thread will accumulate its gradient data to the shared storage buffer, we must use atomic add to accumulate all the gradients without race conditions.

The implementation of `outerProductAccumulate` and `matMulTransposed` are trivial for-loop multiplication, so we will not show the details in this tutorial. The complete code can be found at [here](https://github.com/shader-slang/neural-shading-s25/tree/main/hardware-acceleration/mlp-training).

### 4.3 Make the vector differentiable

If we just compile what we have right now, we would generate a compile error because `MLVec` is not a differentiable type, so Slang doesn't expect the signature of backward of layer's eval method to be
```hlsl
public void evalBwd(inout DifferentialPair<MLVec<InputSize>> x, MLVec<OutputSize> dResult)
```

Therefore, we will have to update `MLVec` to make it differentiable:
```hlsl
public struct MLVec<int N> : IDifferentiable
{
    public half data[N];

    [Differentiable]
    public static MLVec<N> fromArray(half[N] values){ ... }

    [Differentiable]
    public NFloat[N] toArray(){ ... }
}
```

### 4.4 Parameter Update

After back propagation, the last step is to update the parameters by the gradients we just computed
```hlsl
public struct Optimzer
{
    public static const NFloat learningRate = 0.01h; // Step size
    public static void step(inout NFloat param, inout NFloat grad)
    {
        param = param - grad * learningRate;    // gradient descent
        grad = 0.f;                             // Reset gradient for next iteration
    }
}
```

## 5. Putting It All Together

We will create two kernel functions, one for the training, and another
one for parameter updating.

The training kernel will be:
```hlsl
[shader("compute")]
[numthreads(256, 1, 1)]
void learnGradient(
    uint32_t tid : SV_DispatchThreadID,
    uniform MyNetwork* network,
    uniform Atomic<uint32_t>* lossBuffer,
    uniform float2* inputs,
    uniform uint32_t count)
{
    if (tid >= count) return;

    var input = (half2)inputs[tid];

    // Compute all gradients automatically
    bwd_diff(loss)(network, input.x, input.y, 1.0h);

    // Also compute loss value for monitoring
    let thisLoss = (float)loss(network, input.x, input.y);
    let maxLoss = WaveActiveMax(thisLoss);
    if (WaveIsFirstLane())
    {
        lossBuffer.max(bit_cast<uint32_t>(maxLoss));
    }
}
```

The parameter update kernel is:

```hlsl
[shader("compute")]
[numthreads(256, 1, 1)]
void adjustParameters(
    uint32_t tid : SV_DispatchThreadID,
    uniform NFloat* params,
    uniform NFloat* gradients,
    uniform uint32_t count)
{
    if (tid >= count) return;

    // Apply gradient descent
    Optimizer::step(params[tid], gradients[tid]);
}
```

The training process will be a loop that alternatively invokes the slang compute kernel `learnGradient` and `adjustParameters`, until the loss converges to an acceptable threshold value.

The host side implementation for this example is not shown, it will be boilerplate code to setup the graphics pipeline and allocate buffers for parameters. You can access the [github repo](https://github.com/shader-slang/neural-shading-s25/tree/main/hardware-acceleration/mlp-training) for complete code of this example, which includes the host side implementation. Alternatively, you can use the more powerful tool [SlangPy](https://github.com/shader-slang/slangpy) to run this MLP example without writing any graphics boilerplate code.
