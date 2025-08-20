import { expect, test } from "vitest";
import { Protocol } from "../src/proto/Protocol.js";
import { importNativeTypes } from "../src/native/index.js";
import { testWriteRead } from "./utils.js";


const testProto = test.extend<{ proto: Protocol }>({
    proto: async ({ }, use) => {
        await use(new Protocol({
            protocol: {
                types: {
                    ...importNativeTypes,
                    u8cstringArray: ["array", {
                        countType: "u8",
                        type: "cstring",
                    }],
                },
            },
        }));
    },
});

testProto("cstring", ({ proto }) => {
    testWriteRead(proto, "cstring", "Meow", [77, 101, 111, 119, 0]);
});

testProto("void", ({ proto }) => {
    testWriteRead(proto, "void", null, []);
});

testProto("bool", ({ proto }) => {
    testWriteRead(proto, "bool", true, [1]);
    testWriteRead(proto, "bool", false, [0]);
});


testProto("array<count:u8, cstring>", ({ proto }) => {
    testWriteRead(proto, "u8cstringArray", [], [0]);
    testWriteRead(proto, "u8cstringArray", ["Meow"], [1, 77, 101, 111, 119, 0]);
    testWriteRead(proto, "u8cstringArray", ["a", "b"], [2, 97, 0, 98, 0]);
});

testProto("varint", ({ proto }) => {
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

testProto("varlong", ({ proto }) => {
    testWriteRead(proto, "varint64", 9223372036854775807n, [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x7f]);
});
