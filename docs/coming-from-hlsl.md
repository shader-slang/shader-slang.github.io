# Migrating to Slang from HLSL

## Overview
This guide provides a comprehensive overview of the primary syntax and feature differences between HLSL and Slang. It offers essential adjustments needed for a smooth transition and tips to enhance debugging and performance.

While the languages share similarities, paying close attention to specific syntax and function conventions will ensure a seamless migration of HLSL shaders to Slang.


## Key Syntax and Feature Differences

### `enum` is scoped in Slang
In HLSL, `enum` is unscoped, which means the enum values can be referred to without the enum's name.
In Slang, `enum` is scoped, requiring explicit reference to the enum's name along with its values.

<table>
<tr><td>HLSL shader</td><td>Slang shader</td></tr>
<tr><td>
  
```hlsl
enum MyEnum
{
    MyEnum_A,
    MyEnum_B,
    MyEnum_C
};

int MyFunc()
{
    return int(MyEnum_A);
}
```
</td><td>
  
```hlsl
enum MyEnum
{
    A,
    B,
    C
};

int MyFunc()
{
    return int(MyEnum::A);
}
```
</td></tr></table>

To make `enum` unscoped in Slang, use the `-unscoped-enums` option or add the `[UnscopedEnum]` attribute to explicitly declare an enum as unscoped.
```hlsl
// Slang shader
[UnscopedEnum]
enum MyEnum
{
    MyEnum_A,
    MyEnum_B,
    MyEnum_C
};

int MyFunc()
{
    return int(MyEnum_A);
}
```


### Member functions are immutable by default
By default, Slang member functions do not allow mutations to `this`. It is as if the member function has the `const` keyword in C/C++.

To mutate `this`, you must explicitly use the `[mutating]` attribute on each function.

This is a significant departure from HLSL, but the compiler will flag any missing keywords with an error.
<table>
<tr><td>HLSL shader</td><td>Slang shader</td></tr>
<tr><td>
  
```hlsl
struct Counter
{
    int count;
    void increment() { count++; }
};
```
</td><td>
  
```hlsl
struct Counter
{
    int count;

    [mutating]
    void increment() { count++; }
};
```
</td></tr></table>


### Forward declaration is not needed and not supported
In Slang, function declarations do not need to precede their usage.

Furthermore, Slang does not support separating the declaration from its definition for member functions. Member functions must be fully defined at the point of declaration.


### Generics Instead of Templates
Slang does not support a "template" feature like HLSL does.
If your HLSL shaders use templates, they will need to be converted to use generics.
Depending on the complexity, this conversion process is generally straightforward.

When the template argument is a constant integer value, use the `let XX : uint` or `uint XX` syntax as shown below,
<table>
<tr><td>HLSL shader</td><td>Slang shader</td></tr>
<tr><td>
  
```hlsl
template<uint strideX, uint strideY>
uint GetValue(const uint index)
{
    return index % strideX, index / strideY;
}
```
</td><td>
  
```hlsl
__generic<uint strideX, uint strideY>
uint GetValue(const uint index)
{
    return index % strideX, index / strideY;
}
```
</td></tr></table>

When the template argument is a typename, you must use a built-in interface or a custom interface you define.
<table>
<tr><td>HLSL shader</td><td>Slang shader</td></tr>
<tr><td>
  
```hlsl
template<typename T>
T max4(T x, T y, T z, T w)
{
    return max(max(x, y), max(z, w));
}
```
</td><td>
  
```hlsl
__generic<typename T> // `typename` can be omitted
T max4(T x, T y, T z, T w)
    where T : __BuiltinFloatingPointType
{
    return max(max(x, y), max(z, w));
}
```
</td></tr></table>

For more detailed explanations on defining a custom interface, please refer to the [Slang User's Guide](https://shader-slang.com/slang/user-guide/interfaces-generics.html).


### `#pragma` for DXC wouldn't work for Slang

If your HLSL shaders use `#pragma` for the DXC compiler, these will not be compatible with Slang.
You will need to remove these lines or encapsulate them as follows,
```hlsl
#if !COMPILER_SLANG
// Generate vector truncation warnings to errors.
#pragma warning(error: 3206)
#endif // #if !COMPILER_SLANG
```


### Operator Overloading
Slang supports operator overloading, but it cannot be defined as a member method.

<table>
<tr><td>HLSL shader</td><td>Slang shader</td></tr>
<tr><td>
  
```hlsl
struct MyStruct
{
    MyStruct operator+(MyStruct rhs)
    {
        MyStruct tmp;
        tmp.value = value + rhs.value;
        return tmp;
    }

    float value;
};
```
</td><td>
  
```hlsl
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

MyStruct operator+(MyStruct lhs, MyStruct rhs)
{
    return lhs.operator_ADD(rhs);
}
```
</td></tr></table>

For more details, please consult the [Slang User's Guide](https://shader-slang.com/slang/user-guide/convenience-features.html#operator-overloading)

### Subscript Operator
Slang uses a different syntax for overloading subscript operator so both reads and writes to a subscript location can be defined.

<table>
<tr><td>HLSL shader</td><td>Slang shader</td></tr>
<tr><td>
  
```hlsl
struct MyType
{
    float values[12];

    float operator[](int index)
    {
        return values[index];
    }
}
```
</td><td>
  
```hlsl
struct MyType
{
    float values[12];

    __subscript(int index) -> float
    {
        get { return val[index]; }
        set { val[index] = newValue; }
    }
}
```
</td></tr></table>

For more details, please consult the [Slang User's Guide](https://shader-slang.com/slang/user-guide/convenience-features.html#subscript-operator).


### Implicit parameter binding
Slang binds resources based on the shader before Dead-Code-Elimination. This means that even if a uniform parameter is not utilized by the shader, Slang will still assign a resource binding index to it.

This differs from HLSL's behavior, where the DXC compiler removes unused parameters from the compiled shaders. The DXC reflection API then provides information on which parameters are actually being used.

This approach ensures consistent behavior across different variations of the same shader, as Slang does not remove unused parameters during its linking process, maintaining a consistent set of parameters regardless of how the shader was used or linked.


### `unsigned int` is not supported
Slang does not support type names that use more than one token. As a result, `unsigned int` or `signed int` are not supported. These should be renamed to `uint` or `int` respectively.


### Buffer Layouts
Slang defaults to std140 for constant buffers and std430 for structured buffers and related.
 - Use `-fvk-use-scalar-layout` to set buffer layout to scalar block layout.
 - Use `-fvk-use-gl-layout` to set std430 layout for raw buffer load/stores

StructuredBuffer and related objects can also take a per resource layout
```hlsl
StructuredBuffer<MyStruct, Std140DataLayout>
StructuredBuffer<MyStruct, Std430DataLayout>
StructuredBuffer<MyStruct, ScalarDataLayout>
```


### `#pragma pack_matrix()` is not supported
HLSL provides a way to change the matrix packing order with a pragma.

While Slang doesn't support the same pragma syntax, you can achieve the same functionality with `-matrix-layout-column-major` or `-matrix-layout-row-major`.


### Slang requires more strict type casting
Slang demands more strict type casting, but you can add your own casting functions if needed.
Due to this difference, some casting issues may appear as errors while migrating your HLSL shaders to Slang.



## Debugging and Performance Tips

When debugging Slang shaders, disabling optimizations can simplify the debugging process. Use -O0 during development, and consider experimenting with [ForceInline] to reduce compile times for performance-critical shaders.


### `#line` directives
Slang offers a command-line option to emit or suppress `#line` directives when targeting C-like text formats such as HLSL, GLSL, Metal, and WGSL.
When `#line` directives are emitted, they can assist in debugging with shader debugging tools, as these tools can correlate back to the original Slang shader.

For more information, please refer to `LineDirectiveMode` in the [Slang User's Guide](https://shader-slang.com/slang/user-guide/compiling.html).


### Experiment with [ForceInline]
`[ForceInline]` is akin to the `inline` keyword in C++, where the body of a function is inlined at the call locations. This typically does not make any observable differences, but we have noticed that using `[ForceInline]` can reduce compile times compared to HLSL compilation with DXC.

This is because the shader optimization step inside DXC involves additional processes to optimize out the `out` or `inout` modifiers. When the function is inlined, these modifiers become redundant, thus reducing compile times.

This characteristic may change in the future, but it is worth experimenting with `[ForceInline]`.
