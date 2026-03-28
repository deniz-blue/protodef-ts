import { test } from "vitest";
import { roundtrip, testWriteRead } from "./utils.js";
import { Protocol } from "../src/proto/Protocol.js";

const proto = new Protocol({
	types: {
		u8cstringArray: ["array", {
			countType: "u8",
			type: "cstring",
		}],
		rgbEnum: ["mapper", {
			type: "u8",
			mappings: {
				0: "red",
				1: "green",
				2: "blue",
			},
		}],
		bitfieldTest: [
			"container",
			[
				{
					"anon": true,
					"type": [
						"bitfield",
						[
							{
								"name": "metadata",
								"size": 4,
								"signed": false
							},
							{
								"name": "blockId",
								"size": 12,
								"signed": false
							}
						]
					]
				},
				{
					"name": "y",
					"type": "u8"
				},
				{
					"anon": true,
					"type": [
						"bitfield",
						[
							{
								"name": "z",
								"size": 4,
								"signed": false
							},
							{
								"name": "x",
								"size": 4,
								"signed": false
							}
						]
					]
				}
			]
		],
	},
});

test("cstring", ({ annotate }) => {
	roundtrip({
		proto,
		type: "cstring",
		packet: "Meow",
		expectBuffer: new Uint8Array([77, 101, 111, 119, 0]),
		annotate,
	});
	testWriteRead(proto, "cstring", "Meow", new Uint8Array([77, 101, 111, 119, 0]));
});

test("void", ({ annotate }) => {
	roundtrip({
		proto,
		type: "void",
		packet: null,
		expectBuffer: new Uint8Array([]),
		annotate,
	});
});

test("bool", ({ annotate }) => {
	roundtrip({
		proto,
		type: "bool",
		packet: true,
		expectBuffer: new Uint8Array([1]),
		annotate,
	});
	roundtrip({
		proto,
		type: "bool",
		packet: false,
		expectBuffer: new Uint8Array([0]),
		annotate,
	});
});


test("array<count:u8, cstring>", ({ annotate }) => {
	roundtrip({
		proto,
		type: "u8cstringArray",
		packet: [],
		expectBuffer: new Uint8Array([0]),
		annotate,
	});
	roundtrip({
		proto,
		type: "u8cstringArray",
		packet: ["Meow"],
		expectBuffer: new Uint8Array([1, 77, 101, 111, 119, 0]),
		annotate,
	});
	roundtrip({
		proto,
		type: "u8cstringArray",
		packet: ["a", "b"],
		expectBuffer: new Uint8Array([2, 97, 0, 98, 0]),
		annotate,
	});
});

test("varint", ({ annotate }) => {
	const cases: [number, Uint8Array][] = [
		[0, new Uint8Array([0x00])],
		[2, new Uint8Array([0x02])],
		[127, new Uint8Array([0x7f])],
		[128, new Uint8Array([0x80, 0x01])],
		[255, new Uint8Array([0xff, 0x01])],
		[25565, new Uint8Array([0xdd, 0xc7, 0x01])],
		[2097151, new Uint8Array([0xff, 0xff, 0x7f])],
		[2147483647, new Uint8Array([0xff, 0xff, 0xff, 0xff, 0x07])],
		[-1, new Uint8Array([0xff, 0xff, 0xff, 0xff, 0x0f])],
		[-2147483648, new Uint8Array([0x80, 0x80, 0x80, 0x80, 0x08])],
	];

	for(let [value, buffer] of cases) {
		roundtrip({
			proto,
			type: "varint",
			packet: value,
			expectBuffer: buffer,
			annotate,
		});
	}
});

test("varlong", ({ annotate }) => {
	roundtrip({
		proto,
		type: "varint64",
		packet: 9223372036854775807n,
		expectBuffer: new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x7f]),
		annotate,
	});
});

test("mapper<u8>", ({ annotate }) => {
	roundtrip({
		proto,
		type: "rgbEnum",
		packet: "red",
		expectBuffer: new Uint8Array([0]),
		annotate,
	});
	roundtrip({
		proto,
		type: "rgbEnum",
		packet: "green",
		expectBuffer: new Uint8Array([1]),
		annotate,
	});
	roundtrip({
		proto,
		type: "rgbEnum",
		packet: "blue",
		expectBuffer: new Uint8Array([2]),
		annotate,
	});
});

test("container > bitfield (anon)", ({ annotate }) => {
	let packet = { "metadata": 14, "blockId": 806, "y": 4, "z": 6, "x": 1 };
	roundtrip({
		proto,
		type: "bitfieldTest",
		packet,
		expectBuffer: new Uint8Array([0xe3, 0x26, 0x04, 0x61]),
		annotate,
	});
});
