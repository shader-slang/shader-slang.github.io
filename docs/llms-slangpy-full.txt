# SlangPy Documentation

> SlangPy is a Python library for writing GPU compute kernels in the Slang shading language. It allows you to write compute shaders using Slang's syntax and execute them from Python with support for NumPy arrays, PyTorch tensors, automatic differentiation, and advanced features like broadcasting and type methods.

## Getting Started

### Installation

SlangPy is available as pre-compiled wheels via PyPi. Installing SlangPy is as simple as running:

```bash
pip install slangpy
```

To enable PyTorch integration, simply `pip install pytorch` as usual and it will be detected automatically by SlangPy.

You can also compile SlangPy from source:

```bash
git clone https://github.com/shader-slang/slangpy.git --recursive
cd slangpy
pip install -r requirements-dev.txt
pip install .
```

See the developer guide for more detailed information on how to compile from source.

## Basic Tutorials

### Your First Function

In this example, we'll initialize SlangPy, create a simple Slang function, and call it from Python.

First, let's define a simple Slang function to add two numbers together:

```slang
// example.slang

// A simple function that adds two numbers together
float add(float a, float b)
{
    return a + b;
}
```

Next, we'll create a Python script to initialize SlangPy, load the Slang module, and call the function:

```python
## main_scalar.py

import slangpy as spy
import pathlib

# Create a SlangPy device; it will look in the local folder for any Slang includes
device = spy.create_device(include_paths=[
        pathlib.Path(__file__).parent.absolute(),
])

# Load the module
module = spy.Module.load_from_file(device, "example.slang")

# Call the function and print the result
result = module.add(1.0, 2.0)
print(result)

# SlangPy also supports named parameters
result = module.add(a=1.0, b=2.0)
print(result)
```

Under the hood, the first time this function is invoked, SlangPy generates a compute kernel (and caches it in a temporary folder). This kernel handles loading scalar inputs from buffers, calling the `add` function, and writing the scalar result back to a buffer.

While this is a fun demonstration, dispatching a compute kernel just to add two numbers isn't particularly efficient! However, now that we have a functioning setup, we can scale it up and call the function with arrays instead:

```python
## main_numpy.py

# ... initialization here ...

# Create a couple of buffers containing 1,000,000 random floats
a = np.random.rand(1000000).astype(np.float32)
b = np.random.rand(1000000).astype(np.float32)

# Call our function and request a numpy array as the result (the default would be a buffer)
result = module.add(a, b, _result='numpy')

# Print the first 10 results
print(result[:10])
```

SlangPy supports a wide range of data types and can handle arrays with arbitrary dimensions. This example demonstrates how a single Slang function can be called with both scalars and NumPy arrays. Beyond this, SlangPy also supports many more types such as buffers, textures, and tensors.

### Return Types

Slangpy can generate different types of container to hold the returned results of a Slang function. This is convenient for getting results in a preferred container type, such as a numpy array, texture, or tensor.

The `_result` can be `'numpy'`, `'texture'`, or `'tensor'`. You can also use `_result` to specify the type directly, like `numpy.ndarray`, `slangpy.Texture`, or `slangpy.Tensor`. Or you can reuse an existing variable of one of those types by passing it directly.

Example using a texture as the return type:

```python
# Create a couple of buffers with 128x128 random floats
a = np.random.rand(128, 128).astype(np.float32)
b = np.random.rand(128, 128).astype(np.float32)

# Call our function and ask for a texture back
result = module.add(a, b, _result='texture')

# Print the first 5x5 values
print(result.to_numpy()[:5, :5])

# Display the result using tev
spy.tev.show(result, name='add random')
```

### Buffers

SlangPy provides two key wrappers around classic structured buffers: `NDBuffer` and `Tensor`.

The `NDBuffer` type takes a structured buffer with a defined stride and size and adds:
- **Data type**: A `SlangType`, which can be a primitive type (e.g., float, vector) or a user-defined Slang struct.
- **Shape**: A tuple of integers describing the size of each dimension, similar to the shape of a NumPy array or Torch tensor.

Example with a custom Slang type:

```slang
// Currently, to use custom types with SlangPy, they need to be explicitly imported.
import "slangpy";

// example.slang
struct Pixel
{
    float r;
    float g;
    float b;
};

// Add two pixels together
Pixel add(Pixel a, Pixel b)
{
    Pixel result;
    result.r = a.r + b.r;
    result.g = a.g + b.g;
    result.b = a.b + b.b;
    return result;
}
```

Creating and initializing buffers:

```python
# Create two 2D buffers of size 16x16
image_1 = spy.NDBuffer(device, dtype=module.Pixel, shape=(16, 16))
image_2 = spy.NDBuffer(device, dtype=module.Pixel, shape=(16, 16))

# Populate the first buffer using a cursor
cursor_1 = image_1.cursor()
for x in range(16):
    for y in range(16):
        cursor_1[x + y * 16].write({
            'r': (x + y) / 32.0,
            'g': 0,
            'b': 0,
        })
cursor_1.apply()

# Populate the second buffer directly from a NumPy array
image_2.copy_from_numpy(0.1 * np.random.rand(16 * 16 * 3).astype(np.float32))
```

Calling the function:

```python
# Call the module's add function
result = module.add(image_1, image_2)
```

SlangPy understands that these buffers are effectively 2D arrays of `Pixel`. It infers a 2D dispatch (16×16 threads in this case), where each thread reads one `Pixel` from each buffer, adds them together, and writes the result into a third buffer.

### Textures

In this example, we'll use SlangPy to read from and write to a texture, showcasing simple broadcasting and `inout` parameters.

Slang code:

```slang
// Add an amount to a given pixel
void brighten(float4 amount, inout float4 pixel)
{
    pixel += amount;
}
```

Generating and brightening the texture:

```python
# Generate a random image
rand_image = np.random.rand(128 * 128 * 4).astype(np.float32) * 0.25
tex = device.create_texture(
    width=128,
    height=128,
    format=spy.Format.rgba32_float,
    usage=spy.TextureUsage.shader_resource | spy.TextureUsage.unordered_access,
    data=rand_image
)

# Display it with tev
spy.tev.show(tex, name='photo')

# Call the module's brighten function, passing:
# - a float4 constant broadcast to every pixel
# - the texture as an inout parameter
module.brighten(spy.float4(0.5), tex)

# Display the result
spy.tev.show(tex, name='brighter')
```

In this example:
- SlangPy infers a **2D dispatch** because a 2D texture of `float4` is passed into the function.
- The **first parameter** (a single `float4`) is **broadcast** to every thread.
- The **second parameter** (marked `inout`) allows both reading from and writing to the texture.

### Nested Types

SlangPy supports multiple ways of passing structured data to functions. The simplest approach is through Python dictionaries.

Example passing a dictionary:

```slang
void copy(float4 src, out float4 dest)
{
    dest = src;
}
```

```python
# Use dictionary nesting to copy structured source values into the texture
module.copy(
    src={
        'x': 1.0,
        'y': spy.rand_float(min=0, max=1, dim=1),
        'z': 0.0,
        'w': 1.0
    },
    dest=tex
)
```

Here `x`, `z` and `w` are set to constant values, while `y` is set to a random float between 0 and 1. However they could just as easily be NumPy arrays, NDBuffers or even (in this case) 1D textures!

For generic functions that need explicit type information:

```python
# Explicitly declare the type using '_type'
module.copy_vector(
    src={
        '_type': 'float4',
        'x': 1.0,
        'y': spy.rand_float(min=0, max=1, dim=1),
        'z': 0.0,
        'w': 1.0
    },
    dest=tex
)
```

The `map` method serves as SlangPy's primary mechanism for resolving type information in complex scenarios:

```python
# Map argument types explicitly
module.copy_generic.map(src='float4', dest='float4')(
    src={
        'x': 1.0,
        'y': spy.rand_float(min=0, max=1, dim=1),
        'z': 0.0,
        'w': 1.0
    },
    dest=tex
)
```

### Type Methods

SlangPy can also call methods of Slang types, whether mutable or immutable. This is achieved using two key classes:
- `InstanceBuffer`: Represents a list of instances of a Slang type stored in a single `NDBuffer`.
- `InstanceList`: Represents a list of instances of a Slang type stored in SOA (Structure of Arrays) form.

Example with a Particle class:

```slang
import "slangpy";

struct Particle
{
    float3 position;
    float3 velocity;

    __init(float3 p, float3 v)
    {
        position = p;
        velocity = v;
    }

    [mutating]
    void update(float dt)
    {
        position += velocity * dt;
    }
};
```

Creating and initializing particles:

```python
# Create a buffer of particles (.as_struct ensures proper Python typing)
particles = spy.InstanceBuffer(
    struct=module.Particle.as_struct(),
    shape=(10,)
)

# Construct particles with a position of (0, 0, 0) and random velocities
particles.construct(
    p=spy.float3(0),
    v=spy.rand_float(-1, 1, 3)
)

# Update particle positions with a time delta of 0.1
particles.update(0.1)
```

### Broadcasting

SlangPy's primary job is to take a function that is designed to run on a single unit of data, and convert it to a vector function that runs on batches of data in parallel.

Broadcasting terminology:
- `Dimensionality`: The number of dimensions of a value. For example, a 1D buffer has a `dimensionality` of 1.
- `Shape`: The size of each dimension of a value. For example, a 1D buffer of size 3 has a `shape` of (3,).

Broadcasting process:
1. Calculate the largest `dimensionality` of all arguments. This determines `dimensionality` of the kernel and its output.
2. For each dimension, all the argument sizes must be compatible. Two sizes are compatible if they are equal or 1.
3. If a dimension's size is 1, it is broadcast to match the size of the other arguments.

Examples:

```python
# All dimensions match
A       (10,3,4)
B       (10,3,4)
Out     (10,3,4)

# A's first dimension is 1, so it is broadcast
A       (10,1,4)
B       (10,3,4)
Out     (10,3,4)

# A single value is broadcast to all dimensions of the output
A       ()
B       (10,3,4)
Out     (10,3,4)
```

### Mapping

Mapping provides a way to explicitly control the relationship between argument dimensions and kernel dimensions in SlangPy.

Basic mapping example:

```python
a = np.random.rand(10, 3, 4)
b = np.random.rand(10, 3, 4)
result = mymodule.add.map((0, 1, 2), (0, 1, 2))(a, b, _result='numpy')
```

Mapping arguments with different dimensionalities:

```python
a = np.random.rand(8, 8).astype(np.float32)
b = np.random.rand(8).astype(np.float32)

# Use explicit mapping instead of auto-padding:
result = mymodule.add.map(a=(0, 1), b=(1,))(a=a, b=b, _result='numpy')
```

Mathematical outer-product example:

```python
a = np.random.rand(10).astype(np.float32)
b = np.random.rand(20).astype(np.float32)

# Map dimensions:
# - a maps to dimension 0 (size 10)
# - b maps to dimension 1 (size 20)
# Resulting kernel and output shape: (10, 20)
result = mymodule.multiply.map(a=(0,), b=(1,))(a=a, b=b, _result='numpy')
```

## Auto-Differentiation

### Basic Auto-diff

One of Slang's most powerful features is its auto-diff capabilities. SlangPy carries this feature over to Python, allowing you to easily calculate the derivative of a function.

A differentiable function:

```slang
[Differentiable]
float polynomial(float a, float b, float c, float x) {
    return a * x * x + b * x + c;
}
```

Note that it has the `[Differentiable]` attribute, which tells Slang to generate the backward propagation function.

Using the Tensor type:

```python
# Create a tensor with attached grads from a numpy array
x = spy.Tensor.numpy(device, np.array([1, 2, 3, 4], dtype=np.float32)).with_grads(zero=True)

# Evaluate the polynomial and ask for a tensor back
result: spy.Tensor = module.polynomial(a=2, b=8, c=-1, x=x, _result='tensor')
print(result.to_numpy())
```

Backward pass:

```python
# Attach gradients to the result, and set them to 1 for the backward pass
result = result.with_grads()
result.grad.storage.copy_from_numpy(np.array([1, 1, 1, 1], dtype=np.float32))

# Call the backwards version of module.polynomial
module.polynomial.bwds(a=2, b=8, c=-1, x=x, _result=result)
print(x.grad.to_numpy())
```

Use of auto-diff in SlangPy requires:
- Marking your function as differentiable
- Using the `Tensor` type to store differentiable data
- Calling the `bwds` function to calculate gradients

### PyTorch Integration

The switch to PyTorch and its auto-grad capabilities is trivial. The critical line that changes is loading the module:

```python
# Load torch wrapped module.
module = spy.TorchModule.load_from_file(device, "example.slang")
```

Creating a PyTorch tensor:

```python
# Create a tensor
x = torch.tensor([1, 2, 3, 4], dtype=torch.float32, device='cuda', requires_grad=True)
```

Running the kernel with PyTorch auto-grad:

```python
# Evaluate the polynomial. Result will now default to a torch tensor.
result = module.polynomial(a=2, b=8, c=-1, x=x)
print(result)

# Run backward pass on result, using result grad == 1
result.backward(torch.ones_like(result))
print(x.grad)
```

This works because the wrapped PyTorch module automatically wrapped the call to `polynomial` in a custom autograd function.

## Generators

SlangPy provides a way to generate data dynamically within kernels, eliminating the need to supply it in a buffer or tensor. This is achieved using generators.

Current generators available:
- Call Id
- Thread Id  
- Wang Hash
- Rand float
- Grid

### Id Generators

Id generators provide unique identifiers related to the current thread.

Call Id example:

```slang
int2 myfunc(int2 value) {
    return value;
}
```

```python
# Populate a 4x4 numpy array of int2s with call IDs
res = np.zeros((4,4,2), dtype=np.int32)
module.myfunc(spy.call_id(), _result=res)

# [ [ [0,0], [1,0], [2,0], [3,0] ], [ [0,1], [1,1], [2,1], [3,1] ], ...
print(res)
```

Thread Id provides the actual dispatch thread ID:

```python
# Populate a 4x4 numpy array of int3s with hardware thread IDs
res = np.zeros((4,4,3), dtype=np.int32)
module.myfunc3d(spy.thread_id(), _result=res)
```

### Random Number Generators

Wang Hash generator returns integer hash values:

```python
# Populate a 4x4 numpy array of int2s with random integer hashes
res = np.zeros((4, 4, 2), dtype=np.int32)
module.myfunc(spy.wang_hash(), _result=res)
```

Random Float generator builds on Wang hash:

```python
# Populate a 4x4 numpy array of float2s with random values
res = np.zeros((4, 4, 2), dtype=np.float32)
module.myfuncfloat(spy.rand_float(min=0, max=10), _result=res)
```

### Grid Generator

The grid generator directly influences the shape of the kernel it is passed to:

```python
# Populate a 4x4 numpy array of int2s with call IDs
res = module.myfunc(spy.grid(shape=(4,4)), _result='numpy')
```

Grid supports strides:

```python
# Populate with strides
res = module.myfunc(spy.grid(shape=(4,4), stride=(2,2)), _result='numpy')
```

Grid allows undefined dimensions (set to -1):

```python
# Allow the grid shape to be inferred while specifying a fixed stride
res = np.zeros((4, 4, 2), dtype=np.int32)
module.myfunc(spy.grid(shape=(-1,-1), stride=(4,4)), _result=res)
```

## API Reference

The API reference documentation is automatically generated from Python docstrings, which are generated from C++ API comments.

The main `slangpy` module contains all the basic types required to load and call Slang functions from Python.

The `slangpy.reflection` module is a wrapper around the Slang reflection API exposed by SlangPy. It is used extensively internally by SlangPy for introspecting Slang code. Access reflection data via the `Module.layout` attribute.

The `slangpy.bindings` module contains tools required to extend SlangPy to support new Python types. All SlangPy's built-in types are implemented using these classes.