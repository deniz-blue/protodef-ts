import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import conditional from "./conditional.json" with { type: "json" };
import numeric from "./numeric.json" with { type: "json" };
import structures from "./structures.json" with { type: "json" };
import utils from "./utils.json" with { type: "json" };

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

interface TestCase {
    label: string;
    dataType: ProtoDef.DataType;
    value: any;
    buffer: ArrayBuffer;
    vars?: Record<string, any>;
}

const asBigInt = (ty: string, value: [number, number] | number) => {
    if (!Array.isArray(value)) return BigInt(value);
    const k = ty.includes("U") ? "asUintN" : "asIntN";
    return BigInt[k](64, BigInt(value[0]) << 32n) | BigInt[k](32, BigInt(value[1]))
};

const asUint8Array = (arr: string[]) => new Uint8Array(arr.map(x => parseInt(x.slice(2), 16)));

const testCases: TestCase[] = [];

// @ts-ignore
conditional[0]!.subtypes[1]!.values[0]!.value.opacity = null;

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

                    if (Array.isArray(dataType) && dataType[0] == "buffer")
                        value = asUint8Array(value);

                    testCases.push({
                        label: [
                            k,
                            test.type,
                            subtype.description,
                            "description" in testValue ? testValue.description : ""
                        ].filter(Boolean).join("/"),
                        dataType,
                        value,
                        buffer: asUint8Array(testValue.buffer).buffer,
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

                if (typeof dataType == "string" && dataType == "buffer")
                    value = asUint8Array(value);

                testCases.push({
                    label: [
                        k,
                        test.type,
                        testValue.description,
                    ].filter(Boolean).join("/"),
                    dataType,
                    value,
                    buffer: asUint8Array(testValue.buffer).buffer,
                })
            }
        }
    }
}

// Generate test code
const generateTestCode = () => {
    const lines: string[] = [];

    lines.push(`import { test } from "vitest";`);
    lines.push(`import { roundtrip } from "./utils.js";`);
    lines.push(`import { fillProtocolVariables } from "../src/compat/fillProtocolVariables.js";`);
    lines.push(`import { Protocol } from "../src/proto/Protocol.js";`);
    lines.push(``);

    for (const { label, dataType, value, buffer, vars } of testCases) {
        const testName = label.replace(/"/g, '\\"');
        
        lines.push(`test("${testName}", ({ annotate }) => {`);
        lines.push(`    const dataTypeName = "test";`);
        lines.push(``);
        lines.push(`    const proto = new Protocol({`);
        lines.push(`        types: fillProtocolVariables({`);
        lines.push(`            types: {`);
        lines.push(`                [dataTypeName]: ${JSON.stringify(dataType)},`);
        lines.push(`            },`);
        lines.push(`        }, ${JSON.stringify(vars ?? {})}).types as any,`);
        lines.push(`    });`);
        lines.push(``);
        lines.push(`    roundtrip({`);
        lines.push(`        proto,`);
        lines.push(`        type: dataTypeName,`);
        lines.push(`        packet: ${JSON.stringify(value)},`);
        lines.push(`        expectBuffer: new Uint8Array([${Array.from(new Uint8Array(buffer)).join(", ")}]),`);
        lines.push(`        annotate,`);
        lines.push(`    });`);
        lines.push(`});`);
        lines.push(``);
    }

    return lines.join("\n");
};

const outputPath = path.join(__dirname, "../protodef.test.generated.ts");
const generatedCode = generateTestCode();

fs.writeFileSync(outputPath, generatedCode, "utf-8");
console.log(`✓ Generated ${testCases.length} tests to ${outputPath}`);
