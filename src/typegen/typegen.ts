import { ProtocolRegistry } from "../protocol/ProtocolRegistry.js";
import { ProtocolGenerator } from "../protocol/ProtocolGenerator.js";

export const typegen = (reg: ProtocolGenerator | ProtocolRegistry, targetTypeId: string) => {
	if (reg instanceof ProtocolGenerator) {
		return reg.generateTypeDefinition(targetTypeId);
	}
	const gen = new ProtocolGenerator(reg);
	return gen.generateTypeDefinition(targetTypeId);
};

