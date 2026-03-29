import { expect, test } from "vitest";
import { Protocol } from "../src/protocol/Protocol.js";
import { StreamDecoderDriver } from "../src/streaming/driver.js";
import { createDecodeTransform } from "../src/streaming/web.js";

const readAll = async <T>(readable: ReadableStream<T>): Promise<T[]> => {
	const out: T[] = [];
	const reader = readable.getReader();

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		out.push(value);
	}

	return out;
};

test("stream decode: varint across chunk boundary", () => {
	const proto = new Protocol({
		types: {
			test: "varint",
		},
	});

	const streamDecoder = proto.streamDecoder<number>("test");
	const driver = new StreamDecoderDriver(streamDecoder, { initialCapacity: 2 });

	driver.push(new Uint8Array([0xdd, 0xc7]));
	expect(driver.decode()).toEqual([]);
	driver.push(new Uint8Array([0x01]));
	expect(driver.decode()).toEqual([25565]);
});

test("stream decode: multiple cstring packets", () => {
	const proto = new Protocol({
		types: {
			test: "cstring",
		},
	});

	const streamDecoder = proto.streamDecoder<string>("test");
	const driver = new StreamDecoderDriver(streamDecoder, { initialCapacity: 4 });
	const out: string[] = [];

	driver.push(new Uint8Array([77]));
	out.push(...driver.decode()); // "M"
	driver.push(new Uint8Array([101, 111, 119, 0, 97, 0]));
	out.push(...driver.decode()); // "eow\0a\0"

	expect(out).toEqual(["Meow", "a"]);
});

test("stream decode: pstring with dynamic countType", () => {
	const proto = new Protocol({
		types: {
			test: ["pstring", { countType: "u8" }],
		},
	});

	const streamDecoder = proto.streamDecoder<string>("test");
	const driver = new StreamDecoderDriver(streamDecoder, { initialCapacity: 3 });

	driver.push(new Uint8Array([4, 77]));
	expect(driver.decode()).toEqual([]);
	driver.push(new Uint8Array([101, 111, 119]))
	expect(driver.decode()).toEqual(["Meow"]);
});

test("stream decode: Web TransformStream API", async () => {
	const proto = new Protocol({
		types: {
			test: "varint",
		},
	});

	const streamDecoder = proto.streamDecoder<number>("test");

	const transform = createDecodeTransform(streamDecoder);
	const writer = transform.writable.getWriter();
	const outPromise = readAll(transform.readable);

	await writer.write(new Uint8Array([0xdd]));
	await writer.write(new Uint8Array([0xc7, 0x01, 0x02]));
	await writer.close();

	const out = await outPromise;
	expect(out).toEqual([25565, 2]);
});
