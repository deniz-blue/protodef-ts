# protodef-ts

A modern [ProtoDef](https://github.com/ProtoDef-io/ProtoDef) implementation in TypeScript.

- Does not use NodeJS Buffer (or any other NodeJS API)
- All ESM modules
- Supports all ProtoDef native types
- Smart [streaming](#streaming) feature

This library works by doing **code generation**.

It's also almost as fast as compiled node-protodef!

## Usage

```ts
import { Protocol } from 'protodef-ts';

const protocol = new Protocol({
	types: {
		myPacket: ["container", [
			{ name: "field1", type: "varint" },
			{ name: "field2", type: "cstring" },
		]],
	},
});

const size = protocol.size("myPacket", { field1: 123, field2: "hello" });
size // 7

const buffer = new Uint8Array(size);
protocol.write("myPacket", { field1: 123, field2: "hello" }, buffer);
buffer // Uint8Array [ 123, 104, 101, 108, 108, 111, 0 ]

const data = protocol.read("myPacket", buffer);
data // { field1: 123, field2: "hello" }

// Inspect the generated code:
console.log(protocol.generateDecoderCode("myPacket"));
```

## Streaming

Protocol class has a method to create a **stream decoder** that can be used to decode a stream of bytes.

The stream decoder is smart; it does not do partial reads like node-protodef does. It utilizes *generator functions*.

```ts
const streamDecoder = protocol.streamDecoder("myPacket");

let rt = {
  buffer,
  offset: 0,
  available: buffer.byteLength,
  view: new DataView(buffer),
}

const iter = streamDecoder(rt);
let state;
do {
  state = iter.next();
  if (!state.done) {
    alloc(state.value);
  }
} while (!state.done);

let packet = state.value;
```

A stream decoder generator function takes in a `StreamDecodeRuntime` and returns a generator.

The returned generator uses the buffer, offset, available amount and the data view from the provided shared runtime object.

The generator *yields* (`next()` returns with `{ done: false, value: number }`) a number when it reaches the end of the available buffer. The yielded number is the amount of bytes the decoder needs to proceed; the caller must only run `next()` again after the shared buffer gets appended at least that amount of bytes.

When a packet is successfully decoded, the generator returns the decoded packet. (`next()` returns `{ done: true, value: Packet }`)

## Codecs

A codec is a set of functions that generate serializing or deserializing code for a certain ProtoDef data type.

The functions use the `writer` to write JavaScript code. The context argument contains names of certain variables (such as `ctx.buffer`, `ctx.offset` etc)

```ts
type Options = number
let custom: Codec<Options> = {
  encode(writer, ctx) {}
  decode(writer, ctx) {}
  encodedSize(writer, ctx) {}
}

let proto = new Protocol({
  natives: { custom },
  types: {
    packet: ["custom", 1],
  },
})
```

## Advanced

You can use `ProtocolGenerator` and its methods to have more control over the generated code.
