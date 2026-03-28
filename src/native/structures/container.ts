import type { Codec } from "../../proto/codec.js";
import type { DataTypeImplementation } from "../../proto/datatype.js";

export type ContainerField = {
	name: string;
	type: ProtoDef.DataType;
	anon?: boolean;
};

export type ContainerArgs = ContainerField[];

declare global {
	namespace ProtoDef {
		interface IntrinsicDataTypes {
			container: ["container", ContainerArgs];
		}
	}
}

export const container: DataTypeImplementation<{ [k: string]: any }, ContainerArgs> & Codec<ContainerArgs> = {
	read: (ctx) => {
		ctx.value = {};

		for (let field of ctx.args) {
			let read = ctx.read<object>(field.type, field.anon ? undefined : field.name);
			if (field.anon) {
				ctx.value = {
					...ctx.value,
					...read,
				};
			} else {
				ctx.value[field.name] = read;
			}
		}
	},

	write: (ctx, value) => {
		for (let field of ctx.args) {
			ctx.write(field.type, field.anon ? value : value[field.name], field.anon ? undefined : field.name);
		}
	},

	size: (ctx, value) => {
		let size = 0;
		for (let field of ctx.args) {
			size += ctx.size(field.type, field.anon ? value : value[field.name], field.anon ? undefined : field.name);
		}
		return size;
	},

	getChildDataTypes: (args) => args.map(x => x.type),

	decoder(writer, {
		getPacket,
		invokeDataType,
		withNewPacket,
		options,
	}) {
		writer.writeLine(`${getPacket()} = {}`);

		for (let field of options) {
			withNewPacket(field.anon ? getPacket() : `${getPacket()}[${JSON.stringify(field.name)}]`, () => {
				invokeDataType(field.type);
			});
		};
	},

	encoder(writer, {
		getPacket,
		invokeDataType,
		withNewPacket,
		options,
	}) {
		for (let field of options) {
			withNewPacket(field.anon ? getPacket() : `${getPacket()}[${JSON.stringify(field.name)}]`, () => {
				invokeDataType(field.type);
			});
		};
	},
};
