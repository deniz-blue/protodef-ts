import CodeBlockWriter from "code-block-writer";
import type { Codec, PathSegment, PreprocessTypeGenContext } from "../codec.js";
import { ProtocolGenerator } from "../protocol/ProtocolGenerator.js";
import { ir } from "./ir.js";
import type { SwitchArgs } from "../codecs/conditional/switch.js";
import type { ContainerArgs } from "../codecs/structures/container.js";
import type { ArrayArgs } from "../codecs/structures/array.js";
import type { ProtocolRegistry } from "../protocol/ProtocolRegistry.js";

// ["__constant__", string]
export const __constant__: Codec<any> = {
	decoder() { throw new Error("__constant__ cannot be decoded"); },
	encoder() { throw new Error("__constant__ cannot be encoded"); },
	encodedSize() { throw new Error("__constant__ has no size"); },
	getIR: ({ options }) => ir.identifier(options),
};

const root = "__root__";

const resolveSchemaFromPath = (
	schema: ProtoDef.DataType,
	absolutePath: PathSegment[],
): { target: ProtoDef.DataType; parentObject: any; field: (string | number) } | null => {
	let current = schema;

	for (let i = 0; i < absolutePath.length; i++) {
		const segment = absolutePath[i]!;
		const isLast = i === absolutePath.length - 1;
		if (segment.value === root) continue;
		const [id, options] = Array.isArray(current) ? current : [current, null];
		switch (id) {
			case "container": {
				const field = (options as ContainerArgs).find((f: any) => f.name === segment.value);
				if (!field) return console.log(`Field ${segment.value} not found in container during path resolution`), null;
				current = field.type;
				if (isLast) return { target: current, parentObject: field, field: "type" };
				break;
			}
			case "array": {
				if (segment.type !== "array") return console.log(`Segment ${segment.value} is not an array during path resolution`), null;
				current = (options as ArrayArgs).type;
				if (isLast) return { target: current, parentObject: current[1], field: "type" };
				break;
			}
			default: {
				console.log("Unsupported data type in path resolution:", id);
				return null;
			}
		}
	}

	throw new Error(`Path ${absolutePath.map(s => s.value).join(".")} does not exist in schema`);
};

export const preprocess = (registry: ProtocolRegistry, originType: ProtoDef.DataType) => {
	const gen = new ProtocolGenerator(registry);
	gen.natives["__constant__"] = __constant__;
	gen.types["__constant__"] = "native";
	const root = "__root__";

	let schemas: ProtoDef.DataType[] = [
		originType,
	];

	const fork = (
		discriminatorAbsolutePath: PathSegment[],
		switchAbsolutePath: PathSegment[],
		cases: Record<string, ProtoDef.DataType>,
		defaultCase?: ProtoDef.DataType,
	) => {
		const schemasWherePathExists = schemas.filter(s => resolveSchemaFromPath(s, discriminatorAbsolutePath) !== null);
		schemas = schemas.filter(s => !schemasWherePathExists.includes(s));

		const discriminatorReplacementDataType = (literal: string, discriminatorDataType: ProtoDef.DataType): ProtoDef.DataType => {
			let code = JSON.stringify(literal);

			if (discriminatorDataType === "bool") {
				code = literal === "true" ? "true" : "false";
			} else if (typeof discriminatorDataType === "string" && /l?(u|i)(8|16|32|64)/.test(discriminatorDataType)) {
				code = literal;
			}

			return ["__constant__", literal];
		};

		for (const schema of schemasWherePathExists) {
			const discriminatorDataType = resolveSchemaFromPath(schema, discriminatorAbsolutePath)!.target;

			const replacements = Object.entries(cases).map(([k, v]) => ([
				discriminatorReplacementDataType(k, discriminatorDataType),
				v,
			]));

			if (defaultCase) {
				const coveredCases = new Set(Object.keys(cases));
				let lit = "any";
				
				if (discriminatorDataType === "bool") {
					if (coveredCases.has("true") && !coveredCases.has("false")) {
						lit = "(false | undefined | null)";
					} else if (!coveredCases.has("true") && coveredCases.has("false")) {
						lit = "true";
					} else {
						lit = "boolean";
					}
				}

				replacements.push([["__constant__", lit], defaultCase]);
			}

			for (const [discriminatorReplacement, switchReplacement] of replacements) {
				const newSchema = structuredClone(schema);
				const discriminator = resolveSchemaFromPath(newSchema, discriminatorAbsolutePath)!;
				const switchPoint = resolveSchemaFromPath(newSchema, switchAbsolutePath)!;

				discriminator.parentObject[discriminator.field] = discriminatorReplacement;
				switchPoint.parentObject[switchPoint.field] = switchReplacement;

				schemas.push(...preprocess(registry, newSchema));
			}
		}
	};

	const factory = gen.createContextFactory<PreprocessTypeGenContext<unknown>>(
		new CodeBlockWriter(),
		{
			schemas,
		},
		(codec, ctx, id) => {
			if (id === "switch") {
				const options = ctx.options as SwitchArgs;
				const abs = ctx.resolveRelativePath(options.compareTo);
				fork(abs, ctx.getPath(), options.fields, options.default);
			} else {
				codec.preprocessTypeGen?.(ctx);
			}
		},
		root,
	);

	factory(null).invokeDataType(originType);

	return schemas;
};
