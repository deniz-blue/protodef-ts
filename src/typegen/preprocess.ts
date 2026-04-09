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

const stableStringify = (value: unknown): string => {
	if (value === null || typeof value !== "object") return JSON.stringify(value);
	if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;

	const obj = value as Record<string, unknown>;
	const keys = Object.keys(obj).sort();
	return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
};

const dedupeSchemas = (schemas: ProtoDef.DataType[]): ProtoDef.DataType[] => {
	const seen = new Set<string>();
	const unique: ProtoDef.DataType[] = [];

	for (const schema of schemas) {
		const key = stableStringify(schema);
		if (seen.has(key)) continue;
		seen.add(key);
		unique.push(schema);
	}

	return unique;
};

type DiscriminatorLiteral = string;

interface ExcludedDiscriminator {
	base: "number" | "string";
	excluded: Set<string>;
}

const parseExcludedDiscriminator = (literal: string): ExcludedDiscriminator | null => {
	const match = literal.match(/^Exclude<\s*(number|string)\s*,\s*(.+)\s*>$/);
	if (!match) return null;

	const base = match[1] as "number" | "string";
	const excludedRaw = match[2] ?? "";
	const excluded = new Set(
		excludedRaw
			.split("|")
			.map(v => v.trim())
			.filter(Boolean)
	);

	return { base, excluded };
};

const formatExcludedDiscriminator = ({ base, excluded }: ExcludedDiscriminator): string => {
	const values = [...excluded].sort();
	if (values.length === 0) return base;
	return `Exclude<${base}, ${values.join(" | ")}>`;
};

const inferDiscriminatorBaseType = (
	discriminatorDataType: ProtoDef.DataType
): "number" | "string" | null => {
	if (typeof discriminatorDataType !== "string") return null;
	if (/l?(u|i)(8|16|32|64)|varint|f32|f64/.test(discriminatorDataType)) return "number";
	if (/string/.test(discriminatorDataType)) return "string";
	return null;
};

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

	if (isConstantDiscriminatorType(discriminatorDataType)) {
		const literal = discriminatorDataType[1];
		const parsed = parseExcludedDiscriminator(literal);
		if (parsed) {
			const merged = new Set([...parsed.excluded, ...coveredCases]);
			return ["__constant__", formatExcludedDiscriminator({ ...parsed, excluded: merged })];
		}
	}

	const base = inferDiscriminatorBaseType(discriminatorDataType);
	if (base) {
		return ["__constant__", formatExcludedDiscriminator({ base, excluded: coveredCases })];
	}

	return ["__constant__", "any"];
};

const isConstantDiscriminatorType = (
	discriminatorDataType: ProtoDef.DataType
): discriminatorDataType is ["__constant__", string] => {
	return Array.isArray(discriminatorDataType)
		&& discriminatorDataType[0] === "__constant__"
		&& typeof discriminatorDataType[1] === "string";
};

const isBroadDiscriminatorLiteral = (literal: string): boolean => {
	return literal === "any" || literal === "boolean" || literal.includes("|");
};

const buildSwitchReplacements = (
	_schema: ProtoDef.DataType,
	_discriminatorPath: PathSegment[],
	discriminatorDataType: ProtoDef.DataType,
	cases: Record<string, ProtoDef.DataType>,
	defaultCase?: ProtoDef.DataType
): Array<[ProtoDef.DataType, ProtoDef.DataType]> => {
	if (isConstantDiscriminatorType(discriminatorDataType)) {
		const literal = discriminatorDataType[1];
		const parsed = parseExcludedDiscriminator(literal);

		if (parsed) {
			const replacements: Array<[ProtoDef.DataType, ProtoDef.DataType]> = [];

			for (const [caseKey, caseType] of Object.entries(cases)) {
				if (parsed.excluded.has(caseKey)) continue;
				replacements.push([createDiscriminatorReplacement(caseKey, discriminatorDataType), caseType]);
			}

			if (defaultCase) {
				const coveredCases = new Set(Object.keys(cases));
				replacements.push([createDefaultCaseReplacement(discriminatorDataType, coveredCases), defaultCase]);
			}

			return replacements;
		}

		if (!isBroadDiscriminatorLiteral(literal)) {
			if (literal in cases) {
				return [[discriminatorDataType, cases[literal]!]];
			}

			if (defaultCase) {
				return [[discriminatorDataType, defaultCase]];
			}

			return [];
		}
	}

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
		const discriminatorResolution = resolveSchemaFromPath(schema, discriminatorPath);
		if (!discriminatorResolution) {
			console.error("[typegen/preprocess] Failed to resolve discriminator path", {
				discriminatorPath: discriminatorPath.map(s => s.value).join("."),
				schema,
			});
			continue;
		}
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
		schemas = dedupeSchemas(
			forkSchemas(schemas, registry, discriminatorPath, ctx.getPath(), options.fields, options.default)
		);
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

	return dedupeSchemas(schemas);
};
