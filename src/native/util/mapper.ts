import type { Codec } from "../../proto/codec.js";
import type { DataTypeImplementation } from "../../proto/datatype.js";

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

export const mapper: DataTypeImplementation<any, MapperArgs> & Codec<MapperArgs> = {
	read: (ctx) => {
		let source = String(ctx.read(ctx.args.type));
		let value = ctx.args.mappings[source];

		if (!value) throw `Value '${source}' is not mapped to anything, can't read`;
		ctx.value = value;
	},

	write: (ctx, value) => {
		let mapped = Object.entries(ctx.args.mappings)
			.find(([k, v]) => v == value)
			?.[0];

		if (!mapped) throw `Value '${value}' is not mapped to anything, can't write`;

		ctx.write(ctx.args.type, mapped);
	},

	size: (ctx, value) => ctx.size(ctx.args.type, value),

	getChildDataTypes: (args) => [args.type],

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
};
