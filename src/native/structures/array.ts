import type { Codec } from "../../proto/codec.js";
import type { DataTypeImplementation } from "../../proto/datatype.js";

export type ArrayArgs = ProtoDef.ICountable & { type: ProtoDef.DataType };

declare global {
	namespace ProtoDef {
		interface IntrinsicDataTypes {
			array: ["array", ArrayArgs];
		}
	}
}

export const array: DataTypeImplementation<any[], ArrayArgs> & Codec<ArrayArgs> = {
	read: (ctx) => {
		ctx.value = [];

		const count = ("count" in ctx.args) ? (typeof ctx.args.count == "number" ? ctx.args.count : ctx.getValue<number | bigint>(ctx.args.count)) : ctx.read<number | bigint>(ctx.args.countType);
		for (let i = 0; i < count; i++) {
			ctx.value[i] = ctx.read(ctx.args.type, i);
		}
	},

	write: (ctx, value) => {
		if ("countType" in ctx.args && !!ctx.args.countType) ctx.write(ctx.args.countType, value.length);
		for (let i = 0; i < value.length; i++) {
			const element = value[i];
			ctx.write(ctx.args.type, element, i);
		}
	},

	size: (ctx, value) => {
		let size = 0;
		if ("countType" in ctx.args && !!ctx.args.countType) size += ctx.size(ctx.args.countType, value.length);
		for (let i = 0; i < value.length; i++) {
			const element = value[i];
			size += ctx.size(ctx.args.type, element, i);
		}
		return size;
	},

	getChildDataTypes: (args) => [
		...("countType" in args ? [args.countType] : []),
		args.type,
	],

	decoder(writer, {
		withTempVar,
		options,
		resolveRelativePath,
		invokeDataType,
		withNewPacket,
		getPacket,
	}) {
		withTempVar("count", (count) => {
			if ("count" in options && typeof options.count == "number")
				writer.writeLine(`let ${count} = ${options.count}`);
			else if ("count" in options && typeof options.count == "string")
				writer.writeLine(`let ${count} = ${resolveRelativePath(options.count)}`);
			else if ("countType" in options) {
				writer.writeLine(`let ${count}`);
				withNewPacket(count, () => {
					invokeDataType(options.countType);
				});
			}

			const arr = getPacket();
			writer.writeLine(`${arr} = []`);

			withTempVar("i", (i) => {
				writer.write(`for (let ${i} = 0; ${i} < ${count}; ${i}++) `).inlineBlock(() => {
					withNewPacket(`${arr}[${i}]`, () => {
						invokeDataType(options.type);
					});
				});
			});
		});
	},

	encoder(writer, {
		withTempVar,
		options,
		invokeDataType,
		withNewPacket,
		getPacket,
	}) {
		const arr = getPacket();

		if ("countType" in options && !!options.countType) {
			withNewPacket(`${arr}.length`, () => invokeDataType(options.countType));
		}

		withTempVar("i", (i) => {
			writer.write(`for (let ${i} = 0; ${i} < ${arr}.length; ${i}++) `).inlineBlock(() => {
				withNewPacket(`${arr}[${i}]`, () => {
					invokeDataType(options.type);
				});
			});
		});
	},
};
