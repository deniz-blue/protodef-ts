# protodef-next

[![Test](https://github.com/deniz-blue/protodef-next/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/deniz-blue/protodef-next/actions/workflows/test.yml)
[![NPM Version](https://img.shields.io/npm/v/protodef-next)](https://npmx.dev/package/protodef-next)
[![Docs](https://img.shields.io/badge/view-documentation-blue)](https://npmx.dev/package-docs/protodef-next/v/latest)
![GitHub last commit](https://img.shields.io/github/last-commit/deniz-blue/protodef-next)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A modern [ProtoDef](https://github.com/ProtoDef-io/ProtoDef) implementation in TypeScript.

- All ESM modules
- Does not use NodeJS Buffer (or any other NodeJS API - fully compatible with browsers)
- Supports all ProtoDef native types
- Generates efficient code for encoding and decoding
- [Stream Decoding](#streaming) without partial reads
- [TypeScript type generation](#type-generation) (handles `switch` very well)
- Almost as fast as compiled `node-protodef`!

## Installation

```bash
pnpm install protodef-next
```

## Usage

```ts
import { Protocol } from 'protodef-next';

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

let state = iter.next();
if (!state.done) {
	// state.value is the amount of bytes the decoder needs to proceed
	// call iter.next() again after appending at least that amount of bytes to the buffer
} else {
	let packet = state.value; // decoded packet
}
```

A stream decoder generator function takes in a `StreamDecodeRuntime` and returns a **generator**.

The returned generator uses the buffer, offset, available amount and the data view from the provided shared runtime object.

The generator *yields* (`next()` returns with `{ done: false, value: number }`) a number when it reaches the end of the available buffer. The yielded number is the amount of bytes the decoder needs to proceed; the caller must only run `next()` again after the shared buffer gets appended at least that amount of bytes.

When a packet is successfully decoded, the generator returns the decoded packet. (`next()` returns `{ done: true, value: Packet }`)

You can use the `SimpleRuntime` class to use the stream decoder more easily:

```ts
import { SimpleRuntime } from 'protodef-next/streaming';

const streamDecoder = protocol.streamDecoder("myPacket");
const runtime = new SimpleRuntime(streamDecoder);

// 1. Append bytes to the runtime's buffer as they come in
runtime.push(/* Uint8Array */ chunk);

// 2. Decode as much as possible
const packets = runtime.decode();

// 3. Repeat until the stream ends
```

Or you can import `createDecodeTransform` to create a web transform stream that decodes packets from a byte stream:

```ts
import { createDecodeTransform } from 'protodef-next/streaming';

const streamDecoder = protocol.streamDecoder("myPacket");
const decodeTransform = createDecodeTransform(streamDecoder);

// Pipe a byte stream into the transform to get a packet stream
byteStream.pipeThrough(decodeTransform).pipeTo(packetStream);
```

## Type Generation

`protodef-next` can generate TypeScript types for your protocol schema. The generated types are very accurate and reflect the actual structure of the decoded packets. They handle conditional types, the bane of type generation, very well.

```ts
import { ProtocolGenerator } from 'protodef-next';

const protocol = new ProtocolGenerator({
	types: {
		myPacket: ["container", [
			{ name: "field1", type: "varint" },
			{ name: "field2", type: "cstring" },
		]],
	},
});

const types = protocol.generateTypeDefinition("myPacket");
// export type myPacket = {
//   field1: number;
//   field2: string;
// };
```

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
