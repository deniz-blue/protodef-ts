import type { Codec } from "../codec.js";

declare global {
	namespace ProtoDef {
		interface IntrinsicDataTypes {
			bool: "bool";
			cstring: "cstring";
			void: "void";
		}
	}
}

export const Void: Codec = {
	encodedSize: () => { },

	decoder: (writer, { getPacket }) => {
		writer.writeLine(`${getPacket()} = null`);
	},

	encoder: (writer, { getPacket }) => {
		writer.writeLine(`// noop: ${getPacket()} == void`);
	},
};

export const bool: Codec = {
	encodedSize: (writer, { size }) => void writer.writeLine(`${size}++`),

	decoder: (writer, { getPacket, offset, buffer, requestBytes }) => {
		requestBytes(1);
		writer.writeLine(`${getPacket()} = Boolean(${buffer}[${offset}++])`);
	},

	encoder: (writer, { getPacket, buffer, offset }) => {
		writer.writeLine(`${buffer}[${offset}++] = +${getPacket()}`);
	},
};

export const cstring: Codec = {
	decoder: (writer, { getPacket, buffer, offset, textDecoder, withTempVar, requestBytes }) => {
		withTempVar("size", (size) => {
			writer
				.writeLine(`let ${size} = 0;`)
				.writeLine(`while (true) `).inlineBlock(() => {
					requestBytes(1);
					writer
						.writeLine(`if (${buffer}[${offset} + ${size}] === 0x00) break;`)
						.writeLine(`${size}++;`)
				})
				.writeLine(`${getPacket()} = ${textDecoder}.decode(${buffer}.subarray(${offset}, ${offset} + ${size}));`)
				.writeLine(`${offset} += ${size} + 1;`);
		});
	},

	encoder: (writer, { getPacket, offset, buffer, textEncoder, withTempVar }) => {
		withTempVar("encodedTextBuffer", (encodedTextBuffer) => {
			writer
				.writeLine(`const ${encodedTextBuffer} = ${textEncoder}.encode(${getPacket()})`)
				.writeLine(`${buffer}.set(${encodedTextBuffer}, ${offset})`)
				.writeLine(`${offset} += ${encodedTextBuffer}.byteLength`)
				.writeLine(`${buffer}[${offset}++] = 0x00`)
		});
	},

	encodedSize(writer, { size, textByteLength, getPacket }) {
		writer.writeLine(`${size} += ${textByteLength}(${getPacket()})`);
		writer.writeLine(`${size}++`);
	},
};
