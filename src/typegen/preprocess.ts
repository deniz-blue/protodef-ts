import CodeBlockWriter from "code-block-writer";
import type { PathSegment, PreprocessTypeGenContext } from "../codec.js";
import { ProtocolGenerator } from "../protocol/ProtocolGenerator.js";
import { ir } from "./ir.js";
import type { SwitchArgs } from "../codecs/conditional/switch.js";
import type { ProtocolRegistry } from "../protocol/ProtocolRegistry.js";
import { resolveSchemaFromPath, findSchemasWithPath, mutateSchema } from "./schemaUtils.js";

export const __constant__: import("../codec.js").Codec<any> = {
	decoder() { throw new Error("__constant__ cannot be decoded"); },
	encoder() { throw new Error("__constant__ cannot be encoded"); },
	encodedSize() { throw new Error("__constant__ has no size"); },
	getIR: ({ options }) => ir.identifier(options),
};

type DiscriminatorLiteral = string;

const createDiscriminatorReplacement = (
	literal: DiscriminatorLiteral,
	discriminatorDataType: ProtoDef.DataType
): ProtoDef.DataType => {
	let code = JSON.stringify(literal);

	if (discriminatorDataType === "bool") {
		code = literal === "true" ? "true" : "false";
	} else if (typeof discriminatorDataType === "string" && /l?(u|i)(8|16|32|64)/.test(discriminatorDataType)) {
		code = literal;
	}

	return ["__constant__", literal];
};

const createDefaultCaseReplacement = (
	discriminatorDataType: ProtoDef.DataType,
	coveredCases: Set<string>
): ProtoDef.DataType => {
	if (discriminatorDataType === "bool") {
		if (coveredCases.has("true") && !coveredCases.has("false")) {
			return ["__constant__", "(false | undefined | null)"];
		} else if (!coveredCases.has("true") && coveredCases.has("false")) {
			return ["__constant__", "true"];
		} else {
			return ["__constant__", "boolean"];
		}
	}

	return ["__constant__", "any"];
};

const buildSwitchReplacements = (
	schema: ProtoDef.DataType,
	discriminatorPath: PathSegment[],
	discriminatorDataType: ProtoDef.DataType,
	cases: Record<string, ProtoDef.DataType>,
	defaultCase?: ProtoDef.DataType
): Array<[ProtoDef.DataType, ProtoDef.DataType]> => {
	const replacements: Array<[ProtoDef.DataType, ProtoDef.DataType]> = Object.entries(cases).map(([caseKey, caseType]) => [
		createDiscriminatorReplacement(caseKey, discriminatorDataType),
		caseType,
	]);

	if (defaultCase) {
		const coveredCases = new Set(Object.keys(cases));
		const defaultReplacement = createDefaultCaseReplacement(discriminatorDataType, coveredCases);
		replacements.push([defaultReplacement, defaultCase]);
	}

	return replacements;
};

const forkSchemas = (
	baseSchemas: ProtoDef.DataType[],
	registry: ProtocolRegistry,
	discriminatorPath: PathSegment[],
	switchPath: PathSegment[],
	cases: Record<string, ProtoDef.DataType>,
	defaultCase?: ProtoDef.DataType
): ProtoDef.DataType[] => {
	const validSchemas = findSchemasWithPath(baseSchemas, discriminatorPath);
	const remainingSchemas = baseSchemas.filter(s => !validSchemas.includes(s));

	let forkedSchemas: ProtoDef.DataType[] = [];

	for (const schema of validSchemas) {
		const discriminatorResolution = resolveSchemaFromPath(schema, discriminatorPath)!;
		const discriminatorDataType = discriminatorResolution.target;

		const replacements = buildSwitchReplacements(schema, discriminatorPath, discriminatorDataType, cases, defaultCase);

		for (const [discriminatorReplacement, switchReplacement] of replacements) {
			const newSchema = structuredClone(schema);

			mutateSchema(newSchema, discriminatorPath, discriminatorReplacement);
			mutateSchema(newSchema, switchPath, switchReplacement);

			forkedSchemas.push(...preprocess(registry, newSchema));
		}
	}

	return [...remainingSchemas, ...forkedSchemas];
};

export const preprocess = (
	registry: ProtocolRegistry,
	originType: ProtoDef.DataType
): ProtoDef.DataType[] => {
	const gen = new ProtocolGenerator(registry);
	gen.natives["__constant__"] = __constant__;
	gen.types["__constant__"] = "native";

	let schemas: ProtoDef.DataType[] = [originType];

	const handleSwitch = (ctx: PreprocessTypeGenContext<unknown>) => {
		const options = ctx.options as SwitchArgs;
		const discriminatorPath = ctx.resolveRelativePath(options.compareTo);
		schemas = forkSchemas(schemas, registry, discriminatorPath, ctx.getPath(), options.fields, options.default);
	};

	const factory = gen.createContextFactory<PreprocessTypeGenContext<unknown>>(
		new CodeBlockWriter(),
		{ schemas },
		(codec, ctx, id) => {
			if (id === "switch") {
				handleSwitch(ctx);
			} else {
				codec.preprocessTypeGen?.(ctx);
			}
		},
		"__root__"
	);

	factory(null).invokeDataType(originType);

	return schemas;
};
