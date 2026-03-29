import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fillProtocolVariables } from "../../src/compat/fillProtocolVariables.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import JSON test data
import conditional from "./conditional.json" with { type: "json" };
import numeric from "./numeric.json" with { type: "json" };
import structures from "./structures.json" with { type: "json" };
import utils from "./utils.json" with { type: "json" };

const asBigInt = (ty: ProtoDef.DataType, value: any) => {
	if (!Array.isArray(value)) return BigInt(value);
	const k = ty.includes("U") ? "asUintN" : "asIntN";
	return BigInt[k](64, BigInt(value[0]) << 32n) | BigInt[k](32, BigInt(value[1]))
};

const asUint8Array = (arr: string[]) => new Uint8Array(arr.map(x => parseInt(x.slice(2), 16)));


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

const testCases: TestCase[] = [];

// Fix opacity test case
// @ts-ignore
conditional[0].subtypes[1].values[0].value.opacity = null;

// Process test data
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
					let value: any = testValue.value;
					let dataType: any = subtype.type;

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
				let value: any = testValue.value;
				let dataType: any = test.type;

				if (typeof dataType == "string"
					&& ((k == "numeric" || k == "utils") && (
						dataType.endsWith("64")
						|| dataType.endsWith("128")
					) && (
							!dataType.startsWith("f")
							&& !dataType.startsWith("lf")
						))
				)
					value = asBigInt(dataType, value);

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

// Helper to safely convert value to serializable form
const serializeValue = (val: any): string => {
	if (val instanceof ArrayBuffer) {
		return `new ArrayBuffer(0)`;
	}
	if (val instanceof Uint8Array) {
		return `new Uint8Array([${Array.from(val).join(", ")}])`;
	}
	if (typeof val === 'bigint') {
		return `${val}n`;
	}
	if (typeof val === 'object' && val !== null) {
		if (Array.isArray(val)) {
			return `[${val.map(serializeValue).join(", ")}]`;
		}
		const entries = Object.entries(val).map(([k, v]: [string, any]): string =>
			`"${k}": ${serializeValue(v)}`
		);
		return `{${entries.join(", ")}}`;
	}
	return JSON.stringify(val);
};

// Generate test code
const generateTestCode = () => {
	const lines = [];

	lines.push(`import { test } from "vitest";`);
	lines.push(`import { roundtrip } from "./utils.js";`);
	lines.push(``);

	for (const { label, dataType, value, buffer, vars } of testCases) {
		const testName = label.replace(/"/g, '\\"');

		const fixed = fillProtocolVariables({
			types: {
				test: dataType,
			},
		}, vars).types!.test!;

		lines.push(`test("${testName}", ({ annotate }) => {`);
		lines.push(`    roundtrip({`);
		lines.push(`        types: {`);
		lines.push(`            test: ${JSON.stringify(fixed, null, 2)},`);
		lines.push(`        },`);
		lines.push(`        packet: ${serializeValue(value)},`);
		lines.push(`        expectBuffer: new Uint8Array([${Array.from(new Uint8Array(buffer)).join(", ")}]),`);
		lines.push(`        annotate,`);
		lines.push(`    });`);
		lines.push(`});`);
		lines.push(``);
	}

	return lines.join("\n");
};

const outputPath = path.join(__dirname, "../protodef.test.ts");
const generatedCode = generateTestCode();

fs.writeFileSync(outputPath, generatedCode, "utf-8");
console.log(`✓ Generated ${testCases.length} tests to ${outputPath}`);
