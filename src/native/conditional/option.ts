import type { Codec } from "../../proto/codec.js";

type Option = ["option", ProtoDef.DataType];

declare global {
	namespace ProtoDef {
		interface IntrinsicDataTypes {
			option: Option;
		}
	}
}

export const option: & Codec<ProtoDef.DataType> = {
	decoder: (writer, { buffer, offset, getPacket, invokeDataType, options }) => {
		writer.write(`if (${buffer}[${offset}++]) `).inlineBlock(() => {
			invokeDataType(options);
		}).write(` else ${getPacket()} = null`);
	},

	encoder: (writer, { getPacket, buffer, offset, invokeDataType, options }) => {
		writer.write(`if (${getPacket()} == null) `).inlineBlock(() => {
			writer.writeLine(`${buffer}[${offset}++] = 0`);
		}).write(" else ").inlineBlock(() => {
			writer.writeLine(`${buffer}[${offset}++] = 1`);
			invokeDataType(options);
		});
	},

	encodedSize: (writer, { getPacket, size, options, invokeDataType }) => {
		writer.writeLine(`${size}++`);

		writer.write(`if (${getPacket()} != null) `).inlineBlock(() => {
			invokeDataType(options);
		});
	},
};
