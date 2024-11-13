# Using the Slang Reflection API

## ShaderReflection
`ShaderReflection` allows Slang users to access the reflection data from the composited program object.
You can get data for:
 - [Basic information](shaderreflection-basic-information)
 - [Parameter and type parameter](shaderreflection-parameter-and-type-parameter)
 - [Entry points](shaderreflection-entry-points)
 - [Global constants and layouts](shaderreflection-global-constants-and-layouts)
 - [Type and function reflection](shaderreflection-type-and-function-reflection)
 - [Specialization](shaderreflection-specialization)
 - [Subtype checking](shaderreflection-subtype-checking)
 - [Hashed strings](shaderreflection-hashed-strings)
 - [Serialization](shaderreflection-serialization)


### How to access to `ShaderReflection` object
After calling `createCompositeComponentType()`, you will get a "program" whose type is `IComponentType`.
You can call `IComponentType::getLayout()` to access the reflection object.
```
IComponentType* components[] = { module, entryPoint };
Slang::ComPtr<IComponentType> program;
session->createCompositeComponentType(components, 2, program.writeRef());

// typedef struct ShaderReflection ProgramLayout;
slang::ProgramLayout* layout = program->getLayout();
```

Alternatively, you can get the reflection object from a static method, `ShaderReflection::get()` with `SlangCompileRequest` parameter.
```
static ProgramLayout* ShaderReflection::get(SlangCompileRequest* request);
```
TODO: Need an example.


### ShaderReflection Basic information

#### ShaderReflection::getParameterCount()
Returns the number of parameters.
```
unsigned ShaderReflection::getParameterCount();
```

Example,
```
// Assume we have a valid reflection object
slang::ShaderReflection* reflection = /* obtain a reflection object */;

// Get the number of parameters
unsigned int parameterCount = reflection->getParameterCount();

// Iterate over the parameters
for (unsigned int i = 0; i < parameterCount; ++i)
{
    slang::VariableLayoutReflection* parameter = reflection->getParameterByIndex(i);
    // Process each parameter
    const char* paramName = parameter->getName();
    slang::TypeReflection* paramType = parameter->getTypeLayout()->getType();
    // Use paramName and paramType as needed
}
```

#### ShaderReflection::getTypeParameterCount()
TODO: Describe the function with an example.
```
unsigned ShaderReflection::getTypeParameterCount();
```

#### slang::ISession* ShaderReflection::getSession()
TODO: Describe the function with an example.
```
slang::ISession* ShaderReflection::getSession();
```


### ShaderReflection Parameter and Type parameter

#### ShaderReflection::getParameterByIndex()
TODO: Describe the function with an example.
```
VariableLayoutReflection* ShaderReflection::getParameterByIndex(unsigned index);
```

#### ShaderReflection::getTypeParameterByIndex()
TODO: Describe the function with an example.
```
TypeParameterReflection* ShaderReflection::getTypeParameterByIndex(unsigned index);
```

#### ShaderReflection::findTypeParameter()
TODO: Describe the function with an example.
```
TypeParameterReflection* ShaderReflection::findTypeParameter(char const* name);
```


### ShaderReflection Entry Points

#### ShaderReflection::getEntryPointCount()
TODO: Describe the function with an example.
```
SlangUInt ShaderReflection::getEntryPointCount();
```

#### ShaderReflection::getEntryPointByIndex()
TODO: Describe the function with an example.
```
EntryPointReflection* ShaderReflection::getEntryPointByIndex(SlangUInt index);
```

#### ShaderReflection::findEntryPointByName()
TODO: Describe the function with an example.
```
EntryPointReflection* ShaderReflection::findEntryPointByName(const char* name);
```


### ShaderReflection Global constants and layouts

#### ShaderReflection::getGlobalConstantBufferBinding()
TODO: Describe the function with an example.
```
SlangUInt ShaderReflection::getGlobalConstantBufferBinding();
```

#### ShaderReflection::getGlobalConstantBufferSize()
TODO: Describe the function with an example.
```
size_t ShaderReflection::getGlobalConstantBufferSize();
```

#### ShaderReflection::getGlobalParamsTypeLayout()
TODO: Describe the function with an example.
```
TypeLayoutReflection* ShaderReflection::getGlobalParamsTypeLayout();
```

#### ShaderReflection::getGlobalParamsVarLayout()
TODO: Describe the function with an example.
```
VariableLayoutReflection* ShaderReflection::getGlobalParamsVarLayout();
```


### ShaderReflection Type and function reflection

#### ShaderReflection::findTypeByName()
TODO: Describe the function with an example.
```
TypeReflection* ShaderReflection::findTypeByName(const char* name);
```

#### ShaderReflection::findFunctionByName()
TODO: Describe the function with an example.
```
FunctionReflection* ShaderReflection::findFunctionByName(const char* name);
```

#### ShaderReflection::findFunctionByNameInType()
TODO: Describe the function with an example.
```
FunctionReflection* ShaderReflection::findFunctionByNameInType(TypeReflection* type, const char* name);
```

#### ShaderReflection::getTypeLayout()
TODO: Describe the function with an example.
```
TypeLayoutReflection* ShaderReflection::getTypeLayout(TypeReflection* type, LayoutRules rules = LayoutRules::Default);
```


### ShaderReflection Specialization

#### ShaderReflection::specializeType()
TODO: Describe the function with an example.
```
TypeReflection* ShaderReflection::specializeType(
        TypeReflection* type,
        SlangInt specializationArgCount,
        TypeReflection* const* specializationArgs,
        ISlangBlob** outDiagnostics);
```

#### ShaderReflection::specializeGeneric()
TODO: Describe the function with an example.
```
GenericReflection* ShaderReflection::specializeGeneric(
        GenericReflection* generic,
        SlangInt specializationArgCount,
        GenericArgType const* specializationArgTypes,
        GenericArgReflection const* specializationArgVals,
        ISlangBlob** outDiagnostics);
```


### ShaderReflection Subtype checking

#### ShaderReflection::isSubType()
TODO: Describe the function with an example.
```
bool ShaderReflection::isSubType(TypeReflection* subType, TypeReflection* superType);
```

### ShaderReflection Hashed strings

#### ShaderReflection::getHashedStringCount()
TODO: Describe the function with an example.
```
SlangUInt ShaderReflection::getHashedStringCount() const;
```

#### ShaderReflection::getHashedString()
TODO: Describe the function with an example.
```
const char* ShaderReflection::getHashedString(SlangUInt index, size_t* outCount) const;
```


### ShaderReflection Serialization

#### ShaderReflection::toJson()
TODO: Describe the function with an example.
```
SlangResult ShaderReflection::toJson(ISlangBlob** outBlob);
```


## VariableLayoutReflection
`VariableLayoutReflection` provides methods to retrieve detailed information about variables in a shader program, including their types, categories, and binding information.
You can get data for:
 - [Basic information](variablelayoutreflection-basic-information)
 - [Type and type layout](variablelayoutreflection-type-and-type-layout)
 - [Category](variablelayoutreflection-category)
 - [Offset](variablelayoutreflection-offset)
 - [Binding](variablelayoutreflection-binding)
 - [Semantics](variablelayoutreflection-semantics)

### How to access to `VariableLayoutReflection` object
TODO:

### VariableLayoutReflection Basic information

#### VariableLayoutReflection::getVariable()
TODO: Describe the function with an example.
```
VariableReflection* VariableLayoutReflection::getVariable();
```

#### VariableLayoutReflection::getName()
TODO: Describe the function with an example.
```
char const* VariableLayoutReflection::getName();
```

#### VariableLayoutReflection::findModifier(Modifier::ID id)
TODO: Describe the function with an example.
```
Modifier* VariableLayoutReflection::findModifier(Modifier::ID id);
```

#### VariableLayoutReflection::getStage()
TODO: Describe the function with an example.
```
SlangStage VariableLayoutReflection::getStage();
```

#### VariableLayoutReflection::getPendingDataLayout()
TODO: Describe the function with an example.
```
VariableLayoutReflection* VariableLayoutReflection::getPendingDataLayout();
```

### VariableLayoutReflection Type and Type layout

#### VariableLayoutReflection::getType()
TODO: Describe the function with an example.
```
TypeReflection* VariableLayoutReflection::getType();
```

#### VariableLayoutReflection::getTypeLayout()
TODO: Describe the function with an example.
```
TypeLayoutReflection* VariableLayoutReflection::getTypeLayout();
```

### VariableLayoutReflection Category
TODO: Describe the function with an example.
```
ParameterCategory VariableLayoutReflection::getCategory();
```

#### VariableLayoutReflection::getCategoryCount()
TODO: Describe the function with an example.
```
unsigned int VariableLayoutReflection::getCategoryCount();
```

#### VariableLayoutReflection::getCategoryByIndex(unsigned int index)
TODO: Describe the function with an example.
```
ParameterCategory VariableLayoutReflection::getCategoryByIndex(unsigned int index);
```

### VariableLayoutReflection Offset
TODO: Describe the function with an example.
```
size_t VariableLayoutReflection::getOffset(SlangParameterCategory category = SLANG_PARAMETER_CATEGORY_UNIFORM);
```

### VariableLayoutReflection Binding

#### VariableLayoutReflection::getBindingIndex()
TODO: Describe the function with an example.
```
unsigned VariableLayoutReflection::getBindingIndex();
```

#### VariableLayoutReflection::getBindingSpace()
TODO: Describe the function with an example.
```
unsigned VariableLayoutReflection::getBindingSpace();
```

#### VariableLayoutReflection::getBindingSpace(SlangParameterCategory category)
TODO: Describe the function with an example.
```
size_t VariableLayoutReflection::getBindingSpace(SlangParameterCategory category);
```

### VariableLayoutReflection Semantics

#### VariableLayoutReflection::getSemanticName()
TODO: Describe the function with an example.
```
char const* VariableLayoutReflection::getSemanticName();
```

#### VariableLayoutReflection::getSemanticIndex()
TODO: Describe the function with an example.
```
size_t VariableLayoutReflection::getSemanticIndex();
```

## SlangStage
        SLANG_STAGE_NONE,
        SLANG_STAGE_VERTEX,
        SLANG_STAGE_HULL,
        SLANG_STAGE_DOMAIN,
        SLANG_STAGE_GEOMETRY,
        SLANG_STAGE_FRAGMENT,
        SLANG_STAGE_COMPUTE,
        SLANG_STAGE_RAY_GENERATION,
        SLANG_STAGE_INTERSECTION,
        SLANG_STAGE_ANY_HIT,
        SLANG_STAGE_CLOSEST_HIT,
        SLANG_STAGE_MISS,
        SLANG_STAGE_CALLABLE,
        SLANG_STAGE_MESH,
        SLANG_STAGE_AMPLIFICATION,

        // alias:
        SLANG_STAGE_PIXEL = SLANG_STAGE_FRAGMENT,

## Modifier
        Shared = SLANG_MODIFIER_SHARED,
        NoDiff = SLANG_MODIFIER_NO_DIFF,
        Static = SLANG_MODIFIER_STATIC,
        Const = SLANG_MODIFIER_CONST,
        Export = SLANG_MODIFIER_EXPORT,
        Extern = SLANG_MODIFIER_EXTERN,
        Differentiable = SLANG_MODIFIER_DIFFERENTIABLE,
        Mutating = SLANG_MODIFIER_MUTATING,
        In = SLANG_MODIFIER_IN,
        Out = SLANG_MODIFIER_OUT,
        InOut = SLANG_MODIFIER_INOUT

## ParameterCategory
    None = SLANG_PARAMETER_CATEGORY_NONE,
    Mixed = SLANG_PARAMETER_CATEGORY_MIXED,
    ConstantBuffer = SLANG_PARAMETER_CATEGORY_CONSTANT_BUFFER,
    ShaderResource = SLANG_PARAMETER_CATEGORY_SHADER_RESOURCE,
    UnorderedAccess = SLANG_PARAMETER_CATEGORY_UNORDERED_ACCESS,
    VaryingInput = SLANG_PARAMETER_CATEGORY_VARYING_INPUT,
    VaryingOutput = SLANG_PARAMETER_CATEGORY_VARYING_OUTPUT,
    SamplerState = SLANG_PARAMETER_CATEGORY_SAMPLER_STATE,
    Uniform = SLANG_PARAMETER_CATEGORY_UNIFORM,
    DescriptorTableSlot = SLANG_PARAMETER_CATEGORY_DESCRIPTOR_TABLE_SLOT,
    SpecializationConstant = SLANG_PARAMETER_CATEGORY_SPECIALIZATION_CONSTANT,
    PushConstantBuffer = SLANG_PARAMETER_CATEGORY_PUSH_CONSTANT_BUFFER,
    RegisterSpace = SLANG_PARAMETER_CATEGORY_REGISTER_SPACE,
    GenericResource = SLANG_PARAMETER_CATEGORY_GENERIC,

    RayPayload = SLANG_PARAMETER_CATEGORY_RAY_PAYLOAD,
    HitAttributes = SLANG_PARAMETER_CATEGORY_HIT_ATTRIBUTES,
    CallablePayload = SLANG_PARAMETER_CATEGORY_CALLABLE_PAYLOAD,

    ShaderRecord = SLANG_PARAMETER_CATEGORY_SHADER_RECORD,

    ExistentialTypeParam = SLANG_PARAMETER_CATEGORY_EXISTENTIAL_TYPE_PARAM,
    ExistentialObjectParam = SLANG_PARAMETER_CATEGORY_EXISTENTIAL_OBJECT_PARAM,

    SubElementRegisterSpace = SLANG_PARAMETER_CATEGORY_SUB_ELEMENT_REGISTER_SPACE,

    InputAttachmentIndex = SLANG_PARAMETER_CATEGORY_SUBPASS,

    MetalBuffer = SLANG_PARAMETER_CATEGORY_CONSTANT_BUFFER,
    MetalTexture = SLANG_PARAMETER_CATEGORY_METAL_TEXTURE,
    MetalArgumentBufferElement = SLANG_PARAMETER_CATEGORY_METAL_ARGUMENT_BUFFER_ELEMENT,
    MetalAttribute = SLANG_PARAMETER_CATEGORY_METAL_ATTRIBUTE,
    MetalPayload = SLANG_PARAMETER_CATEGORY_METAL_PAYLOAD,

    // DEPRECATED:
    VertexInput = SLANG_PARAMETER_CATEGORY_VERTEX_INPUT,
    FragmentOutput = SLANG_PARAMETER_CATEGORY_FRAGMENT_OUTPUT,

## VariableReflection
TODO:

## TypeParameterReflection
TODO:

## EntryPointReflection
TODO:

## TypeLayoutReflection
TODO:

## TypeReflection
TODO:

## FunctionReflection
TODO:

## GenericReflection
TODO:

