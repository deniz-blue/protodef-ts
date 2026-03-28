import type { Codec } from "../../proto/codec.js";
import type { DataTypeImplementation } from "../../proto/datatype.js";

export type BufferArgs = ProtoDef.ICountable & { rest?: boolean };

declare global {
	namespace ProtoDef {
		interface IntrinsicDataTypes {
			buffer: ["buffer", BufferArgs];
		}
	}
}

export const buffer: DataTypeImplementation<Uint8Array, BufferArgs> & Codec<BufferArgs> = {
	read: (ctx) => {
		const length = ("count" in ctx.args) ? (typeof ctx.args.count == "number" ? ctx.args.count : ctx.getValue<number>(ctx.args.count)) : ctx.read<number>(ctx.args.countType);
		ctx.value = ctx.io.buffer.slice(ctx.io.offset, ctx.io.offset + length);
		ctx.io.offset += length;
	},

	write: (ctx, value) => {
		if ("countType" in ctx.args && !!ctx.args.countType) ctx.write(ctx.args.countType, value.byteLength);
		// new Uint8Array(ctx.io.buffer.buffer, ctx.io.offset, value.byteLength).set(new Uint8Array(value));
		ctx.io.buffer.set(value, ctx.io.offset);
		ctx.io.offset += value.byteLength;
	},

	size: (ctx, value) => {
		if ("count" in ctx.args && typeof ctx.args.count == "number") return ctx.args.count;
		let size = 0;
		if ("countType" in ctx.args && !!ctx.args.countType) size += ctx.size(ctx.args.countType, value.byteLength);
		size += value.byteLength;
		return size;
	},

	getChildDataTypes: (args) => "countType" in args ? [args.countType] : [],

	decoder: (writer, { withTempVar, options, resolveRelativePath, invokeDataType, withNewPacket, getPacket, buffer, offset }) => {
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

			writer
				.writeLine(`${getPacket()} = ${buffer}.slice(${offset}, ${offset} + ${length})`)
				.writeLine(`${offset} += ${length}`);
		});
	},

	encoder: (writer, { options, getPacket, withNewPacket, invokeDataType, buffer, offset }) => {
		const length = `${getPacket()}.byteLength`;

		if("countType" in options) {
			withNewPacket(length, () => {
				invokeDataType(options.countType);
			});
		}
		
		writer
			.writeLine(`${buffer}.set(${getPacket()}, ${offset})`)
			.writeLine(`${offset} += ${length}`);
	},
};
