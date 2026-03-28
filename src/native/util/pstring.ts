import type { Codec } from "../../proto/codec.js";

export type PStringArgs = ProtoDef.ICountable & { encoding?: string };

declare global {
	namespace ProtoDef {
		interface IntrinsicDataTypes {
			pstring: ["pstring", PStringArgs];
		}
	}
}

export const pstring: Codec<PStringArgs> = {
	encodedSize: (writer, { options, invokeDataType, textByteLength, getPacket }) => {
		if ("countType" in options && !!options.countType) invokeDataType(options.countType);
		writer.writeLine(`size += ${textByteLength}(${getPacket()}${options.encoding ? `, ${JSON.stringify(options.encoding)}` : ""})`);
	},

	decoder: (writer, {
		withTempVar,
		options,
		resolveRelativePath,
		invokeDataType,
		withNewPacket,
		buffer,
		offset,
		getPacket,
		textDecoder,
	}) => {
		withTempVar("length", (length) => {
			if ("count" in options && typeof options.count == "number")
				writer.writeLine(`let ${length} = ${options.count}`);
			else if ("count" in options && typeof options.count == "string")
				writer.writeLine(`let ${length} = ${resolveRelativePath(options.count)}`);
			else if ("countType" in options) {
				withNewPacket(length, () => {
					invokeDataType(options.countType);
				});
			}

			withTempVar("textBuffer", (textBuffer) => {
				writer
					.writeLine(`let ${textBuffer} = ${length} > 0 ? ${buffer}.subarray(${offset}, ${offset} + ${length}) : new Uint8Array(0)`)
					.writeLine(`${getPacket()} = ${textDecoder}.decode(${textBuffer})`)
					.writeLine(`${offset} += ${length}`);
			});
		});
	},

	encoder: (writer, {
		options,
		withTempVar,
		withNewPacket,
		invokeDataType,
		buffer,
		offset,
		getPacket,
		textEncoder,
	}) => {
		withTempVar("encodedTextBuffer", (encodedTextBuffer) => {
			writer.writeLine(`let ${encodedTextBuffer} = ${textEncoder}.encode(${getPacket()})`);

			const length = `${encodedTextBuffer}.byteLength`;

			if ("countType" in options && !!options.countType) {
				withNewPacket(length, () => {
					invokeDataType(options.countType);
				});
			}

			writer
				.writeLine(`${buffer}.set(${encodedTextBuffer}, ${offset})`)
				.writeLine(`${offset} += ${length}`);
		});
	},
};
