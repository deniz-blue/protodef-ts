import { bench, describe } from "vitest";
import { importNativeTypes } from "../src/native/index.js";
import { Protocol } from "../src/proto/Protocol.js";
import type { ProtoDef } from "../src/types.js";
import ProtoDefNode from "protodef";

const protocol = {
    types: {
        ...importNativeTypes,

        string: ["pstring", { countType: "u8" }],
        packet: ["container", [
            { name: "documentName", type: "string" },
            {
                name: "properties", type: [
                    "array",
                    {
                        countType: "varint",
                        type: ["container", [
                            { name: "propertyName", type: "u8" },
                            { name: "propertyType", type: "string" },
                            {
                                name: "propertyValue",
                                type: [
                                    "switch",
                                    {
                                        compareTo: "propertyType",
                                        fields: {
                                            "string": "string",
                                            "number": "i32",
                                            "boolean": "bool",
                                        },
                                        default: "void",
                                    },
                                ],
                            },
                        ]],
                    },
                ]
            },
        ]],
    },
} satisfies ProtoDef.Protocol;

const exampleValue = {
    documentName: "meow",
    properties: [
        { propertyName: "a", propertyType: "string", propertyValue: "xyz" },
        { propertyName: "b", propertyType: "number", propertyValue: 2 },
        { propertyName: "c", propertyType: "boolean", propertyValue: true },
    ],
};

const exampleBuffer = (() => {
    const proto = new Protocol({
        protocol,
    });
    let buf = new ArrayBuffer(proto.size("packet", exampleValue));
    proto.write("packet", exampleValue, buf);
    return buf;
})();


const protoTs = new Protocol({
    protocol,
});

const protoNode = new ProtoDefNode.ProtoDef();
protoNode.addProtocol(protocol as any, []);

const protodefNodeCompiler = new ProtoDefNode.Compiler.ProtoDefCompiler();
protodefNodeCompiler.addProtocol(protocol as any, []);

const protoNodeCompiled = protodefNodeCompiler.compileProtoDefSync();



describe("size", () => {
    bench("protodef-ts", () => {
        protoTs.size("packet", exampleValue)
    });

    bench("node-protodef", () => {
        protoNode.sizeOf(exampleValue, "packet", exampleValue);
    });

    bench("node-protodef (compiled)", () => {
        protoNodeCompiled.sizeOf(exampleValue, "packet", exampleValue);
    });
})

describe("size + write", () => {
    bench("protodef-ts", () => {
        let size = protoTs.size("packet", exampleValue)
        let buffer = new ArrayBuffer(size)
        protoTs.write("packet", exampleValue, buffer)
    });

    bench("node-protodef", () => {
        let size = protoNode.sizeOf(exampleValue, "packet", exampleValue);
        let buffer = Buffer.allocUnsafe(size);
        protoNode.write(exampleValue, buffer, 0, "packet", exampleValue);
    });

    bench("node-protodef (compiled)", () => {
        let size = protoNodeCompiled.sizeOf(exampleValue, "packet", exampleValue);
        let buffer = Buffer.allocUnsafe(size);
        protoNodeCompiled.write(exampleValue, buffer, 0, "packet", exampleValue);
    });
})


describe("read", () => {
    bench("protodef-ts", () => {
        protoTs.read("packet", exampleBuffer);
    });

    bench("node-protodef", () => {
        protoNode.read(Buffer.from(exampleBuffer), 0, "packet", {});
    });

    bench("node-protodef (compiled)", () => {
        protoNodeCompiled.read(Buffer.from(exampleBuffer), 0, "packet", {});
    });
})
