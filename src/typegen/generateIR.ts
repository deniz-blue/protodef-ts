import type { GetIRContext } from "../codec.js";
import { ProtocolRegistry } from "../protocol/ProtocolRegistry.js";
import { __constant__, preprocess } from "./preprocess.js";
import { ir, type IRNode } from "./ir.js";

export const generateIR = (_reg: ProtocolRegistry, targetTypeId: string) => {
	const reg = new ProtocolRegistry(_reg);
	reg.natives["__constant__"] = __constant__;
	reg.types["__constant__"] = "native";
	const schemas = preprocess(reg, reg.types[targetTypeId]!);

	const getIR = (type: ProtoDef.DataType): IRNode => {
		const [id, options] = typeof type === "string" ? [type, null] : type;
		const newCtx = {
			options,
			getIR,
		} as GetIRContext<unknown>;

		if (!(id in reg.types)) throw new Error(`Unknown data type: ${id}`);

		const typeDef = reg.types[id]!;

		if (typeDef === "native") {
			const ir = reg.natives[id]?.getIR?.(newCtx);
			if (!ir) throw new Error(`No IR found for native type: ${id}`);
			return ir;
		} else return getIR(typeDef);
	};

	let rootIR: IRNode.Union | null = ir.union([]);
	for (const dataType of schemas) {
		const dataTypeIR = getIR(dataType);
		rootIR.types.push(dataTypeIR);
	}

	return rootIR;
};
