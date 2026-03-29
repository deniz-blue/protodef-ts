import type { Codec } from "../../codec.js";

export type BufferArgs = ProtoDef.ICountable & { rest?: boolean };

declare global {
	namespace ProtoDef {
		interface IntrinsicDataTypes {
			buffer: ["buffer", BufferArgs];
		}
	}
}

export const buffer: Codec<BufferArgs> = {
	decoder: (writer, {
		withTempVar,
		options,
		resolveRelativePath,
		invokeDataType,
		withNewPacket,
		getPacket,
		buffer,
		offset,
		requestBytes,
	}) => {
		withTempVar("length", (length) => {
			if ("count" in options && typeof options.count == "number")
				writer.writeLine(`let ${length} = ${options.count}`);
			else if ("count" in options && typeof options.count == "string")
				writer.writeLine(`let ${length} = ${resolveRelativePath(options.count)}`);
			else if ("countType" in options) {
				writer.writeLine(`let ${length}`);
				withNewPacket(length, () => {
					invokeDataType(options.countType);
				});
			}

			requestBytes(length);

			writer
				.writeLine(`${getPacket()} = ${buffer}.slice(${offset}, ${offset} + ${length})`)
				.writeLine(`${offset} += ${length}`);
		});
	},

	encoder: (writer, { options, getPacket, withNewPacket, invokeDataType, buffer, offset }) => {
		const length = `${getPacket()}.byteLength`;

		if ("countType" in options && !!options.countType) {
			withNewPacket(length, () => {
				invokeDataType(options.countType);
			});
		}

		writer
			.writeLine(`${buffer}.set(${getPacket()}, ${offset})`)
			.writeLine(`${offset} += ${length}`);
	},

	encodedSize(writer, { getPacket, invokeDataType, options, withNewPacket }) {
		const length = `${getPacket()}.byteLength`;

		if ("countType" in options && !!options.countType) {
			withNewPacket(length, () => {
				invokeDataType(options.countType);
			});
		}

		writer.writeLine(`size += ${length}`);
	},
};
