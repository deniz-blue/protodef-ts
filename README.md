# protodef-ts

A [ProtoDef](https://github.com/ProtoDef-io/ProtoDef) implementation in TypeScript.

Uses Uint8Array for binary data instead of NodeJS Buffer, and supports all the same types as the original ProtoDef library.

This library generates javascript code from a ProtoDef schema, which can be used to encode and decode data according to that schema.

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

const size = protocol.size("myPacket", { field1: 123, field2: "hello" }); // 6
const buffer = protocol.encode("myPacket", { field1: 123, field2: "hello" }); // Uint8Array [ 123, 104, 101, 108, 108, 111 ]
const data = protocol.decode("myPacket", buffer); // { field1: 123, field2: "hello" }

// Inspect the generated code:
console.log(protocol.generateDecoderCode("myPacket"));
```
