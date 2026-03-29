import { test } from "vitest";
import { roundtrip } from "./utils.js";

test("cstring", ({ annotate }) => {
	roundtrip({
		types: {
			test: "cstring",
		},
		packet: "Meow",
		expectBuffer: new Uint8Array([77, 101, 111, 119, 0]),
		annotate,
	});
});

test("void", ({ annotate }) => {
	roundtrip({
		types: {
			test: "void",
		},
		type: "void",
		packet: null,
		expectBuffer: new Uint8Array([]),
		annotate,
	});
});

test("bool", ({ annotate }) => {
	roundtrip({
		types: {
			test: "bool",
		},
		type: "bool",
		packet: true,
		expectBuffer: new Uint8Array([1]),
		annotate,
	});
	roundtrip({
		types: {
			test: "bool",
		},
		type: "bool",
		packet: false,
		expectBuffer: new Uint8Array([0]),
		annotate,
	});
});


test("array<count:u8, cstring>", ({ annotate }) => {
	roundtrip({
		types: {
			u8cstringArray: ["array", {
				countType: "u8",
				type: "cstring",
			}],
			test: "u8cstringArray",
		},
		packet: [],
		expectBuffer: new Uint8Array([0]),
		annotate,
	});
	roundtrip({
		types: {
			u8cstringArray: ["array", {
				countType: "u8",
				type: "cstring",
			}],
			test: "u8cstringArray",
		},
		packet: ["Meow"],
		expectBuffer: new Uint8Array([1, 77, 101, 111, 119, 0]),
		annotate,
	});
	roundtrip({
		types: {
			u8cstringArray: ["array", {
				countType: "u8",
				type: "cstring",
			}],
			test: "u8cstringArray",
		},
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

	for (let [value, buffer] of cases) {
		roundtrip({
			types: { test: "varint" },
			packet: value,
			expectBuffer: buffer,
			annotate,
		});
	}
});

test("varlong", ({ annotate }) => {
	roundtrip({
		types: { test: "varint64" },
		packet: 9223372036854775807n,
		expectBuffer: new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x7f]),
		annotate,
	});
});

test("mapper<u8>", ({ annotate }) => {
	const rgbEnum = ["mapper", {
		type: "u8",
		mappings: {
			0: "red",
			1: "green",
			2: "blue",
		},
	}] as ProtoDef.DataType;

	roundtrip({
		types: {
			rgbEnum,
			test: "rgbEnum",
		},
		packet: "red",
		expectBuffer: new Uint8Array([0]),
		annotate,
	});
	roundtrip({
		types: {
			rgbEnum,
			test: "rgbEnum",
		},
		packet: "green",
		expectBuffer: new Uint8Array([1]),
		annotate,
	});
	roundtrip({
		types: {
			test: "rgbEnum",
		},
		type: "rgbEnum",
		packet: "blue",
		expectBuffer: new Uint8Array([2]),
		annotate,
	});
});

test("container > bitfield (anon)", ({ annotate }) => {
	let packet = { "metadata": 14, "blockId": 806, "y": 4, "z": 6, "x": 1 };
	roundtrip({
		types: {
			test: [
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
		packet,
		expectBuffer: new Uint8Array([0xe3, 0x26, 0x04, 0x61]),
		annotate,
	});
});
