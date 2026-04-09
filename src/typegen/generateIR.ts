import type { GetIRContext } from "../codec.js";
import { ProtocolRegistry } from "../protocol/ProtocolRegistry.js";
import { __constant__, preprocess } from "./preprocess.js";
import { ir, type IRNode } from "./ir.js";

const setupRegistry = (baseRegistry: ProtocolRegistry): ProtocolRegistry => {
	const reg = new ProtocolRegistry(baseRegistry);
	reg.natives["__constant__"] = __constant__;
	reg.types["__constant__"] = "native";
	return reg;
};

const createIRBuilder = (registry: ProtocolRegistry) => {
	const buildIR = (type: ProtoDef.DataType): IRNode => {
		const [id, options] = typeof type === "string" ? [type, null] : type;
		const context = { options, getIR: buildIR } as GetIRContext<unknown>;

		if (!(id in registry.types)) {
			console.error("[typegen/generateIR] Unknown data type", {
				id,
				knownTypeCount: Object.keys(registry.types).length,
			});
			throw new Error(`Unknown data type: ${id}`);
		}

		const typeDef = registry.types[id];
		if (typeDef === undefined) {
			console.error("[typegen/generateIR] Type definition resolved to undefined", {
				id,
				options,
			});
			throw new Error(`Type definition is undefined for data type: ${id}`);
		}

		if (typeDef === "native") {
			const nativeCodec = registry.natives[id];
			if (!nativeCodec) {
				console.error("[typegen/generateIR] Native codec missing", {
					id,
					knownNativeCount: Object.keys(registry.natives).length,
				});
				throw new Error(`Native codec not found for data type: ${id}`);
			}

			const irNode = nativeCodec.getIR?.(context);
			if (!irNode) {
				console.error("[typegen/generateIR] Native codec has no getIR result", {
					id,
					hasGetIR: typeof nativeCodec.getIR === "function",
					options,
				});
				throw new Error(`No IR found for native type: ${id}`);
			}
			return irNode;
		}
		
		return buildIR(typeDef);
	};

	return buildIR;
};

const buildUnionFromSchemas = (schemas: ProtoDef.DataType[], buildIR: (type: ProtoDef.DataType) => IRNode): IRNode.Union => {
	const types = schemas.map(buildIR);
	return ir.union(types);
};

export const generateIR = (baseRegistry: ProtocolRegistry, targetTypeId: string) => {
	const reg = setupRegistry(baseRegistry);
	const targetType = reg.types[targetTypeId];
	if (targetType === undefined) {
		console.error("[typegen/generateIR] Target type is undefined", {
			targetTypeId,
			knownTypeCount: Object.keys(reg.types).length,
		});
		throw new Error(`Unknown target type for typegen: ${targetTypeId}`);
	}

	const schemas = preprocess(reg, targetType);
	const buildIR = createIRBuilder(reg);
	return buildUnionFromSchemas(schemas, buildIR);
};
