import { test } from "vitest";
import { testCases } from "./testData/index.js";
import { roundtrip, testWriteRead } from "./utils.js";
import { fillProtocolVariables } from "../src/compat/fillProtocolVariables.js";
import { Protocol } from "../src/proto/Protocol.js";

for(let { label, dataType, value, buffer, vars } of testCases) {
    test(label, ({ annotate }) => {
        const dataTypeName = "test";

        const proto = new Protocol({
            types: fillProtocolVariables({
                types: {
                    [dataTypeName]: dataType,
                },
            }, vars).types as any,
        });

        roundtrip({
            proto,
            type: dataTypeName,
            packet: value,
            expectBuffer: new Uint8Array(buffer),
			annotate,
        });
    });
}

