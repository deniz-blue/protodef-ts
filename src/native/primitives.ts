import type { Codec } from "../proto/codec.js";
import type { DataTypeImplementation } from "../proto/datatype.js";
import { textByteLength } from "../utils/string.js";

declare global {
	namespace ProtoDef {
		interface IntrinsicDataTypes {
			bool: "bool";
			cstring: "cstring";
			void: "void";
		}
	}
}

export const Void: DataTypeImplementation<null> & Codec = {
	read: (ctx) => ctx.value = null,
	write: () => { },
	size: () => 0,

	decoder: (writer, { getPacket }) => {
		writer.writeLine(`${getPacket()} = null`);
	},

	encoder: (writer, { getPacket }) => {
		writer.writeLine(`// noop: ${getPacket()} == void`);
	},
};

export const bool: DataTypeImplementation<boolean> & Codec = {
	read: (ctx) => ctx.value = !!ctx.io.view.getInt8(ctx.io.offset++),
	write: (ctx, value) => ctx.io.view.setInt8(ctx.io.offset++, +value),
	size: () => 1,

	decoder: (writer, { getPacket, offset, view }) => {
		writer.writeLine(`${getPacket()} = Boolean(${view}.getInt8(${offset}++))`);
	},

	encoder: (writer, { getPacket, view, offset }) => {
		writer.writeLine(`${view}.setInt8(${offset}++, +${getPacket()})`);
	},
};

export const cstring: DataTypeImplementation<string> & Codec = {
	read: (ctx) => {
		let size = 0;
		while (!ctx.io.buffer[ctx.io.offset + size]) size++;
		ctx.value = ctx.io.decodeText(ctx.io.buffer.slice(ctx.io.offset, ctx.io.offset + size));
		ctx.io.offset += size;
		ctx.io.offset += 1;
	},
	write: (ctx, value) => {
		const buf = ctx.io.encodeText(value);
		ctx.io.buffer.set(buf, ctx.io.offset);
		ctx.io.offset += buf.byteLength;
		ctx.io.buffer[ctx.io.offset++] = 0x00;
	},
	size: (ctx, value) => {
		return textByteLength(value) + 1;
	},

	decoder: (writer, { getPacket, buffer, offset, textDecoder, withTempVar }) => {
		withTempVar("size", (size) => {
			writer
				.writeLine(`let ${size} = 0`)
				.writeLine(`while (0x00 != ${buffer}[${offset} + ${size}]) ${size}++`)
				.writeLine(`${getPacket()} = ${textDecoder}.decode(${buffer}.slice(${offset}, ${offset} + ${size}))`)
				.writeLine(`${offset} += ${size} + 1`)
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
};
