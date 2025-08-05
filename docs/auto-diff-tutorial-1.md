---
title: Slang Automatic Differentiation Tutorial - 1
layout: page
description: Autodiff tutorial 1
permalink: "/docs/auto-diff-tutorial-1"
intro_image_absolute: true
intro_image_hide_on_mobile: false
---

## Introduction to Slang\'s Automatic Differentiation (AutoDiff)

This tutorial explains the automatic differentiation (autodiff) capabilities within the Slang shading language, covering both forward and backward modes, handling custom types, defining custom derivatives and providing example use cases.

To enable autodiff for a function in Slang, you simply mark the function with `[Differentiable]`. This instructs the compiler to automatically generate both **forward mode** and **backward mode** gradient propagation functions for it as long as the function is differentiable. In the following sections, we'll explore how each mode works in theory and practice, starting with forward mode autodiff.

### Forward Mode Differentiation

Given a function $s = square(x, y)$, the goal is to find out how changes of the input parameters will impact the output. To do this, we must compute derivative of $s$ with respect to $x$ and $y$, namely $\frac{\partial s}{\partial x}dx$ and $\frac{\partial s}{\partial y}dy$, so the **forward mode automatic differentiation** computes $fwd(s) = \frac{\partial s}{\partial x}dx + \frac{\partial s}{\partial y}dy$, that is to compute **derivatives** of a function by augmenting each variable in a computation with its **rate of change**.

If we write this derivative calculation into matrix multiplication form, we will have $$fwd(s) = \left\lbrack \frac{\partial s}{\partial x},\frac{\partial s}{\partial y} \right\rbrack\begin{bmatrix}dx \\ dy\end{bmatrix}$$

And this matrix $\left\lbrack \frac{\partial s}{\partial x}\,\frac{\partial s}{\partial y} \right\rbrack$is called the **Jacobian Matrix**. In this simple example, the function $square(x,\, y)$ takes two input values and outputs one value, so it's a $\mathbb{R}^{2}\mathbb{\, \rightarrow R}$ mapping, and the shape of the Jacobian matrix will be $\mathbb{R}^{1 \times 2}$. To be more general, if a function is $\mathbb{R}^{N} \rightarrow \mathbb{R}^{M}$mapping, the shape of its Jacobian matrix will be $\mathbb{R}^{M \times N}$. You can find a more comprehensive explanation of the Jacobian matrix in thi [wiki page](https://en.wikipedia.org/wiki/Jacobian_matrix_and_determinant).


>**Extended Reading:**
>
>You may have questions about what exactly $dx$ (or $dy$) is. The answer is directly related to the name of "forward mode" differentiation. According to our definition above, forward mode differentiation tries to tell us how the output deviates if we give input a change. So $dx$ in this context represents the change in the input $x$. $x$ can be an independent variable where we can just assign a change value (e.g. $dx= 1$) to it. But if $x$ is a function that depends on another input variable, e.g. $x = f(\theta)$, and we want to study how change of $\theta$ impacts the output of $s$, in this scenario, $dx = fwd(x) = \frac{\partial x}{\partial \theta}d\theta$, and we can assign 1 to $d\theta$, so its change will "propagate forward" to $x $, and the rate of change of $x$ will "forward" to $s$. And this is why this computation is called forward mode differentiation, because it keeps forwarding the changs from the input variables all the way down to the output variables.
>Forward mode autodiff aims to compute the **Jacobian Matrix vector product**, which evaluates the derivates of a function's output given the rate of change of its inputs. For example, by plugging a one-hot vector (a binary vector where exactly one element is one) into the Jacobian Matrix vector product, we can get the partial derivative of $s$ with respect to the inputs:
>$$\frac{\partial s}{\partial x}\  = \ \left\lbrack \frac{\partial s}{\partial x}\,\frac{\partial s}{\partial y} \right\rbrack\begin{bmatrix}1 \\0\end{bmatrix} \text{  and  }\frac{\partial s}{\partial y}\  = \ \left\lbrack \frac{\partial s}{\partial x}\,\frac{\partial s}{\partial y} \right\rbrack\begin{bmatrix}0 \\1\end{bmatrix}$$


Now let us see how to use Slang's autodiff to compute the forward mode derivatives. Consider the function $square(x, y)$ defined as follows:
```hlsl
float square(float x, float y)
{
    return x * x + y * y;
}
```

- 1\.  Mark the function as `[Differentiable]` to tell Slang to automatically generate a forward (and backward) mode derivate propagation function at compile time.
```hlsl
[Differentiable]
float square(float x, float y)
{
    return x * x + y * y;
}
```

- 2\.  Construct a differential pair using `diffPair`. This is Slang's built-in function to create a pair holding both the original (primal) value and its derivative. E.g.

```hlsl
let x_pair = diffPair(3.0f, 1.0f);
```

it means $x=3.0$ and $dx = 1.0$. The value of $x$ is just randomly chosen, and we choose $dx = 1.0$, because we want the coefficient of $\frac{\partial s}{\partial x}$ to be 1 in the forward model computation. Similarly, we can construct differential pair for $y$ as well, so:

```hlsl
let y_pair = diffPair(4.0f, 1.0f);
```

- 3\.  Invoke the forward mode differentiation function by using `fwd_diff`, e.g.

```
let result = fwd_diff(square)(x_pair, y_pair);
```

The result variable is also a differential pair, where the `result.p` is the primal value, which is the result of the $square(x, y)$, and `result.d` is the derivative value which is $\frac{\partial s}{\partial x} + \frac{\partial s}{\partial y}$.

If we combine above steps together, the complete code is as follows:

```hlsl
let x_pair = diffPair(3.0f, 1.0f);
let y_pair = diffPair(4.0f, 1.0f);
let result = fwd_diff(square)(x_pair, y_pair);
printf("dResult = %f\n", result.d);
```

In many applications (e.g. gradient descent), we might be more interested in the partial derivative of a function with respect to each independent variable instead of the sum of all of them. Given the definition of the forward mode, we described above, it's easy to write Slang code to achieve that. Take this $square$ function as example, we can construct the differential pair of $y$ by setting the derivative field to 0:

```hlsl
let y_pair = diffPair(4.0f, 0.0f);
let result = fwd_diff(square)(x_pair, y_pair);
```

such that $dy = 0.0$, this piece of code will calculate $\frac{\partial s}{\partial x}\  = \ \left\lbrack \frac{\partial s}{\partial x}\,\frac{\partial s}{\partial y} \right\rbrack\begin{bmatrix}
1 \\
0
\end{bmatrix}$ , so the `result.d` will equal to $\frac{\partial s}{\partial x}$. Similarly, we can play the same trick to x to get $\frac{\partial s}{\partial y}$. As you may notice, in order to achieve partial derivatives of $s$ w.r.t. to the two parameters $x$ and $y$, we have to invoke forward mode differentiation twice. In real world gradient descent-based applications, the number of parameters is easily very large (e.g. 1 million). This means that we must invoke the forward mode autodiff as many times as the number of parameters to get all the partial derivatives, which is impractical, and this is the known limitation of forward mode differentiation. Therefore, the backward mode differentiation is more frequently used in this scenario, and that's what we will explore next.

### Backward Mode Differentiation

For ease of comparison with forward mode, let's keep using $s = square(x,y)$. Now assume we have a loss function $l=h(s)$. The goal is to compute $\frac{\partial l}{\partial x}$ and $\frac{\partial l}{\partial y}$. Applying the chain rule, we can easily form $\frac{\partial l}{\partial x}=\frac{\partial l}{\partial s}\frac{\partial s}{\partial x}$ and $\frac{\partial l}{\partial y}=\frac{\partial l}{\partial s}\frac{\partial s}{\partial y}$. We can also convert this into matrix multiplication form as:

$$\begin{bmatrix}
\frac{\partial l}{\partial x} \\
\frac{\partial l}{\partial y}
\end{bmatrix}=
\begin{bmatrix}
\frac{\partial l}{\partial s}
\end{bmatrix}
\begin{bmatrix}
\frac{\partial s}{\partial x} \frac{\partial s}{\partial y}
\end{bmatrix}
\text{  or  }
\begin{bmatrix}
\frac{\partial l}{\partial x} \\
\frac{\partial l}{\partial y}
\end{bmatrix}=
\begin{bmatrix}
\frac{\partial l}{\partial s}
\end{bmatrix}
\begin{bmatrix}
\frac{\partial s}{\partial x}\\\frac{\partial s}{\partial y}
\end{bmatrix}^T$$

By using the matrix-multiplication form, it's easy to identify the **Jacobian Matrix,** however this time the formula becomes a **vector-Jacobian Matrix product.** And this is the **backward mode differentiation,** it computes the derivatives by propagating the derivative of output to each input. Interestingly, if we set the vector to all one\'s vector, namely $\begin{bmatrix} \frac{\partial l}{\partial s} \end{bmatrix}=\begin{bmatrix}1\end{bmatrix}$, we will get the derivatives of $s$ w.r.t. to $x$ and $y$:

$$bwd(s)=\begin{bmatrix}1\end{bmatrix}
\begin{bmatrix}
\frac{\partial s}{\partial x}\\\frac{\partial s}{\partial y}
\end{bmatrix}^T,$$
where the right hand-side of this equation is the result of the backward mode differentiation.

Slang's syntax for the backward mode autodiff is similar to forward:

- 1\.  Same as forward mode, mark the function as `[Differentiable]`.

- 2\.  Construct differential pair. However, in backward mode, we will leave the derivative field as 0 because that field is used as output to store the result derivative. Therefore, we will construct it as:

```hlsl
var x_pair = diffPair(3.0f, 0.0f);
var y_pair = diffPair(4.0f, 0.0f);
```

Another thing to notice is we use keyword "var" instead of "let" here because "let" will define the variable as constant, but we need x to be an inout variable so it can store the resulting derivative.

- 3\.  Setting $\frac{\partial l}{\partial s}$ to 1:

```hlsl
let dlds = 1.0f;
```

- 4\.  Invoke backward mode autodiff by using `bwd_diff`, e.g.:

```hlsl
bwd_diff(square)(x_pair, y_pair, dlds);
```

After this call, `x_pair.d` and `y_pair.d` will store the value of $\frac{\partial l}{\partial x}$ and $\frac{\partial l}{\partial y}$, that will be $\frac{\partial s}{\partial x}$ and $\frac{\partial s}{\partial y}$ in this case.

Combine all steps together, the complete code will be:

```hlsl
var x_pair = diffPair(3.0f, 0.0f);
var y_pair = diffPair(4.0f, 0.0f);
let dlds = 1.0f;
let result = bwd_diff(square)(x_pair, y_pair, dlds);
printf("dL/dx = %f, dL/dy = %f\n", x_pair.d, y_pair.d);
```

## AutoDiff with User-Defined Types

After warming up on the autodiff concept, a natural question is "How does autodiff work with user-defined types?". The short answer is using the Slang **Differentiable type system.**

**Differentiable vs. Non-Differentiable Types**:

Slang distinguishes between types that can be differentiated (differentiable) and those that cannot (non-differentiable). Take an example, in a function

```hlsl
float run(int op, float a, float b);
```

int type for op is a **non-differentiable type**, while float type for a and b is a **differentiable type.** When synthesizing the autodiff functions, Slang will change differentiable types to DifferentialPair and will not change the non-differentiable type. Therefore, the signature of forward mode of function `run` will be

```hlsl
DifferentialPair fwd_diff(run)(int op, DifferentialPair<float> a, DifferentialPair<float> b);
```

and this is why we need to construct DifferentialPair when calling the forward mode differentiation function.

By default, following types are differentiable in Slang:

-   **Scalars:** `float`, `double` and `half`.

-   **Vector/Matrix:** `vector` and `matrix` of `float`, `double` and `half`
    types.

-   **Arrays:** `T[n]` is differentiable if `T` is differentiable**.**

-   **Tuples:** `Tuple<each T>` is differentiable if `T` is differentiable.

To make a custom type differentiable, Slang provides a built-in `IDifferentiable` interface, so that any user-defined types conforming to this interface will be treated as differentiable types. The interface is defined as:

```hlsl
interface IDifferentiable
{
    associatedtype Differential : IDifferentiable
    where Differential.Differential == Differential;
    static Differential dzero();
    static Differential dadd(Differential, Differential);
    static Differential dmul<T : __BuiltinRealType>(T, Differential);
};
```

The interface defines requirements that a type must satisfy to be considered differentiable, such as how to represent zero gradient, how to perform multiplication and add operations on the gradients, and the definition of the type of gradients. Taking the previous square example, let's change the input to a custom struct type Point such that

```hlsl
struct Point
{
    float x;
    float y;
}

[Differentiable]
float square(Point p)
{
    return p.x * p.x + p.y * p.y;
}
```

If we don't have any constraints on type Point, the signature of the forward mode of square is

```hlsl
DifferentialPair fwd_diff(square)(Point p);
```

and there is no derivative calculated for the point because Slang treats Point as a non-differentiable type, the result derivative will be 0. In order to make Point differentiable, we need to make Point conform to
`IDifferentiable`:
```hlsl
struct Point: IDifferentiable
{
    float x;
    float y;
}
```

Now the signature of forward mode of `square` becomes:
```hlsl
DifferentialPair<float> fwd_diff(square)(DifferentialPair<Point> p);
```

Thus, we can call the forward mode as:

```hlsl
void main()
{
    let p_pair = diffPair(Point(3.0f, 4.0f), Point(1.0f, 1.0f));
    let result = fwd_diff(square)(p_pair);
    printf("dResult = %f\n", result.d)
}
```

Notice that we never provided the definition of `dzero`/`dadd`/`dmul` required by the IDifferentiable interface. This is allowed because the Slang compiler automatically synthesizes these methods even if the user doesn't explicitly provide them.

## Custom Derivatives

No AutoDiff implementation is guaranteed to always produce the most efficient derivative code nor the most numerical stable result, therefore sometimes you may want to provide your own implementation for forward and backward mode gradient propagation functions instead of using the compiler-generated ones. Slang also provides a way to allow implementing the custom derivatives.

For custom forward mode implementation, you can use `[ForwardDerivativeOf(<func>)]` attribute to decorate your own implementation of derivatives, where `<func>` is the original function, e.g.

```hlsl
[ForwardDerivativeOf(square)]
DifferentialPair fwd_square(DifferentialPair<float> x, DifferentialPair<float> y)
{
    return diffPair(square(x.p, y.p), 2.0f * (x.p * x.d + y.p * y.d));
}
```

Alternatively, you can use `[ForwardDerivative(<func>)]` attribute to decorate the original function, where `<func>` is the derivative implementation function, e.g.

```hlsl
[ForwardDerivative(fwd_square)]
float square(float x, float y);

DifferentialPair fwd_square(DifferentialPair<float> x, DifferentialPair<float> y)
{
    return diffPair(square(x.p, y.p), 2.0f * (x.p * x.d + y.p *y.d));
}
```

Similarly, this syntax can also be applied in backward mode, for example:

```hlsl
[BackwardDerivativeOf(square)]
void bwd_square(inout DifferentialPair<float> x_pair, inout DifferentialPair<float> y_pair, float dOut)
{
    x_pair = diffPair(x.p, 2.0f * x.p * dOut);
    y_pair = diffPair(y.p, 2.0f * y.p * dOut);
}
```

And of course, another method:

```hlsl
[BackwardDerivativeOf(bwd_square)]
float square(float x, float y);

void bwd_square(inout DifferentialPair<float> x_pair, inout DifferentialPair<float> y_pair, float dOut)
{
    x_pair = diffPair(x.p, 2.0f * x.p * dOut);
    y_pair = diffPair(y.p, 2.0f * y.p * dOut);
}
```

In those cases, Slang compiler will pick your provided implementations.

### How to propagate derivatives to global buffer storage

In the given example in this tutorial, all the variables used in the functions are just local variables. Consider if the variable y in the square function is coming from some global storage, e.g

```hlsl
RWStructuredBuffer<float> g_buffer;

[Differentiable]
float square(float x, int idx)
{
    float y = g_buffer[idx];
    return x * x + y * y;
}
```

Where does the derivative of y propagate? In this case, variable y is treated as a non-differentiable type as the source of this variable is buffer storage which is a non-differentiable type. So custom derivative implementation is very useful to solve this problem.

- 1\.  First, we can wrap the buffer access into a function which is differentiable

```hlsl
RWStructuredBuffer<float> g_buffer;

float getY(int idx) { return g_buffer[idx]; }

[Differentiable]
float square(float x, int idx)
{
    float getY(idx);
    return x * x + y * y;
}
```

- 2\.  We can provide a custom derivative implementation for this function

```hlsl
RWStructuredBuffer<Atomic<float>> yGradBuffer;

float bwd_getY(int idx, float dOut)
{
    yGradBuffer[idx] += dOut;
}
```

During synthesis of the backward mode of `square` function, when the compiler sees the `getY` call instruction, it will automatically pick its custom backward implementation `bwd_getY`.

### Debugging Trick by Using Custom Derivative Implementation

Since the autodiff synthesization process is totally opaque, the generated code is invisible to users. Though you can specify `"-target hlsl"` to translate the target code to some textual form, the autodiff code is not intended to be easy to read, especially when the original functions are sophisticated. Therefore, debugging the autodiff code could be a challenging task. We provide a debug option to help you check the gradients flow during computation.

Looking at the previous example of the use case of custom derivative implementation, you might be aware that this technique can also be used to watch the intermediate gradients. Given an implementation of square as follow:

```hlsl
[Differentiable]
float square(float x, int idx)
{
    float a = x * x;
    float b = y * y;
    return a + b;
}
```

Assume we want to check whether the gradient of b is calculated correct, we can wrap the computation of b into a differentiable function, and defined the custom derivative of this function so that we can print or save the derivative flew into this function, for example:

```hlsl
[Differentiable]
float square(float x, int idx)
{
    float a = x * x;
    float b = debugGrad(y * y);
    return a + b;
}

float debugGrad(float x) { return x; }

[BackwardDerivativeOf(debugGrad)]
void debugGradBwd(inout DifferentialPair<float> x_pair, float dOut)
{
    printf("Gradient is %f\n", dOut);
    x_pair = diffPair(x.p, dOut);
}
```

With this custom derivative technique, we can flexibly check if the gradient of `y * y` is computed correctly.

In the next tutorial, we will introduce more details and advanced usages of autodiff by building a simple MLP example from scratch.
