import { expect, test } from "vitest";
import { Protocol } from "../src/protocol/Protocol.js";

test("stream decode: varint across chunk boundary", () => {
	const proto = new Protocol({
		types: {
			test: "varint",
		},
	});

	const rt = proto.createStreamDecoder<number>("test", { initialCapacity: 2 });

	expect(rt.push(new Uint8Array([0xdd, 0xc7]))).toEqual([]);
	expect(rt.push(new Uint8Array([0x01]))).toEqual([25565]);
});

test("stream decode: multiple cstring packets", () => {
	const proto = new Protocol({
		types: {
			test: "cstring",
		},
	});

	const rt = proto.createStreamDecoder<string>("test", { initialCapacity: 4 });
	const out: string[] = [];

	out.push(...rt.push(new Uint8Array([77]))); // "M"
	out.push(...rt.push(new Uint8Array([101, 111, 119, 0, 97, 0]))); // "eow\0a\0"

	expect(out).toEqual(["Meow", "a"]);
});

test("stream decode: pstring with dynamic countType", () => {
	const proto = new Protocol({
		types: {
			test: ["pstring", { countType: "u8" }],
		},
	});

	const rt = proto.createStreamDecoder<string>("test", { initialCapacity: 3 });

	expect(rt.push(new Uint8Array([4, 77]))).toEqual([]);
	expect(rt.push(new Uint8Array([101, 111, 119]))).toEqual(["Meow"]);
});
