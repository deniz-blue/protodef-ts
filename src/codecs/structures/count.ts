import type { Codec } from "../../codec.js";

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

export const count: Codec<CountArgs> = {
	decoder: (writer, { invokeDataType, options }) => {
		invokeDataType(options.type);
	},

	encoder: (writer, { withNewPacket, options, resolveRelativePathCode, invokeDataType }) => {
		withNewPacket(`${resolveRelativePathCode(options.countFor)}.length`, () => {
			invokeDataType(options.type);
		});
	},

	encodedSize: (writer, { options, invokeDataType }) => {
		invokeDataType(options.type);
	},
};
