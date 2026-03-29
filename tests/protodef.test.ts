import { test } from "vitest";
import { roundtrip } from "./utils.js";

test("conditional/switch/container including a switch going to u8, u16 or u32/u8", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"container",
				[
					{
						"name": "action",
						"type": "u8"
					},
					{
						"name": "result",
						"type": [
							"switch",
							{
								"compareTo": "action",
								"fields": {
									"0": "u8",
									"1": "u16",
									"2": "u32"
								}
							}
						]
					}
				]
			],
		},
		packet: { "action": 0, "result": 3 },
		expectBuffer: new Uint8Array([0, 3]),
		annotate,
	});
});

test("conditional/switch/container including a switch going to u8, u16 or u32/u32", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"container",
				[
					{
						"name": "action",
						"type": "u8"
					},
					{
						"name": "result",
						"type": [
							"switch",
							{
								"compareTo": "action",
								"fields": {
									"0": "u8",
									"1": "u16",
									"2": "u32"
								}
							}
						]
					}
				]
			],
		},
		packet: { "action": 2, "result": 4294966272 },
		expectBuffer: new Uint8Array([2, 255, 255, 252, 0]),
		annotate,
	});
});

test("conditional/switch/container with a variable/active", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"container",
				[
					{
						"name": "color",
						"type": "i32"
					},
					{
						"name": "opacity",
						"type": [
							"switch",
							{
								"compareTo": "color",
								"fields": {
									"3": "void"
								},
								"default": "u8"
							}
						]
					}
				]
			],
		},
		packet: { "color": 3, "opacity": null },
		expectBuffer: new Uint8Array([0, 0, 0, 3]),
		annotate,
	});
});

test("conditional/switch/container with a variable/inactive", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"container",
				[
					{
						"name": "color",
						"type": "i32"
					},
					{
						"name": "opacity",
						"type": [
							"switch",
							{
								"compareTo": "color",
								"fields": {
									"3": "void"
								},
								"default": "u8"
							}
						]
					}
				]
			],
		},
		packet: { "color": 2, "opacity": 4 },
		expectBuffer: new Uint8Array([0, 0, 0, 2, 4]),
		annotate,
	});
});

test("conditional/option/optional u16", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"option",
				"u16"
			],
		},
		packet: 61303,
		expectBuffer: new Uint8Array([1, 239, 119]),
		annotate,
	});
});

test("conditional/option/optional u16", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"option",
				"u16"
			],
		},
		packet: null,
		expectBuffer: new Uint8Array([0]),
		annotate,
	});
});

test("numeric/i8/positive", ({ annotate }) => {
	roundtrip({
		types: {
			test: "i8",
		},
		packet: 61,
		expectBuffer: new Uint8Array([61]),
		annotate,
	});
});

test("numeric/i8/negative", ({ annotate }) => {
	roundtrip({
		types: {
			test: "i8",
		},
		packet: -122,
		expectBuffer: new Uint8Array([134]),
		annotate,
	});
});

test("numeric/u8/positive", ({ annotate }) => {
	roundtrip({
		types: {
			test: "u8",
		},
		packet: 61,
		expectBuffer: new Uint8Array([61]),
		annotate,
	});
});

test("numeric/u8/negative", ({ annotate }) => {
	roundtrip({
		types: {
			test: "u8",
		},
		packet: 134,
		expectBuffer: new Uint8Array([134]),
		annotate,
	});
});

test("numeric/i16/positive", ({ annotate }) => {
	roundtrip({
		types: {
			test: "i16",
		},
		packet: 12423,
		expectBuffer: new Uint8Array([48, 135]),
		annotate,
	});
});

test("numeric/i16/negative", ({ annotate }) => {
	roundtrip({
		types: {
			test: "i16",
		},
		packet: -4233,
		expectBuffer: new Uint8Array([239, 119]),
		annotate,
	});
});

test("numeric/u16/positive", ({ annotate }) => {
	roundtrip({
		types: {
			test: "u16",
		},
		packet: 12423,
		expectBuffer: new Uint8Array([48, 135]),
		annotate,
	});
});

test("numeric/u16/negative", ({ annotate }) => {
	roundtrip({
		types: {
			test: "u16",
		},
		packet: 61303,
		expectBuffer: new Uint8Array([239, 119]),
		annotate,
	});
});

test("numeric/i32/positive", ({ annotate }) => {
	roundtrip({
		types: {
			test: "i32",
		},
		packet: 234,
		expectBuffer: new Uint8Array([0, 0, 0, 234]),
		annotate,
	});
});

test("numeric/i32/negative", ({ annotate }) => {
	roundtrip({
		types: {
			test: "i32",
		},
		packet: -1024,
		expectBuffer: new Uint8Array([255, 255, 252, 0]),
		annotate,
	});
});

test("numeric/u32/positive", ({ annotate }) => {
	roundtrip({
		types: {
			test: "u32",
		},
		packet: 234,
		expectBuffer: new Uint8Array([0, 0, 0, 234]),
		annotate,
	});
});

test("numeric/u32/negative", ({ annotate }) => {
	roundtrip({
		types: {
			test: "u32",
		},
		packet: 4294966272,
		expectBuffer: new Uint8Array([255, 255, 252, 0]),
		annotate,
	});
});

test("numeric/f32/positive", ({ annotate }) => {
	roundtrip({
		types: {
			test: "f32",
		},
		packet: 34243,
		expectBuffer: new Uint8Array([71, 5, 195, 0]),
		annotate,
	});
});

test("numeric/f32/negative", ({ annotate }) => {
	roundtrip({
		types: {
			test: "f32",
		},
		packet: -12435,
		expectBuffer: new Uint8Array([198, 66, 76, 0]),
		annotate,
	});
});

test("numeric/f64/positive", ({ annotate }) => {
	roundtrip({
		types: {
			test: "f64",
		},
		packet: 34243,
		expectBuffer: new Uint8Array([64, 224, 184, 96, 0, 0, 0, 0]),
		annotate,
	});
});

test("numeric/f64/negative", ({ annotate }) => {
	roundtrip({
		types: {
			test: "f64",
		},
		packet: -12435,
		expectBuffer: new Uint8Array([192, 200, 73, 128, 0, 0, 0, 0]),
		annotate,
	});
});

test("numeric/i64/small", ({ annotate }) => {
	roundtrip({
		types: {
			test: "i64",
		},
		packet: 255n,
		expectBuffer: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 255]),
		annotate,
	});
});

test("numeric/i64/big", ({ annotate }) => {
	roundtrip({
		types: {
			test: "i64",
		},
		packet: -9151314442816847872n,
		expectBuffer: new Uint8Array([129, 0, 0, 0, 0, 0, 0, 0]),
		annotate,
	});
});

test("numeric/u64/small", ({ annotate }) => {
	roundtrip({
		types: {
			test: "u64",
		},
		packet: 255n,
		expectBuffer: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 255]),
		annotate,
	});
});

test("numeric/u64/big", ({ annotate }) => {
	roundtrip({
		types: {
			test: "u64",
		},
		packet: 9151314442816847872n,
		expectBuffer: new Uint8Array([127, 0, 0, 0, 0, 0, 0, 0]),
		annotate,
	});
});

test("numeric/li8/positive", ({ annotate }) => {
	roundtrip({
		types: {
			test: "li8",
		},
		packet: 61,
		expectBuffer: new Uint8Array([61]),
		annotate,
	});
});

test("numeric/li8/negative", ({ annotate }) => {
	roundtrip({
		types: {
			test: "li8",
		},
		packet: -122,
		expectBuffer: new Uint8Array([134]),
		annotate,
	});
});

test("numeric/lu8/positive", ({ annotate }) => {
	roundtrip({
		types: {
			test: "lu8",
		},
		packet: 61,
		expectBuffer: new Uint8Array([61]),
		annotate,
	});
});

test("numeric/lu8/negative", ({ annotate }) => {
	roundtrip({
		types: {
			test: "lu8",
		},
		packet: 134,
		expectBuffer: new Uint8Array([134]),
		annotate,
	});
});

test("numeric/li16/positive", ({ annotate }) => {
	roundtrip({
		types: {
			test: "li16",
		},
		packet: 12423,
		expectBuffer: new Uint8Array([135, 48]),
		annotate,
	});
});

test("numeric/li16/negative", ({ annotate }) => {
	roundtrip({
		types: {
			test: "li16",
		},
		packet: -4233,
		expectBuffer: new Uint8Array([119, 239]),
		annotate,
	});
});

test("numeric/lu16/positive", ({ annotate }) => {
	roundtrip({
		types: {
			test: "lu16",
		},
		packet: 12423,
		expectBuffer: new Uint8Array([135, 48]),
		annotate,
	});
});

test("numeric/lu16/negative", ({ annotate }) => {
	roundtrip({
		types: {
			test: "lu16",
		},
		packet: 61303,
		expectBuffer: new Uint8Array([119, 239]),
		annotate,
	});
});

test("numeric/li32/positive", ({ annotate }) => {
	roundtrip({
		types: {
			test: "li32",
		},
		packet: 234,
		expectBuffer: new Uint8Array([234, 0, 0, 0]),
		annotate,
	});
});

test("numeric/li32/negative", ({ annotate }) => {
	roundtrip({
		types: {
			test: "li32",
		},
		packet: -1024,
		expectBuffer: new Uint8Array([0, 252, 255, 255]),
		annotate,
	});
});

test("numeric/lu32/positive", ({ annotate }) => {
	roundtrip({
		types: {
			test: "lu32",
		},
		packet: 234,
		expectBuffer: new Uint8Array([234, 0, 0, 0]),
		annotate,
	});
});

test("numeric/lu32/negative", ({ annotate }) => {
	roundtrip({
		types: {
			test: "lu32",
		},
		packet: 4294966272,
		expectBuffer: new Uint8Array([0, 252, 255, 255]),
		annotate,
	});
});

test("numeric/lf32/positive", ({ annotate }) => {
	roundtrip({
		types: {
			test: "lf32",
		},
		packet: 34243,
		expectBuffer: new Uint8Array([0, 195, 5, 71]),
		annotate,
	});
});

test("numeric/lf32/negative", ({ annotate }) => {
	roundtrip({
		types: {
			test: "lf32",
		},
		packet: -12435,
		expectBuffer: new Uint8Array([0, 76, 66, 198]),
		annotate,
	});
});

test("numeric/lf64/positive", ({ annotate }) => {
	roundtrip({
		types: {
			test: "lf64",
		},
		packet: 34243,
		expectBuffer: new Uint8Array([0, 0, 0, 0, 96, 184, 224, 64]),
		annotate,
	});
});

test("numeric/lf64/negative", ({ annotate }) => {
	roundtrip({
		types: {
			test: "lf64",
		},
		packet: -12435,
		expectBuffer: new Uint8Array([0, 0, 0, 0, 128, 73, 200, 192]),
		annotate,
	});
});

test("numeric/li64/small", ({ annotate }) => {
	roundtrip({
		types: {
			test: "li64",
		},
		packet: 255n,
		expectBuffer: new Uint8Array([255, 0, 0, 0, 0, 0, 0, 0]),
		annotate,
	});
});

test("numeric/li64/big", ({ annotate }) => {
	roundtrip({
		types: {
			test: "li64",
		},
		packet: -9151314442816847872n,
		expectBuffer: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 129]),
		annotate,
	});
});

test("numeric/lu64/small", ({ annotate }) => {
	roundtrip({
		types: {
			test: "lu64",
		},
		packet: 255n,
		expectBuffer: new Uint8Array([255, 0, 0, 0, 0, 0, 0, 0]),
		annotate,
	});
});

test("numeric/lu64/big", ({ annotate }) => {
	roundtrip({
		types: {
			test: "lu64",
		},
		packet: 9151314442816847872n,
		expectBuffer: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 127]),
		annotate,
	});
});

test("structures/container/simple container with 2 u8 and one varint", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"container",
				[
					{
						"name": "horizontalPos",
						"type": "u8"
					},
					{
						"name": "y",
						"type": "u8"
					},
					{
						"name": "blockId",
						"type": "varint"
					}
				]
			],
		},
		packet: { "horizontalPos": 56, "y": 25, "blockId": 5 },
		expectBuffer: new Uint8Array([56, 25, 5]),
		annotate,
	});
});

test("structures/container/set_protocol", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"container",
				[
					{
						"name": "protocolVersion",
						"type": "varint"
					},
					{
						"name": "serverHost",
						"type": [
							"pstring",
							{
								"countType": "varint"
							}
						]
					},
					{
						"name": "serverPort",
						"type": "u16"
					},
					{
						"name": "nextState",
						"type": "varint"
					}
				]
			],
		},
		packet: { "protocolVersion": 47, "serverHost": "127.0.0.1", "serverPort": 25565, "nextState": 1 },
		expectBuffer: new Uint8Array([47, 9, 49, 50, 55, 46, 48, 46, 48, 46, 49, 99, 221, 1]),
		annotate,
	});
});

test("structures/container/container with 2 bitfields", ({ annotate }) => {
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
		packet: { "metadata": 14, "blockId": 806, "y": 4, "z": 6, "x": 1 },
		expectBuffer: new Uint8Array([227, 38, 4, 97]),
		annotate,
	});
});

test("structures/container/container with 2 bitfields in an array in a container", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"container",
				[
					{
						"name": "chunkX",
						"type": "i32"
					},
					{
						"name": "chunkZ",
						"type": "i32"
					},
					{
						"name": "recordCount",
						"type": [
							"count",
							{
								"type": "i16",
								"countFor": "records"
							}
						]
					},
					{
						"name": "dataLength",
						"type": "i32"
					},
					{
						"name": "records",
						"type": [
							"array",
							{
								"count": "recordCount",
								"type": [
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
								]
							}
						]
					}
				]
			],
		},
		packet: { "chunkX": 25, "chunkZ": 66, "recordCount": 2, "dataLength": 8, "records": [{ "metadata": 14, "blockId": 806, "y": 4, "z": 6, "x": 1 }, { "metadata": 13, "blockId": 806, "y": 4, "z": 0, "x": 6 }] },
		expectBuffer: new Uint8Array([0, 0, 0, 25, 0, 0, 0, 66, 0, 2, 0, 0, 0, 8, 227, 38, 4, 97, 211, 38, 4, 6]),
		annotate,
	});
});

test("structures/count/a container with a count, a second field and an array using the count", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"container",
				[
					{
						"name": "number",
						"type": [
							"count",
							{
								"type": "u8",
								"countFor": "records"
							}
						]
					},
					{
						"name": "diameter",
						"type": "u8"
					},
					{
						"name": "records",
						"type": [
							"array",
							{
								"count": "number",
								"type": "u8"
							}
						]
					}
				]
			],
		},
		packet: { "number": 2, "diameter": 5, "records": [1, 2] },
		expectBuffer: new Uint8Array([2, 5, 1, 2]),
		annotate,
	});
});

test("structures/array/a simple u16 prefixed array of u8", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"array",
				{
					"countType": "u16",
					"type": "u8"
				}
			],
		},
		packet: [1, 2, 3, 4],
		expectBuffer: new Uint8Array([0, 4, 1, 2, 3, 4]),
		annotate,
	});
});

test("utils/bool/binary 0 is false", ({ annotate }) => {
	roundtrip({
		types: {
			test: "bool",
		},
		packet: false,
		expectBuffer: new Uint8Array([0]),
		annotate,
	});
});

test("utils/bool/1 is true", ({ annotate }) => {
	roundtrip({
		types: {
			test: "bool",
		},
		packet: true,
		expectBuffer: new Uint8Array([1]),
		annotate,
	});
});

test("utils/varint/8-bit integer", ({ annotate }) => {
	roundtrip({
		types: {
			test: "varint",
		},
		packet: 1,
		expectBuffer: new Uint8Array([1]),
		annotate,
	});
});

test("utils/varint/8-bit maximum integer", ({ annotate }) => {
	roundtrip({
		types: {
			test: "varint",
		},
		packet: 127,
		expectBuffer: new Uint8Array([127]),
		annotate,
	});
});

test("utils/varint/16-bit integer", ({ annotate }) => {
	roundtrip({
		types: {
			test: "varint",
		},
		packet: 300,
		expectBuffer: new Uint8Array([172, 2]),
		annotate,
	});
});

test("utils/varint/24-bit integer", ({ annotate }) => {
	roundtrip({
		types: {
			test: "varint",
		},
		packet: 100000,
		expectBuffer: new Uint8Array([160, 141, 6]),
		annotate,
	});
});

test("utils/varint/32-bit integer", ({ annotate }) => {
	roundtrip({
		types: {
			test: "varint",
		},
		packet: 16909060,
		expectBuffer: new Uint8Array([132, 134, 136, 8]),
		annotate,
	});
});

test("utils/varint/negative integer", ({ annotate }) => {
	roundtrip({
		types: {
			test: "varint",
		},
		packet: -1,
		expectBuffer: new Uint8Array([255, 255, 255, 255, 15]),
		annotate,
	});
});

test("utils/varint/maximum varint (32bit)", ({ annotate }) => {
	roundtrip({
		types: {
			test: "varint",
		},
		packet: 2147483647,
		expectBuffer: new Uint8Array([255, 255, 255, 255, 7]),
		annotate,
	});
});

test("utils/varint/minimum varint (32bit)", ({ annotate }) => {
	roundtrip({
		types: {
			test: "varint",
		},
		packet: -2147483648,
		expectBuffer: new Uint8Array([128, 128, 128, 128, 8]),
		annotate,
	});
});

test("utils/varint64/8-bit integer", ({ annotate }) => {
	roundtrip({
		types: {
			test: "varint64",
		},
		packet: 1n,
		expectBuffer: new Uint8Array([1]),
		annotate,
	});
});

test("utils/varint64/8-bit maximum integer", ({ annotate }) => {
	roundtrip({
		types: {
			test: "varint64",
		},
		packet: 127n,
		expectBuffer: new Uint8Array([127]),
		annotate,
	});
});

test("utils/varint64/16-bit integer", ({ annotate }) => {
	roundtrip({
		types: {
			test: "varint64",
		},
		packet: 300n,
		expectBuffer: new Uint8Array([172, 2]),
		annotate,
	});
});

test("utils/varint64/24-bit integer", ({ annotate }) => {
	roundtrip({
		types: {
			test: "varint64",
		},
		packet: 100000n,
		expectBuffer: new Uint8Array([160, 141, 6]),
		annotate,
	});
});

test("utils/varint64/32-bit integer", ({ annotate }) => {
	roundtrip({
		types: {
			test: "varint64",
		},
		packet: 16909060n,
		expectBuffer: new Uint8Array([132, 134, 136, 8]),
		annotate,
	});
});

test("utils/varint128/8-bit integer", ({ annotate }) => {
	roundtrip({
		types: {
			test: "varint128",
		},
		packet: 1n,
		expectBuffer: new Uint8Array([1]),
		annotate,
	});
});

test("utils/varint128/8-bit maximum integer", ({ annotate }) => {
	roundtrip({
		types: {
			test: "varint128",
		},
		packet: 127n,
		expectBuffer: new Uint8Array([127]),
		annotate,
	});
});

test("utils/varint128/16-bit integer", ({ annotate }) => {
	roundtrip({
		types: {
			test: "varint128",
		},
		packet: 300n,
		expectBuffer: new Uint8Array([172, 2]),
		annotate,
	});
});

test("utils/varint128/24-bit integer", ({ annotate }) => {
	roundtrip({
		types: {
			test: "varint128",
		},
		packet: 100000n,
		expectBuffer: new Uint8Array([160, 141, 6]),
		annotate,
	});
});

test("utils/varint128/32-bit integer", ({ annotate }) => {
	roundtrip({
		types: {
			test: "varint128",
		},
		packet: 16909060n,
		expectBuffer: new Uint8Array([132, 134, 136, 8]),
		annotate,
	});
});

test("utils/zigzag32/8-bit integer", ({ annotate }) => {
	roundtrip({
		types: {
			test: "zigzag32",
		},
		packet: 1,
		expectBuffer: new Uint8Array([2]),
		annotate,
	});
});

test("utils/zigzag64/8-bit integer", ({ annotate }) => {
	roundtrip({
		types: {
			test: "zigzag64",
		},
		packet: 1n,
		expectBuffer: new Uint8Array([2]),
		annotate,
	});
});

test("utils/buffer/a fixed size buffer", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"buffer",
				{
					"count": 3
				}
			],
		},
		packet: new Uint8Array([5, 16, 174]),
		expectBuffer: new Uint8Array([5, 16, 174]),
		annotate,
	});
});

test("utils/buffer/an u8 prefixed buffer", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"buffer",
				{
					"countType": "u8"
				}
			],
		},
		packet: new Uint8Array([5, 16, 174]),
		expectBuffer: new Uint8Array([3, 5, 16, 174]),
		annotate,
	});
});

test("utils/pstring/fixed size string/simple hello", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"pstring",
				{
					"count": 6
				}
			],
		},
		packet: "Hello!",
		expectBuffer: new Uint8Array([72, 101, 108, 108, 111, 33]),
		annotate,
	});
});

test("utils/pstring/i16 prefixed string/simple hello", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"pstring",
				{
					"countType": "i16"
				}
			],
		},
		packet: "Hello!",
		expectBuffer: new Uint8Array([0, 6, 72, 101, 108, 108, 111, 33]),
		annotate,
	});
});

test("utils/pstring/i16 prefixed string/japanese", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"pstring",
				{
					"countType": "i16"
				}
			],
		},
		packet: "こんにちは!",
		expectBuffer: new Uint8Array([0, 16, 227, 129, 147, 227, 130, 147, 227, 129, 171, 227, 129, 161, 227, 129, 175, 33]),
		annotate,
	});
});

test("utils/pstring/varint prefixed string/simple hello", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"pstring",
				{
					"countType": "varint"
				}
			],
		},
		packet: "Hello!",
		expectBuffer: new Uint8Array([6, 72, 101, 108, 108, 111, 33]),
		annotate,
	});
});

test("utils/pstring/varint prefixed string/japanese", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"pstring",
				{
					"countType": "varint"
				}
			],
		},
		packet: "こんにちは!",
		expectBuffer: new Uint8Array([16, 227, 129, 147, 227, 130, 147, 227, 129, 171, 227, 129, 161, 227, 129, 175, 33]),
		annotate,
	});
});

test("utils/cstring/simple hello", ({ annotate }) => {
	roundtrip({
		types: {
			test: "cstring",
		},
		packet: "Hello!",
		expectBuffer: new Uint8Array([72, 101, 108, 108, 111, 33, 0]),
		annotate,
	});
});

test("utils/cstring/japanese", ({ annotate }) => {
	roundtrip({
		types: {
			test: "cstring",
		},
		packet: "こんにちは!",
		expectBuffer: new Uint8Array([227, 129, 147, 227, 130, 147, 227, 129, 171, 227, 129, 161, 227, 129, 175, 33, 0]),
		annotate,
	});
});

test("utils/void/undefined", ({ annotate }) => {
	roundtrip({
		types: {
			test: "void",
		},
		packet: null,
		expectBuffer: new Uint8Array([]),
		annotate,
	});
});

test("utils/bitfield/an unsigned 8 bit number", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"bitfield",
				[
					{
						"name": "one",
						"size": 8,
						"signed": false
					}
				]
			],
		},
		packet: { "one": 255 },
		expectBuffer: new Uint8Array([255]),
		annotate,
	});
});

test("utils/bitfield/a signed 8 bit number", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"bitfield",
				[
					{
						"name": "one",
						"size": 8,
						"signed": true
					}
				]
			],
		},
		packet: { "one": -1 },
		expectBuffer: new Uint8Array([255]),
		annotate,
	});
});

test("utils/bitfield/multiple signed 8 bit numbers", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"bitfield",
				[
					{
						"name": "one",
						"size": 8,
						"signed": true
					},
					{
						"name": "two",
						"size": 8,
						"signed": true
					},
					{
						"name": "three",
						"size": 8,
						"signed": true
					}
				]
			],
		},
		packet: { "one": -1, "two": -128, "three": 18 },
		expectBuffer: new Uint8Array([255, 128, 18]),
		annotate,
	});
});

test("utils/bitfield/multiple unsigned 4 bit numbers", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"bitfield",
				[
					{
						"name": "one",
						"size": 4,
						"signed": false
					},
					{
						"name": "two",
						"size": 4,
						"signed": false
					},
					{
						"name": "three",
						"size": 4,
						"signed": false
					}
				]
			],
		},
		packet: { "one": 15, "two": 15, "three": 8 },
		expectBuffer: new Uint8Array([255, 128]),
		annotate,
	});
});

test("utils/bitfield/multiple signed 4 bit numbers", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"bitfield",
				[
					{
						"name": "one",
						"size": 4,
						"signed": true
					},
					{
						"name": "two",
						"size": 4,
						"signed": true
					},
					{
						"name": "three",
						"size": 4,
						"signed": true
					}
				]
			],
		},
		packet: { "one": -1, "two": -1, "three": -8 },
		expectBuffer: new Uint8Array([255, 128]),
		annotate,
	});
});

test("utils/bitfield/an unsigned 12 bit number", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"bitfield",
				[
					{
						"name": "one",
						"size": 12,
						"signed": false
					}
				]
			],
		},
		packet: { "one": 4088 },
		expectBuffer: new Uint8Array([255, 128]),
		annotate,
	});
});

test("utils/bitfield/a complex structure", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"bitfield",
				[
					{
						"name": "x",
						"size": 26,
						"signed": true
					},
					{
						"name": "y",
						"size": 12,
						"signed": true
					},
					{
						"name": "z",
						"size": 26,
						"signed": true
					}
				]
			],
		},
		packet: { "x": 12, "y": 332, "z": 4382821 },
		expectBuffer: new Uint8Array([0, 0, 3, 5, 48, 66, 224, 101]),
		annotate,
	});
});

test("utils/bitflags/8bit bitset flag array", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"bitflags",
				{
					"type": "u8",
					"flags": [
						"onGround"
					]
				}
			],
		},
		packet: { "_value": 1, "onGround": true },
		expectBuffer: new Uint8Array([1]),
		annotate,
	});
});

test("utils/bitflags/8bit bitset flag object", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"bitflags",
				{
					"type": "u8",
					"flags": {
						"onGround": 1
					}
				}
			],
		},
		packet: { "_value": 1, "onGround": true },
		expectBuffer: new Uint8Array([1]),
		annotate,
	});
});

test("utils/bitflags/8bit bitset flag big object", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"bitflags",
				{
					"type": "u8",
					"big": true,
					"flags": {
						"onGround": 1
					}
				}
			],
		},
		packet: { "_value": 1, "onGround": true },
		expectBuffer: new Uint8Array([1]),
		annotate,
	});
});

test("utils/mapper/a mapper mapping 0 to zero, 1 to one and 2 to two/zero", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"mapper",
				{
					"type": "u8",
					"mappings": {
						"0": "zero",
						"1": "one",
						"2": "two"
					}
				}
			],
		},
		packet: "zero",
		expectBuffer: new Uint8Array([0]),
		annotate,
	});
});

test("utils/mapper/a mapper mapping 0 to zero, 1 to one and 2 to two/two", ({ annotate }) => {
	roundtrip({
		types: {
			test: [
				"mapper",
				{
					"type": "u8",
					"mappings": {
						"0": "zero",
						"1": "one",
						"2": "two"
					}
				}
			],
		},
		packet: "two",
		expectBuffer: new Uint8Array([2]),
		annotate,
	});
});
