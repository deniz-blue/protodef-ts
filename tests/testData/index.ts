import type { ProtoDef } from "../../src/types.js";
import conditional from "./conditional.json" with { type: "json" }
import numeric from "./numeric.json" with { type: "json" }
import structures from "./structures.json" with { type: "json" }
import utils from "./utils.json" with { type: "json" }

// @ts-ignore
conditional[0]!.subtypes[1]!.values[0]!.value.opacity = null; 
// Change `"undefined"` to `null` (needed because of deep equal)

interface JsonTestNode {
    type?: string;
    subtypes?: Subtype[];
    values?: JsonValue[];
}

interface Subtype {
    description?: string;
    type?: ProtoDef.DataType | any;
    vars?: [string, any][];
    values?: JsonValue[];
}

interface JsonValue {
    description?: string;
    value: any;
    buffer: string[];
}

export interface TestCase {
    label: string;
    dataType: ProtoDef.DataType;
    value: any;
    buffer: ArrayBuffer;
    vars?: Record<string, any>;
};

export const testCases: TestCase[] = [];

const asBigInt = (ty: string, value: [number, number] | number) => {
    if(!Array.isArray(value)) return BigInt(value);
    const k = ty.includes("U") ? "asUintN" : "asIntN";
    return BigInt[k](64, BigInt(value[0]) << 32n) | BigInt[k](32, BigInt(value[1]))
};

const asArrayBuffer = (arr: string[]) => new Uint8Array(arr.map(x => parseInt(x.slice(2), 16))).buffer;

for (let [k, tests] of Object.entries({
    conditional,
    numeric,
    structures,
    utils,
})) {
    for (let test of tests) {
        if ("subtypes" in test) {
            for (let subtype of test.subtypes) {
                for (let testValue of subtype.values) {
                    let value = testValue.value as any;
                    let dataType = subtype.type as any;

                    testCases.push({
                        label: [
                            k,
                            test.type,
                            subtype.description,
                            "description" in testValue ? testValue.description : ""
                        ].filter(Boolean).join("/"),
                        dataType,
                        value,
                        buffer: asArrayBuffer(testValue.buffer),
                        vars: "vars" in subtype ? Object.fromEntries(subtype.vars) : {},
                    })
                }
            }
        } else if ("values" in test) {
            for (let testValue of test.values) {
                let value = testValue.value as any;
                let dataType = test.type as any;

                if (typeof dataType == "string"
                    && ((k == "numeric" || k == "utils") && (
                        dataType.endsWith("64")
                        || dataType.endsWith("128")
                    ) && (
                        !dataType.startsWith("f")
                        && !dataType.startsWith("lf")
                    ))
                )
                    value = asBigInt(dataType, value as any);

                if(typeof dataType == "string" && dataType == "buffer")
                    value = asArrayBuffer(value);

                testCases.push({
                    label: [
                        k,
                        test.type,
                        testValue.description,
                    ].filter(Boolean).join("/"),
                    dataType,
                    value,
                    buffer: asArrayBuffer(testValue.buffer),
                })
            }
        }
    }
}

