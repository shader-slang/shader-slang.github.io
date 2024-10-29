# Migrating to Slang from HLSL

Since the syntax and functions names between Slang and HLSL are similar, if not same, HLSL shaders can be compiled as Slang shaders in most of the cases.
But when migrating HLSL shaders to Slang, there are a few things you need to pay attention to.


## Key Syntax and Feature Differences

### Generics Instead of Templates
Unlike HLSL, Slang doesn't provide "template" feature.
If your HLSL shaders are using template, they need to be converted to use generic.
It depends on the complexity, but the conversion process is pretty simple and easy in most cases.

Here are some examples of how to convert the template to generic.
> Note: For the sake of explanation, the following examples use "#if COMPILER_SLANG/#else/#endif", but if you are fully migrating to Slang, you don't need to keep the "#else"-clause.

When the template argument takes constant integer value, you can use "let XX : uint32_t" syntax as following,
```
#if COMPILER_SLANG
__generic<let LaneStrideX:uint32_t, let LaneStrideY:uint32_t>
#else // #if COMPILER_SLANG
template<uint LaneStrideX, uint LaneStrideY>
#endif // #else // #if COMPILER_SLANG
tsr_short2 GetSimdIndexPixelCoordinateInLane(const uint SimdIndex)
{
	return tsr_short2(SimdIndex % LaneStrideX, SimdIndex / LaneStrideX);
}
```

When the template argument takes a typename, you must use a built-in interface or a custom interface you defined.
```
#if COMPILER_SLANG
__generic<T : IFloat>
#else // #if COMPILER_SLANG
template<typename T>
#endif // #else // #if COMPILER_SLANG
T max4(T x, T y, T z, T w)
{
    return max(max(x, y), max(z,w));
}
```

For more detailed explanations about how to define a custom interface, please see the [user guide document](https://shader-slang.com/slang/user-guide/interfaces-generics.html).


### `#pragma` for DXC wouldn't work for Slang

If your HLSL shaders use `#pragma` for DXC compiler, it wouldn't work for Slang.
You will need to remove the lines, or wrap it as following,
```
#if !COMPILER_SLANG
// Generate vector truncation warnings to errors.
#pragma warning(error: 3206)
#endif // #if !COMPILER_SLANG
```


### `typealias` Instead of `typedef`
Slang doesn't support `typedef`, but you can use `typealias` for the same purpose.
The syntax is little different, however,
```
#if COMPILER_SLANG
typealias Vector4 = float4; // defines Vector4
#else // #if COMPILER_SLANG
typedef float4 Vector4; // defines Vector4
#endif // #else // #if COMPILER_SLANG
```

The syntax is similar to how `using` works in C++11. The presents of the equal symbol (=) makes it less confusing of which one is which.


### Initializer and __init()
The constructor in HLSL is not directly supported in Slang. Slang has "Initializer" and the name of the initializer is always `__init`.
```
struct MyStruct
{
#if COMPILER_SLANG
    void __init(float v)
#else // #if COMPILER_SLANG
    MyStruct(float v)
#endif // #else // #if COMPILER_SLANG
    {
        value = v;
    }

    float value;
}
```


### Operator Overloading
Slang supports the operator overloading, but it cannot be defined as a member method.

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
Slang doesn't allow to overload `operator[]` in a way HLSL does, and you need to use `__subscript` keyword.

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

Please check out the [User Guide document](https://shader-slang.com/slang/user-guide/convenience-features.html#subscript-operator) for more detaileds.


## Debugging and Performance Tips

### Performance implications with Generics
The use of Generics may reduce the total compile time compared to shaders compiled with templates in HLSL.

The "template" in HLSL has to be processed at an early stage of the compilation steps. And when a different type is applied to the template implementation, the compiler must start over the most, if not all, compilation steps.

In Slang, the generic relies on the definition of "interface" and it allows the compiler to skip a few steps that the template implementation couldn't.


### Shader Runtime Debugging with RenderDoc and NSIGHT
When shaders are compiled with Slang, RenderDoc and NSIGHT are expected to work in a same way they work with HLSL. But some debugging features may not work properly.


### Play with [ForceInline]
`[ForceInline]` is similar to `inline` keyword in C++ in a way that the body of a function is inlined into the call locations. This normally doesn't make any observable differences, but we have noticed that the use of `[ForceInline]` can reduce the compile time compared to HLSL compilation with DXC.

The reason is that the shader optimization step inside of DXC takes extra processes to optiize out the `out` or `inout` modifiers. When the function is inlined, those modifiers are unused and the compile time gets reduced.

This characteristics can change in future, but it will be worth experimenting with `[ForceInline]`.


### -O[0-3] Optimization Option
When debugging, disabling the optimization may help.

Slang offers several optimization levels that can be specified during compilation. Use the -O option followed by a level from 0 to 3, where:

-O0: Disable optimizations.
-O1: Basic optimizations.
-O2: More aggressive optimizations, potentially increasing compile time.
-O3: Maximum optimizations, suitable for release builds.


