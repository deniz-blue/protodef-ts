import type { PathSegment } from "../codec.js";
import type { ContainerArgs } from "../codecs/structures/container.js";
import type { ArrayArgs } from "../codecs/structures/array.js";

export interface SchemaResolution {
	target: ProtoDef.DataType;
	parentObject: any;
	field: string | number;
}

export const resolveSchemaFromPath = (
	schema: ProtoDef.DataType,
	absolutePath: PathSegment[],
): SchemaResolution | null => {
	let current = schema;

	for (let i = 0; i < absolutePath.length; i++) {
		const segment = absolutePath[i]!;
		const isLast = i === absolutePath.length - 1;
		
		if (segment.value === "__root__") continue;
		
		const [id, options] = Array.isArray(current) ? current : [current, null];

		switch (id) {
			case "container": {
				const field = (options as ContainerArgs).find((f: any) => f.name === segment.value);
				if (!field) return null;
				current = field.type;
				if (isLast) return { target: current, parentObject: field, field: "type" };
				break;
			}
			case "array": {
				if (segment.type !== "array") return null;
				current = (options as ArrayArgs).type;
				if (isLast) return { target: current, parentObject: current[1], field: "type" };
				break;
			}
			default:
				return null;
		}
	}

	throw new Error(`Path ${absolutePath.map(s => s.value).join(".")} does not exist in schema`);
};

export const mutateSchema = (
	schema: ProtoDef.DataType,
	path: PathSegment[],
	replacement: ProtoDef.DataType
): void => {
	const resolution = resolveSchemaFromPath(schema, path);
	if (!resolution) throw new Error(`Cannot mutate schema at path ${path.map(s => s.value).join(".")}: path not found`);
	
	resolution.parentObject[resolution.field] = replacement;
};

export const findSchemasWithPath = (
	schemas: ProtoDef.DataType[],
	path: PathSegment[]
): ProtoDef.DataType[] => {
	return schemas.filter(s => resolveSchemaFromPath(s, path) !== null);
};
