---
title: Autodiff Tips and Tricks: Custom Derivatives
layout: page
description: Autodiff Tips and Tricks: Custom Derivatives
permalink: "/docs/autodiff-tips-custom-diffs"
intro_image_absolute: true
intro_image_hide_on_mobile: false
---

# Autodiff Tips and Tricks: When to Use Custom Derivatives

Slang's automatic differentiation (autodiff) system is powerful and can handle a wide range of functions. However, there are specific scenarios where defining a custom derivative can be beneficial, offering more control and accuracy. This guide outlines the major examples of when you might want to consider writing your own custom derivative, rather than relying solely on Slang's autodiff capabilities.

# 1\. Opaque Functions

Opaque functions are those where the internal operations are not visible or accessible to Slang's autodiff system. This often occurs with functions that interact with external systems or hardware, such as:

* **Hardware-accelerated texture filtering:** When performing operations like texture filtering, the underlying mathematical process may not be exposed in a way that allows Slang to compute a derivative automatically. In such cases, you would need to define a custom derivative that approximates or accurately represents the sensitivity of the output to the input.

For these functions, since the autodiff system cannot "see" inside to compute the derivative, providing a custom derivative allows you to still incorporate them into your differentiable computations.

```slang
[BackwardDerivative(externalFunction_bwd)]
float externalFunction(float x)
{
    // This calls an external library or hardware function
    // that Slang cannot differentiate automatically
    return someExternalLibraryCall(x);
}

void externalFunction_bwd(inout DifferentialPair<float> x, float dOut)
{
    // Approximate the derivative using finite differences
    const float epsilon = 1e-6;
    float fwd = someExternalLibraryCall(x.p + epsilon);
    float bwd = someExternalLibraryCall(x.p - epsilon);
    float derivative = (fwd - bwd) / (2.0 * epsilon);

    x = diffPair(x.p, derivative);
}
```

This example shows one option to handle an opaque function that calls an external library. Since Slang cannot see inside the external function, we can use finite differences to approximate the derivative.

# 2\. Buffer Accesses

Functions whose output depends on values retrieved from memory based on an input (e.g., accessing an RWStructuredBuffer on the GPU, or reading from a raw pointer CPU-side) introduce side-effects that automatic differentiation struggles to handle. This can include things like race conditions or ambiguous derivative write-back locations. Additionally, the lookup index itself is non-continuous. Therefore, custom derivatives are often necessary to accurately represent "change" at these points, potentially involving subgradients or specific approximations.

```slang
RWStructuredBuffer<float> myBuffer;
RWStructuredBuffer<Atomic<float>> gradientBuffer;  // Global buffer for gradients

[BackwardDerivative(loadFloat_bwd)]
float loadFloat(uint idx)
{
    return myBuffer[idx];
}

void loadFloat_bwd(uint idx, float dOut)
{
    // Safely accumulate gradient to global buffer using atomic addition
    gradientBuffer[idx] += dOut;
}
```

This example shows one way to handle differentiation of buffer access. The `loadFloat` function reads from a buffer, and its custom derivative `loadFloat_bwd` safely accumulates gradients to a global buffer using atomic operations to avoid race conditions when multiple threads might write to the same location.

# 3\. Numerically Unstable Functions

Numerical stability refers to how well a computation preserves accuracy when faced with small changes in input or when intermediate values become very large or very small. Some complex mathematical functions can be numerically unstable, leading to issues like:

* **Divisions by zero:** Highly complex expressions can inadvertently lead to denominators approaching zero, resulting in undefined or infinite derivatives.  
* **Gradient explosion or vanishing:** In deep learning contexts, gradients can become extremely large (explosion) or extremely small (vanishing), hindering effective optimization.

By defining a custom derivative, you can implement more robust numerical methods that mitigate these issues, ensuring that your derivatives are well-behaved and do not lead to computational errors or poor training performance. This might involve re-parameterizations or specialized derivative formulas.

```slang
[BackwardDerivative(safeDivide_bwd)]
float safeDivide(float numerator, float denominator)
{
    const float epsilon = 1e-8;
    return numerator / max(denominator, epsilon);
}

void safeDivide_bwd(inout DifferentialPair<float> numerator, inout DifferentialPair<float> denominator, float dOut)
{
    const float epsilon = 1e-8;
    const float maxGradient = 1e6;  // Prevent gradient explosion
    float denomStable = denominator.p + epsilon;
    // Clamp gradients to prevent explosion when denominator is very small
    float dNumerator = clamp(dOut / denomStable, -maxGradient, maxGradient);
    float dDenominator = clamp(-dOut * numerator.p / (denomStable * denomStable), -maxGradient, maxGradient);

    numerator = diffPair(numerator.p, dNumerator);
    denominator = diffPair(denominator.p, dDenominator);
}
```

This example shows how to handle division that could be numerically unstable. The `safeDivide` function adds a small epsilon to prevent division by zero, and its custom derivative clamps the gradients to prevent explosion when the denominator is very small.

# Mixing Custom and Automatic Differentiation

One of the key strengths of Slang's autodiff system is its flexibility. You are not forced to choose between entirely custom derivatives or entirely automatic differentiation. Slang allows you to **mix custom and automatic differentiation**. 

This means you can address just the parts of your function stack that truly need custom derivatives (e.g., the opaque or numerically unstable sections) while still leveraging Slang's powerful autodiff for the rest of your computations. This hybrid approach offers the best of both worlds: the convenience and efficiency of automatic differentiation where it's most effective, and the precision and control of custom derivatives where they are absolutely necessary.

For examples of this in practice, take a look at some of the [experiments]() in our SlangPy samples repository. In particular, you can see a user-defined custom derivative function invoking bwd\_diff() to make use of automatic differentiation for the functions it calls out to in the [differentiable splatting experiment](https://github.com/shader-slang/slangpy-samples/blob/main/experiments/diff-splatting/diffsplatting2d.slang#L512).

# Approximating Derivatives for Inherently Undifferentiable Functions

While some functions are mathematically discontinuous or opaque, making them undifferentiable in a strict sense, it's often still possible and desirable to define a custom derivative that approximates their behavior or provides a useful "gradient" for optimization purposes. This is particularly crucial in machine learning and computational graphics where such functions are common. Here's how you might approach creating a custom derivative for something that seems inherently undifferentiable:

* **Subgradients for Discontinuous Functions**:  
  For functions with sharp corners or jumps (like ReLU, absolute value, or step functions), the derivative is undefined at specific points. Automatic differentiation systems like Slang's handle these cases using established conventions, but you may want custom behavior. A subgradient is not a unique value but rather a set of possible "slopes" at the non-differentiable point. For example, for ReLU:  
  * If input \> 0, derivative is 1\.  
  * If input \< 0, derivative is 0\.  
  * If input \= 0, the subgradient can be any value between 0 and 1 (inclusive).  
    When implementing a custom derivative, you typically pick a specific value from this subgradient set (e.g., 0 or 0.5) to ensure a deterministic derivative for your autodiff system.  

Slang's autodiff system includes built-in conventions for handling many discontinuous functions that would otherwise be problematic for differentiation. For example, Slang can automatically generate derivatives for the `max()` function even though it's not differentiable at the point where `x = y`. When the inputs are equal, Slang assigns half the gradient to each input, ensuring that gradients flow through both branches of the computation. Similarly, for `clamp()` function, when the input equals the minimum or maximum bounds, Slang propagates the gradient to the input `x` rather than to the `min` or `max` parameters, making a choice that favors the primary input. Similar conventions exist for other discontinuous functions like `min()`, `abs()`, and conditional operations. These conventions are designed to provide sensible gradients that work well in practice, even when the mathematical derivative is undefined at certain points.

* **Finite Difference Approximation**:  
  If you have no analytical way to determine the derivative, you can resort to numerical approximation using finite differences. This method involves evaluating the function at two closely spaced points and calculating the slope between them. While computationally more expensive and potentially less accurate than analytical derivatives, finite differences can provide a workable approximation for opaque or highly complex functions where direct differentiation is impossible. You would implement this calculation in your custom derivative function. See the example in the "Opaque Functions" section above for a practical implementation of this technique.  
* **Surrogate Gradients (for Hard Discontinuities)**:  
  For functions with truly "hard" discontinuities (e.g., a direct lookup in a table based on an index, or a strict "if-else" branching that completely changes the computation), a subgradient or finite difference might not be suitable. In such cases, you might use a surrogate gradient. This involves replacing the undifferentiable part of the computation with a differentiable approximation solely for the purpose of backpropagation.  
  For example, if you have a \`floor()\` operation (which is not differentiable), you might, during the backward pass, pretend it was an identity function (\`x\`) or a smoothed version of it to allow gradients to flow through. The forward pass still uses the exact \`floor()\` operation, but the backward pass uses your custom, differentiable surrogate. This allows the optimization algorithm to still "feel" a gradient and make progress, even if it's not the true mathematical derivative.  
* **Domain-Specific Knowledge and Heuristics**:  
  Sometimes, the best "derivative" for an undifferentiable function comes from understanding the underlying problem and applying domain-specific heuristics. For instance, in rendering, if a function represents a decision boundary (e.g., inside/outside an object), your custom derivative might encode how sensitive that decision is to small changes in input, even if the boundary itself is sharp. This often involves defining a "gradient" that pushes the input towards the desired outcome based on prior knowledge.

When choosing an approximation method, consider the trade-offs between accuracy, computational cost, and how well the approximated derivative guides your optimization or analysis. The goal is to provide a "signal" to the autodiff system that allows it to effectively propagate changes and facilitate whatever computation or optimization you are performing.