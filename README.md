# protodef-ts

A web-compatible TypeScript implementation of [ProtoDef](https://github.com/ProtoDef-io/ProtoDef). Zero dependencies

## TODO

- [ ] Good error handling
- [ ] Stream handling
- [x] Documentation [WIP]
- [ ] zod integration

## Documentation

`class Protocol`

- `new Protocol(opts)`

  - `opts` object

    - `protocol` ProtoDef.Protocol
      
      Define the protocol schema. An object with other protocols as values (namespaces) or types if the key is `types`.

      ```ts
      {
          types: {
              i8: "native",
              // other types...
          },
          myNamespace: {
              types: {
                  u8: "native",
                  // other types...
              },
              // other nested namespaces...
          },
      }
      ```

      Namespaces are referenced as a path seperated by `.`, ex: `myNamespace.subNamespace.typeName`

      The root namespace is `""` (empty string)

    - `natives?` { [name: string]: DataTypeImpl }

      See [Implementing Native DataTypes](#implementing-native-datatypes)

    - `noStd?` boolean

      Set to `true` to not automatically add standard ProtoDef native types to `natives`.

- `Protocol#resolveDataType(path: string)` [...]

  Resolves the DataType from a namespace.

  Returns: An array of three elements:

  - `namespace: string`
  - `name: string`
  - `dataType: DataType`

  Example:

  ```ts
  proto.resolveDataType("i8") // ["", "i8", "native"]
  proto.resolveDataType("myNamespace.u8") // ["myNamespace", "u8", "native"]
  ```

- `Protocol#read<P>(path: string, buffer: ArrayBuffer, offset?: number): P`

  Read a DataType at `path`, from `buffer`, optionally starting from `offset`, and return the value.

  ```ts
  const arr = new Uint8Array([77, 101, 111, 119, 0x00]);
  proto.read<string>("cstring", arr.buffer); // "Meow"
  ```

- `Protocol#write<P>(path: string, packet: P, buffer: ArrayBuffer, offset?: number)`

  Write the value `packet` with DataType at `path` to `buffer`, optionally starting from `offset`.

  ```ts
  const buffer = new ArrayBuffer(200);
  const packet = { username: "deniz-blue" };
  proto.write("myType", packet, buffer);
  ```

- `Protocol#size<P>(path: string, packet: P): number`

  Get the size of `packet` with DataType at `path`.
  Used for determining packet size.

  ```ts
  const packet = "Meow";
  proto.size("cstring", packet); // 5
  ```

### Implementing Native DataTypes

To add a native DataType to a protocol, you must create an implementation of it.

The implementation is an object with three methods, all of which have a context as the first argument.

TypeScript users can use the exported `DataTypeImplementation<TValue, TArgs>` interface.

- Common Context properties/methods

  - `ctx.args` TArgs

    The arguments provided by the protocol schema.
    For example, in `["someType", 3]`, `someType` will get called with `ctx.args == 3`

  - `ctx.getValue<T>(path: string)` T

    Get a value from the packet to get the size of/write or the partially read packet.
    This method is useful for data types that has conditional logic such as the native `switch` type (used for `compareTo`).

    Path can reference a value from an ancestor's property using `../`. Any arrays are skipped while traversing up.

  - `ctx.io.buffer` ArrayBuffer

    **[read/write only]** The buffer to do read operations on.

  - `ctx.io.offset` number 

    **[read/write only]** The current offset. Read from the buffer with this offset and increment it after you read from it.

- `read(ctx)`
  
  Read the value from buffer.

  - `ctx.value` TValue

    Set this property to the read value.

  - `ctx.read<T>(type: DataType, key?: string|number)`: **T**

    Read another DataType. Returns the read value.
    Specify `key` if you are reading a property of the value you are going to return.

    ```ts
    // Example of a simple type wrapper
    ctx.value = ctx.read(ctx.args.type)

    // Nested properties etc. need to specify key
    for(let { name, type } of ctx.args.fields)
      ctx.value[name] = ctx.read(type, name);
      //        ^^^^                   ^^^^
    ```

- `write(ctx, value: TValue)`

  Write `value` to the buffer.

  - `ctx.write(type: DataType, innerValue, key?: string|number)`

    Write another DataType with value `innerValue`.
    Specify `key` if you are writing a property of `value`.

- `size(ctx, value: TValue)` **number**

  Get the size of `value`. Return the number of bytes.

  - `ctx.size(type: DataType, innerValue, key?: string|number)`

    Get the size of another DataType with value `innerValue`.
    Specify `key` if `innerValue` is a property of `value`.


