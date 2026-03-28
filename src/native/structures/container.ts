import type { Codec } from "../../proto/codec.js";

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

export const container: Codec<ContainerArgs> = {
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

	encodedSize(writer, { options, invokeDataType, getPacket, withNewPacket }) {
		for (const field of options) {
			withNewPacket(field.anon ? getPacket() : `${getPacket()}[${JSON.stringify(field.name)}]`, () => {
				invokeDataType(field.type);
			});
		}
	},
};
