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
    testWriteRead(proto, "cstring", "Meow", [77, 101, 111, 119, 0]);
});

test("void", () => {
    testWriteRead(proto, "void", null, []);
});

test("bool", () => {
    testWriteRead(proto, "bool", true, [1]);
    testWriteRead(proto, "bool", false, [0]);
});


test("array<count:u8, cstring>", () => {
    testWriteRead(proto, "u8cstringArray", [], [0]);
    testWriteRead(proto, "u8cstringArray", ["Meow"], [1, 77, 101, 111, 119, 0]);
    testWriteRead(proto, "u8cstringArray", ["a", "b"], [2, 97, 0, 98, 0]);
});

test("varint", () => {
    testWriteRead(proto, "varint", 0, [0x00]);
    testWriteRead(proto, "varint", 2, [0x02]);
    testWriteRead(proto, "varint", 127, [0x7f]);
    testWriteRead(proto, "varint", 128, [0x80, 0x01]);
    testWriteRead(proto, "varint", 255, [0xff, 0x01]);
    testWriteRead(proto, "varint", 25565, [0xdd, 0xc7, 0x01]);
    testWriteRead(proto, "varint", 2097151, [0xff, 0xff, 0x7f]);
    testWriteRead(proto, "varint", 2097151, [0xff, 0xff, 0x7f]);
    testWriteRead(proto, "varint", 2147483647, [0xff, 0xff, 0xff, 0xff, 0x07]);
    testWriteRead(proto, "varint", -1, [0xff, 0xff, 0xff, 0xff, 0x0f]);
    testWriteRead(proto, "varint", -2147483648, [0x80, 0x80, 0x80, 0x80, 0x08]);
});

test("varlong", () => {
    testWriteRead(proto, "varint64", 9223372036854775807n, [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x7f]);
});

test("mapper<u8>", () => {
    testWriteRead(proto, "rgbEnum", "red", [0]);
    testWriteRead(proto, "rgbEnum", "green", [1]);
    testWriteRead(proto, "rgbEnum", "blue", [2]);
    // testWriteRead(proto, "rgbEnum", "nonexistent", [0]);
});

test("container > bitfield (anon)", () => {
    let packet = { "metadata": 14, "blockId": 806, "y": 4, "z": 6, "x": 1 };
    testWriteRead(proto, "bitfieldTest", packet, [0xe3, 0x26, 0x04, 0x61]);
});
