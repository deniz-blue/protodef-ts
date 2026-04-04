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

		if (!(id in registry.types)) throw new Error(`Unknown data type: ${id}`);

		const typeDef = registry.types[id]!;

		if (typeDef === "native") {
			const irNode = registry.natives[id]?.getIR?.(context);
			if (!irNode) throw new Error(`No IR found for native type: ${id}`);
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
	const schemas = preprocess(reg, reg.types[targetTypeId]!);
	const buildIR = createIRBuilder(reg);
	return buildUnionFromSchemas(schemas, buildIR);
};
