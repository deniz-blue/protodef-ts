import type { Codec } from "../../proto/codec.js";
import type { DataTypeImplementation } from "../../proto/datatype.js";
import { textByteLength } from "../../utils/string.js";

export type PStringArgs = ProtoDef.ICountable & { encoding?: string };

declare global {
	namespace ProtoDef {
		interface IntrinsicDataTypes {
			pstring: ["pstring", PStringArgs];
		}
	}
}

export const pstring: DataTypeImplementation<string, PStringArgs> & Codec<PStringArgs> = {
	read: (ctx) => {
		const length = ("count" in ctx.args) ? (typeof ctx.args.count == "number" ? ctx.args.count : ctx.getValue<number>(ctx.args.count)) : ctx.read<number>(ctx.args.countType);
		const buf = ctx.io.buffer.subarray(ctx.io.offset, ctx.io.offset + length);
		ctx.value = ctx.io.decodeText(buf);
		ctx.io.offset += length;
	},

	write: (ctx, value) => {
		const buf = ctx.io.encodeText(value);
		if ("countType" in ctx.args && !!ctx.args.countType) ctx.write(ctx.args.countType, buf.byteLength);
		ctx.io.buffer.set(buf, ctx.io.offset);
		ctx.io.offset += buf.byteLength;
	},

	size: (ctx, value) => {
		let size = 0;
		if ("countType" in ctx.args && !!ctx.args.countType) size += ctx.size(ctx.args.countType, value.length);
		size += textByteLength(value);
		return size;
	},

	getChildDataTypes: (args) => "countType" in args ? [args.countType] : [],

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
