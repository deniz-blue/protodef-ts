import { test } from "vitest";
import { testCases } from "./testData/index.js";
import { Protocol } from "../src/proto/Protocol.js";
import { importNativeTypes } from "../src/native/index.js";
import { testWriteRead } from "./utils.js";
import { fillProtocolVariables } from "../src/compat/fillProtocolVariables.js";

for(let { label, dataType, value, buffer, vars } of testCases) {
    test(label, () => {
        const dataTypeName = "test";

        const proto = new Protocol({
            protocol: fillProtocolVariables({
                types: {
                    ...importNativeTypes,
                    [dataTypeName]: dataType,
                },
            }, vars),
        });

        testWriteRead(proto, dataTypeName, value, buffer);
    });
}

