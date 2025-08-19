import { importNativeTypes } from "../src/native/index.js";
import { Protocol } from "../src/proto/Protocol.js";
import type { ProtoDef } from "../src/types.js";

const protocol = {
    types: {
        ...importNativeTypes,

        string: ["pstring", { countType: "i8" }],
        testContainer: ["container", [
            { name: "cute", type: "bool" },
            { name: "num", type: "i32" },
            { name: "username", type: "string" },
            { name: "hasFunnies", type: "bool" },
            { name: "funnies", type: [
                "switch",
                {
                    compareTo: "hasFunnies",
                    fields: {
                        true: ["array", {
                            countType: "i8",
                            type: "string"
                        }]
                    },
                    default: "void",
                },
            ] },
        ]]
    },
} satisfies ProtoDef.Protocol;

const proto = new Protocol({
    protocol,
});

const value = {
    cute: true, // 1b
    num: 5, // i32, 4b
    username: "mrrp", // 4+1 b
    hasFunnies: true, // 1b
    funnies: [ // compareTo:hasFunnies ; 1b count
        "" // 1b count, 0b len
    ],
}; // TOTAL 13 if hasFunnies, 11 otherwise


console.log(proto.sizeDataType(
    protocol.types.testContainer,
    value,
    value,
    "",
    [],
))
