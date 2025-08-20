import { test } from "vitest";
import { importNativeTypes } from "../src/native/index.js";
import { Protocol } from "../src/proto/Protocol.js";
import { testWriteRead } from "./utils.js";

const proto = new Protocol({
    protocol: {
        types: {
            ...importNativeTypes,

            string: ["pstring", { countType: "u8" }],
            testContainer: ["container", [
                { name: "documentName", type: "string" },
                { name: "hasEntries", type: "bool" },
                { name: "detailed", type: "bool" },
                {
                    name: "entries", type: [
                        "switch",
                        {
                            compareTo: "hasEntries",
                            fields: {
                                true: ["array", {
                                    countType: "i8",
                                    type: ["container", [
                                        { name: "text", type: "cstring" },
                                        {
                                            name: "detailText", type: [
                                                "switch",
                                                {
                                                    compareTo: "../detailed",
                                                    fields: {
                                                        true: "string",
                                                    },
                                                    default: "void",
                                                },
                                            ]
                                        },
                                    ]]
                                }]
                            },
                            default: "void",
                        },
                    ]
                },
            ]]
        },
    },
});

test("container > switch", () => {
    testWriteRead(proto, "testContainer", {
        documentName: "a",
        hasEntries: false,
        detailed: false,
        entries: undefined,
    }, [1, 97, 0, 0])
})

