import { expect, test } from "vitest";
import { Protocol } from "../src/proto/Protocol.js";
import { importNativeTypes } from "../src/native/index.js";
import { testWriteRead } from "./utils.js";

const proto = new Protocol({
    protocol: {
        types: {
            ...importNativeTypes,
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
    },
});

test("cstring", () => {
    testWriteRead(proto, "cstring", "Meow", new Uint8Array([77, 101, 111, 119, 0]).buffer);
});

test("void", () => {
    testWriteRead(proto, "void", null, new Uint8Array([]).buffer);
});

test("bool", () => {
    testWriteRead(proto, "bool", true, new Uint8Array([1]).buffer);
    testWriteRead(proto, "bool", false, new Uint8Array([0]).buffer);
});


test("array<count:u8, cstring>", () => {
    testWriteRead(proto, "u8cstringArray", [], new Uint8Array([0]).buffer);
    testWriteRead(proto, "u8cstringArray", ["Meow"], new Uint8Array([1, 77, 101, 111, 119, 0]).buffer);
    testWriteRead(proto, "u8cstringArray", ["a", "b"], new Uint8Array([2, 97, 0, 98, 0]).buffer);
});

test("varint", () => {
    testWriteRead(proto, "varint", 0, new Uint8Array([0x00]).buffer);
    testWriteRead(proto, "varint", 2, new Uint8Array([0x02]).buffer);
    testWriteRead(proto, "varint", 127, new Uint8Array([0x7f]).buffer);
    testWriteRead(proto, "varint", 128, new Uint8Array([0x80, 0x01]).buffer);
    testWriteRead(proto, "varint", 255, new Uint8Array([0xff, 0x01]).buffer);
    testWriteRead(proto, "varint", 25565, new Uint8Array([0xdd, 0xc7, 0x01]).buffer);
    testWriteRead(proto, "varint", 2097151, new Uint8Array([0xff, 0xff, 0x7f]).buffer);
    testWriteRead(proto, "varint", 2097151, new Uint8Array([0xff, 0xff, 0x7f]).buffer);
    testWriteRead(proto, "varint", 2147483647, new Uint8Array([0xff, 0xff, 0xff, 0xff, 0x07]).buffer);
    testWriteRead(proto, "varint", -1, new Uint8Array([0xff, 0xff, 0xff, 0xff, 0x0f]).buffer);
    testWriteRead(proto, "varint", -2147483648, new Uint8Array([0x80, 0x80, 0x80, 0x80, 0x08]).buffer);
});

test("varlong", () => {
    testWriteRead(proto, "varint64", 9223372036854775807n, new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x7f]).buffer);
});

test("mapper<u8>", () => {
    testWriteRead(proto, "rgbEnum", "red", new Uint8Array([0]).buffer);
    testWriteRead(proto, "rgbEnum", "green", new Uint8Array([1]).buffer);
    testWriteRead(proto, "rgbEnum", "blue", new Uint8Array([2]).buffer);
    // testWriteRead(proto, "rgbEnum", "nonexistent", new Uint8Array([0]).buffer);
});

test("container > bitfield (anon)", () => {
    let packet = { "metadata": 14, "blockId": 806, "y": 4, "z": 6, "x": 1 };
    testWriteRead(proto, "bitfieldTest", packet, new Uint8Array([0xe3, 0x26, 0x04, 0x61]).buffer);
});
