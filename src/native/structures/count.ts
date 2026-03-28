import type { Codec } from "../../proto/codec.js";

export type CountArgs = {
	type: ProtoDef.DataType;
	countFor: string;
};

declare global {
	namespace ProtoDef {
		interface IntrinsicDataTypes {
			count: ["count", CountArgs];
		}
	}
}

const getCount = (x: any) => {
    if(Array.isArray(x)) return x.length;
    throw `Cannot count '${x}'`;
};

export const count: Codec<CountArgs> = {
	decoder: (writer, { getPacket, invokeDataType, options }) => {
		invokeDataType(options.type);
	},

	encoder: (writer, { withNewPacket, options, resolveRelativePath, invokeDataType }) => {
		withNewPacket(`${resolveRelativePath(options.countFor)}.length`, () => {
			invokeDataType(options.type);
		});
	},

	encodedSize: (writer, { options, invokeDataType }) => {
		invokeDataType(options.type);
	},
};
