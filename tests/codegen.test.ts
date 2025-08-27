import { test } from "vitest";
import { ProtocolCodegen } from "../src/proto/ProtocolCodegen.js";
import { importNativeTypes } from "../src/native/index.js";

test("codegen test 1", () => {
    const codegen = new ProtocolCodegen({
        protocol: {
            types: {
                ...importNativeTypes,

                mapperTest: ["mapper", {
                    type: "u8",
                    mappings: {
                        "0": "red",
                        "1": "green",
                        "2": "blue",
                    },
                }],
                stringTest: ["pstring", { countType: "u8" }],
                switchTest: ["switch", {
                    compareTo: "meow",
                    fields: {
                        "1": "u8",
                        "2": "u16",
                    },
                    default: "void",
                }],
            },
        },
    })

    console.log("" + codegen.codegenRead("switchTest"))
    // console.log("" + codegen.codegenSize("switchTest"))
})
