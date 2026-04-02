import type { Codec } from "../../codec.js";

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
		resolveRelativePathCode,
		invokeDataType,
		withNewPacket,
		buffer,
		offset,
		getPacket,
		textDecoder,
		requestBytes,
	}) => {
		withTempVar("length", (length) => {
			if ("count" in options && typeof options.count == "number")
				writer.writeLine(`let ${length} = ${options.count}`);
			else if ("count" in options && typeof options.count == "string")
				writer.writeLine(`let ${length} = ${resolveRelativePathCode(options.count)}`);
			else if ("countType" in options) {
				writer.writeLine(`let ${length}`);
				withNewPacket(length, () => {
					invokeDataType(options.countType);
				});
			}

			requestBytes(length);

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
		textByteLength,
	}) => {
		withTempVar("byteLength", (byteLength) => {
			writer.writeLine(`let ${byteLength} = ${textByteLength}(${getPacket()})`);

			if ("countType" in options && !!options.countType) {
				withNewPacket(byteLength, () => {
					invokeDataType(options.countType);
				});
			}

			writer
				.writeLine(`${textEncoder}.encodeInto(${getPacket()}, ${buffer}.subarray(${offset}, ${offset} + ${byteLength}))`)
				.writeLine(`${offset} += ${byteLength}`);
		});
	},

	getIR: () => ({
		kind: "identifier",
		identifier: "string",
	}),
};
