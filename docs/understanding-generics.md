# Understanding Slang Generics

## Introduction

When writing shader code, we often need to write similar logic that works with
different types. For example, we might have different kinds of lights in our
scene, each with its own parameters and calculation methods, but sharing common
patterns. Generics provide a powerful solution to this problem by allowing us
to write code that works with multiple types while maintaining type safety and
performance.

Unlike C++ templates, Slang's generics system ensures that code correctness can
be verified at the definition site rather than when the code is used. This
leads to clearer error messages and faster compilation times, as the compiler
doesn't need to repeatedly verify the same code for each use case.

## Generics, Traits, and Type Classes

Slang's generics system shares similarities with several modern programming
language features: Swift's protocols, Rust's traits, and Haskell's type
classes. All of these systems implement parametric polymorphism - the ability
to write code that works with any type that satisfies certain requirements.

This approach differs from traditional object-oriented inheritance by focusing
on behavior rather than hierarchy. Instead of saying "a SpotLight is a kind of
Light", we say "a SpotLight can act as a Light because it provides the required
capabilities." This distinction leads to more flexible and composable code, as
types can implement multiple interfaces without the complexity of multiple
inheritance.

## A Motivating Example

Let's start with a common scenario in graphics programming - implementing
different types of lights:

```slang
// Without generics or interfaces, we need separate implementations
struct PointLight
{
    float3 position;
    float intensity;
    float3 color;
}

// We need separate functions for each light type
float3 calculatePointLight(PointLight light, float3 worldPos, float3 normal)
{
    let lightDir = normalize(light.position - worldPos);
    let distance = length(light.position - worldPos);
    let attenuation = light.intensity / (distance * distance);
    return attenuation *
           light.color *
           max(dot(normal, lightDir), 0.0);
}

struct SpotLight {
    float3 position;
    float3 direction;
    float intensity;
    float3 color;
    float cutoffAngle;
    float falloffExponent;
}

float3 calculateSpotLight(SpotLight light, float3 worldPos, float3 normal)
{
    let lightDir = normalize(light.position - worldPos);
    let distance = length(light.position - worldPos);
    let cosAngle = dot(-lightDir, normalize(light.direction));
    let spotFactor = pow(max(cosAngle - cos(light.cutoffAngle), 0.0), light.falloffExponent);
    let attenuation = (light.intensity * spotFactor) / (distance * distance);
    return attenuation *
           light.color *
           max(dot(normal, lightDir), 0.0);

}
```

Here we are failing to abstract over the commonalities in the lighting
calculation. And everywhere which wants to use these functions will have to
know the specific type of light it's working with in order to know which
function to call.

One might consider using function overloading to solve this problem:

```slang
float3 calculateLight(PointLight light, float3 worldPos, float3 normal)
{
    // Point light implementation
}

float3 calculateLight(SpotLight light, float3 worldPos, float3 normal)
{
    // Spot light implementation
}
```

This is supported in Slang, and is a language feature with appropriate uses,
but in this case it doesn't absolve any calling function of having to know
which type of light it's dealing with. For example one could imagine a light
culling function which takes a list of lights, and returns a culled list of
lights.

```slang
uint cullPointLights(float3 worldPos, inout PointLight lights[MAX_LIGHTS])
{
  // Put the culled lights at the end of the list and return MAX_LIGHTS - numCulledLights
}

uint cullSpotLights(float3 worldPos, inout SpotLight lights[MAX_LIGHTS])
{
  // Put the culled lights at the end of the list and return MAX_LIGHTS - numCulledLights
}
```

The implementations of these two functions will differ, but only according to
the _cullability_ calculation for each light, the actual sorting and counting
algorithm will be the same!

Overloading could again be used here, but we would still need two functions.

In short, overloaded functions can only be used when the types are fully known
at the call site. Overloading can also obscure the programmer's intentions,
giving poorer error messages and code understandability.

### Here's how we can improve this with generics and interfaces:

We can define an interface, to which lights must conform.

```slang
interface ILight
{
    float3 position();
    float3 color();
    float3 illumination(float3 worldPos, float3 normal);
    // Return false if this light provides some illumination
    bool isCullable(float3 worldPos);
}
```

We can then

```slang
struct PointLight : ILight
{
    float3 position;
    float3 color;

    float3 position() { return position; }
    float3 color() { return color; }
    float3 illumination(float3 worldPos)
    {
      let lightDir = position - worldPos;
      let distance = length(lightDir);
      // Simple inverse square falloff
      return 1.0 / (distance * distance);
    }
}

struct SpotLight : ILight
{
    float3 position;
    float3 direction;
    float3 color;
    float intensity;
    float cutoffAngle;
    float falloffExponent;

    float3 position() { return position; }
    float3 color() { return color; }
    float3 illumination(float3 worldPos, float3 normal)
    {
        let lightDir = normalize(position - worldPos);
        let distance = length(position - worldPos);
        let spotFactor =
          pow(max(dot(-lightDir, normalize(direction)) - cos(cutoffAngle), 0.0), falloffExponent);
        return (intensity * spotFactor) / (distance * distance);
    }
}
```

Now that these are defined, we can forget all about the details of how lights
calculate their various properties and concern ourselves only with what we're
interested in.

```slang
// We can factor out the code common to both light types (in this case a
// modulation by the light color and incident angle).
float3 lighting<T>(T light, float3 worldPos, float3 normal)
    where T : ILight
{
    let lightdir = normalize(light.position() - worldPos);
    return light.illumination(worldPos, normal) *
           light.color() *
           max(dot(normal, lightDir), 0.0);
}

// In this function we know fully the types of the lights at the call site...
void shadeSurface(float3 worldPos, float3 normal)
{
    PointLight myLight1 = { /*...*/ };
    SpotLight myLight2 = { /*...*/ };

    float3 totalIllumination =
      lighting(myLight1, worldPos, normal) +
      lighting(myLight2, worldPos, normal);
}

// ... and here we don't know or care about what type of light we're culling,
// only that they are lights with some notion of cullability, impossible with
// overloading.
uint cullLights<T>(float3 worldPos, inout T lights[MAX_LIGHTS]) where T : ILight
{
  // Put the culled lights at the end of the list and return MAX_LIGHTS - numCulledLights
  // Use ILight.isCullable() to determine where to sort them to.
}
```

This generic solution provides several benefits:

- Type safety: The compiler verifies that any type used with `lighting` or
  `cullLights` conforms to the `ILight` interface, so even though there may be
  other non-light types in the program with the same member functions, they
  can't mistakenly be passed to these functions.
- Extensibility: New light types can be added by implementing the `ILight`
  interface, without having to implement a separate culling function or shared
  lighting calculations.
- Clear requirements: The interface explicitly states what capabilities a light
  must have
- Better error messages at the definition site, using methods which don't
  belong to the `ILight` interface for example is not possible, whereas C++'s
  templates will only catch this at the call site, or worse, not at all if the
  type being used happens to have these methods defined.
- Better error messages at the use site, for example trying to cull an array of
  objects which aren't light will tell the programmer exactly that, rather than
  some error message within the implementation of `cullLights`

## Performance and Compilation

Like Rust traits and C++ templates, Slang's generics are completely resolved at
compile time through a process called monomorphization ([except when using existential types](https://github.com/shader-slang/slang/blob/master/docs/design/existential-types.md)). This means that for
each unique combination of generic parameters used in your code, the compiler
generates a specialized, concrete implementation.

For example, when you write:

```slang
let result1 = lighting(myPointLight, pos, normal);
let result2 = lighting(mySpotLight, pos, normal);
```

The compiler generates two separate versions of the lighting function, one
specialized for `PointLight` and one for `SpotLight`. This results in:

- No runtime overhead from dynamic dispatch, virtual function calls or runtime
  type checking.
- Full optimization opportunities for each specific type
- Larger binary size when many specializations are needed

## From C++ Templates to Slang Generics

While C++ templates and Slang generics can solve similar problems, their
approaches differ significantly. The lighting example, for example:

```cpp
// C++ template approach
template<typename T>
float3 calculateLighting(T light, float3 worldPos, float3 normal)
{
    // No explicit requirements - we just hope T has these methods
    // Will fail with an error message here if that isn't the case
    // Furthermore the error is only detected when function is actually
    // instantiated
    float3 lightDir = normalize(light.position() - worldPos);

    // No way to know what other methods T might need
    // Documentation must explain requirements separately
    return light.getColor() *
           max(dot(normal, lightDir), 0.0f);
}
```

Benefits of Slang's approach:

- Earlier error detection: Problems are caught at definition time
- Clearer requirements: Interfaces document exactly what operations are needed
- Better error messages
- Improved language server support: the Slang language server knows exactly
  what methods are valid for generic types, unlike C++ template parameters.

There are certain things which work with C++ style templates, which are
(deliberatly) disallowed with Slang generics. For example the following code
will work in C++ but the naïve equivalent in Slang will not compile.

```cpp
// This function will compile when instantiated at a type which supports the +
// operator. However this restriction is only discovered at the call site.
template<T>
float addValue(T v0, T v1) { return v0.x + v1.x; }

// We happen to call `addValue` with a type that supports addition.
void user() {addValue(1,2); }
```

```slang
// In Slang, the type of this function promises that it will work for all types
// `T`. However the definition requires that the type supports the + operator.
// Hence, Slang will refuse to compile this.
float addValue<T>(T v0, T v1) { return v0 + v1; }

// The fact that we call it with a compatible type is irrelevant. The compiler
// finds the problem at addValue's definition site.
void user() {addValue(1,2); }
```

The correct definition with Slang will be to constrain the type `T` to be one
which supports the `+` operator, in this case through the `IArithmetic`
interface.

```slang
float addValue<T>(T v0, T v1) where T : IArithmetic { return v0 + v1; }
```

## Generic programming over Scalars and Vectors

It is still possible to write functions which can generically operate over
scalars and vectors, for example using the
[`IArithmetic`](https://shader-slang.com/stdlib-reference/interfaces/iarithmetic-01/index.html)
or
[`IFloat`](https://shader-slang.com/stdlib-reference/interfaces/ifloat-01/index.html)
interfaces.

## Advanced Generic Features

### Associated Types

Sometimes we need to work with types that are related to our generic parameter.
For example, different lights might use different parameter types, which we
might want to move around or update, without caring about the specifics.

```slang
interface ILight
{
    associatedtype ParameterType;
    void updateParameters(ParameterType params);
    // ... other methods
}

struct SpotLightParams
{
    float cutoffAngle;
    float falloffExponent;
}

struct SpotLight : ILight
{
    typealias ParameterType = SpotLightParams;

    void updateParameters(SpotLightParams params) {
        cutoffAngle = params.cutoffAngle;
        falloffExponent = params.falloffExponent;
    }
}
```

### Generic Value Parameters

Sometimes we need to parameterize by compile-time values, for example
abstracting over a compile-time integer is shown here:

```slang
struct LightArray<T, let N : int> where T : ILight
{
    T lights[N];

    float3 calculateTotalIllumination(float3 worldPos, float3 normal) {
        float3 total = 0;
        for (int i = 0; i < N; i++) {
            total += calculateLighting(lights[i], worldPos, normal);
        }
        return total;
    }
}
```

## Further Reading

- Interfaces in Slang: https://github.com/shader-slang/slang/blob/master/docs/design/interfaces.md
- Existential types in Slang: https://github.com/shader-slang/slang/blob/master/docs/design/existential-types.md
- Traits in Rust: https://doc.rust-lang.org/book/ch10-02-traits.html
- Generics in Swift: https://docs.swift.org/swift-book/documentation/the-swift-programming-language/generics/
