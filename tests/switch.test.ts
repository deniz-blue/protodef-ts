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
                                    countType: "u8",
                                    type: ["container", [
                                        { name: "text", type: "string" },
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

    testWriteRead(proto, "testContainer", {
        documentName: "a",
        hasEntries: true,
        detailed: false,
        entries: [],
    }, [1, 97, 1, 0, 0])
})

test("container > switch > array > switch", () => {
    testWriteRead(proto, "testContainer", {
        documentName: "a",
        hasEntries: true,
        detailed: false,
        entries: [
            { text: "c", detailText: undefined },
            { text: "c", detailText: undefined },
        ],
    }, [1, 97, 1, 0, 2, 1, 99, 1, 99])

    testWriteRead(proto, "testContainer", {
        documentName: "a",
        hasEntries: true,
        detailed: true,
        entries: [
            { text: "c", detailText: "b" },
            { text: "c", detailText: "b" },
        ],
    }, [1, 97, 1, 1, 2, 1, 99, 1, 98, 1, 99, 1, 98])
})

