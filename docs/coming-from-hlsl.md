# Migrating to Slang from HLSL

## Overview
This guide covers the primary syntax and feature differences between HLSL and Slang. It provides key adjustments needed for a smooth migration and tips to improve debugging and performance. While the languages are similar, careful attention to specific syntax and function conventions will ensure HLSL shaders migrate seamlessly to Slang.

Since the syntax and function names between Slang and HLSL are similar, if not the same, HLSL shaders can be compiled as Slang shaders in most cases.
But when migrating HLSL shaders to Slang, there are a few things you need to pay attention to.

> Note: For the sake of explanation, the following examples use "#if COMPILER_SLANG/#else/#endif". But our recommendation is to completely convert your HLSL syntax to Slang syntax, because Slang can translate Slang shaders to HLSL shaders whenever you need.


## Key Syntax and Feature Differences

### `enum` is scoped in Slang
In HLSL, `enum` is unscoped, meaning that the enum values can be referred to without the name of the enum itself.
In Slang, `enum` is scoped, meaning that the enum values must come explicitly with the name of the enum.

```
enum MyEnum
{
    MyEnum_A,
    MyEnum_B,
    MyEnum_C
};

int MyFunc()
{
#if COMPILING_SLANG
    return int(MyEnum::MyEnum_A);
#else
    return int(MyEnum_A);
#endif
}
```

Because HLSL allows the enum name to be explicit, it will be simpler to change the HLSL shader in the Slang style when migrating from HLSL to Slang.
```
enum MyEnum
{
    MyEnum_A,
    MyEnum_B,
    MyEnum_C
};

int MyFunc()
{
    // The following line works for both Slang and DXC
    return int(MyEnum::MyEnum_A);
}
```


### Member functions are immutable by default
By default, Slang member functions cannot mutate `this`. When a member function is immutable, it is as if the member function got the `const` keyword in C/C++.

If you need to mutate `this`, you need to explicitly use the `[mutating]` attribute on each function.

This behavior is very different from HLSL, but if you miss the keyword, the compiler will give you an error.
```
#if COMPILER_SLANG
#define SLANG_MUTATING [mutating]
#else
#define SLANG_MUTATING
#endif

struct Counter
{
    int count;

    SLANG_MUTATING
    void increment() { count++; }
};
```


### Generics Instead of Templates
Unlike HLSL, Slang doesn't provide a "template" feature.
If your HLSL shaders are using templates, they need to be converted to use generics.
It depends on the complexity, but the conversion process is pretty simple and easy in most cases.

When the template argument takes a constant integer value, you can use the "let XX : uint32_t" syntax as follows,
```
#if COMPILER_SLANG
__generic<uint strideX, uint strideY>
#else // #if COMPILER_SLANG
template<uint strideX, uint strideY>
#endif // #else // #if COMPILER_SLANG
uint GetValue(const uint index)
{
    return index % strideX, index / strideY;
}
```

When the template argument takes a typename, you must use a built-in interface or a custom interface you defined.
```
#if COMPILER_SLANG
__generic<T> where T : IFloat
#else // #if COMPILER_SLANG
template<typename T>
#endif // #else // #if COMPILER_SLANG
T max4(T x, T y, T z, T w)
{
    return max(max(x, y), max(z, w));
}
```

For more detailed explanations about how to define a custom interface, please see the [Slang User's Guide](https://shader-slang.com/slang/user-guide/interfaces-generics.html).


### `#pragma` for DXC wouldn't work for Slang

If your HLSL shaders use `#pragma` for the DXC compiler, it wouldn't work for Slang.
You will need to remove the lines, or wrap them as follows,
```
#if !COMPILER_SLANG
// Generate vector truncation warnings to errors.
#pragma warning(error: 3206)
#endif // #if !COMPILER_SLANG
```


### Operator Overloading
Slang supports operator overloading, but it cannot be defined as a member method.

```
#if COMPILER_SLANG
MyStruct operator+(MyStruct lhs, MyStruct rhs)
{
    return lhs.operator_ADD(rhs);
}
#else // #if COMPILER_SLANG
#define operator_ADD operator+
#endif // #else // #if COMPILER_SLANG

struct MyStruct
{
    MyStruct operator_ADD(MyStruct rhs)
    {
        MyStruct tmp;
        tmp.value = value + rhs.value;
        return tmp;
    }

    float value;
};
```

### Subscript Operator
Slang doesn't allow overloading `operator[]` in the way HLSL does, and you need to use the `__subscript` keyword.

```
struct MyType
{
    float values[12];

#if COMPILER_SLANG
    __subscript(int index) -> float
    {
        get { return val[index]; }
    }
#else // #if COMPILER_SLANG
    float operator[](int index)
    {
        return values[index];
    }
#endif // #else // #if COMPILER_SLANG
}
```

Please check out the [Slang User's Guide](https://shader-slang.com/slang/user-guide/convenience-features.html#subscript-operator) for more details.


### Implicit parameter binding
Slang binds resources based on the shader before Dead-Code-Elimination. As an example, it means that when a uniform parameter is not used by the shader, Slang will still assign a resource binding index to it.

This is different behavior from how HLSL works because the DXC compiler removes the unused parameters from the compiled shaders. Then the DXC reflection API provides the information on which parameters are actually being used.

It is to provide consistent behavior when there can be different variations of the same shader. Because Slang doesn't remove the unused parameters in its linking process, the set of parameters will appear the same way regardless of how the shader was used or linked.


### `unsigned int` is not supported
Slang doesn't support type names that use more than one token. As a result, `unsigned int` or `signed int` are not supported. You will need to rename them to `uint` or `int` respectively.


## Debugging and Performance Tips

When debugging Slang shaders, disabling optimizations can simplify the debugging process. Use -O0 during development, and experiment with [ForceInline] to reduce compile times for performance-critical shaders.


### `#line` directives
There is a command-line option for Slang to emit or not emit `#line` directives when targeting C-like text formats such as HLSL, GLSL, Metal, and WGSL.
When `#line` directives are emitted, it can help you to debug with shader debugging tools, because those tools can correlate back to the original Slang shader.

For more information, please check out `LineDirectiveMode` on the [Slang User's Guide](https://shader-slang.com/slang/user-guide/compiling.html).


### Play with [ForceInline]
`[ForceInline]` is similar to the `inline` keyword in C++ in a way that the body of a function is inlined into the call locations. This normally doesn't make any observable differences, but we have noticed that the use of `[ForceInline]` can reduce the compile time compared to HLSL compilation with DXC.

The reason is that the shader optimization step inside of DXC takes extra processes to optimize out the `out` or `inout` modifiers. When the function is inlined, those modifiers are unused and the compile time gets reduced.

This characteristic can change in the future, but it will be worth experimenting with `[ForceInline]`.


### -O[0-3] Optimization Option
When debugging, disabling the optimization may help.

Slang offers several optimization levels that can be specified during compilation. Use the -O option followed by a level from 0 to 3, where:

-O0: Disable optimizations.
-O1: Basic optimizations.
-O2: More aggressive optimizations, potentially increasing compile time.
-O3: Maximum optimizations, suitable for release builds.

