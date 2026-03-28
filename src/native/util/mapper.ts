import type { Codec } from "../../proto/codec.js";

export type MapperArgs = {
	type: ProtoDef.DataType;
	mappings: Record<string, any>;
};

declare global {
	namespace ProtoDef {
		interface IntrinsicDataTypes {
			mapper: ["mapper", MapperArgs];
		}
	}
}

export const mapper: Codec<MapperArgs> = {

	encoder(writer, {
		options,
		invokeDataType,
		withTempVar,
		getPacket,
	}) {
		withTempVar("map", (map) => {
			writer.writeLine(`let ${map} = ${JSON.stringify(options.mappings, null, 2)}`);
			invokeDataType(options.type);
			writer.writeLine(`${getPacket()} = ${map}[${getPacket()}]`);
		});
	},

	decoder(writer, {
		options,
		invokeDataType,
		withTempVar,
		getPacket,
	}) {
		invokeDataType(options.type);
		withTempVar("map", (map) => {
			const inverse = Object.fromEntries(Object.entries(options.mappings).map(([k, v]) => [v, k]));
			writer.writeLine(`let ${map} = ${JSON.stringify(inverse, null, 2)}`);
			writer.writeLine(`${getPacket()} = ${map}[${getPacket()}]`);
		});
	},

	encodedSize(writer, { options, invokeDataType }) {
		invokeDataType(options.type);
	},
};
