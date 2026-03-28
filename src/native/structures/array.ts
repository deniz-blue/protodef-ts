import type { Codec } from "../../proto/codec.js";

export type ArrayArgs = ProtoDef.ICountable & { type: ProtoDef.DataType };

declare global {
	namespace ProtoDef {
		interface IntrinsicDataTypes {
			array: ["array", ArrayArgs];
		}
	}
}

export const array: Codec<ArrayArgs> = {
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

	encodedSize(writer, { getPacket, options, withTempVar, withNewPacket, invokeDataType }) {
		if ("countType" in options && !!options.countType)
			invokeDataType(options.countType);

		withTempVar("i", (i) => {
			writer.write(`for (let ${i} = 0; ${i} < ${getPacket()}.length; ${i}++) `).inlineBlock(() => {
				withNewPacket(`${getPacket()}[${i}]`, () => {
					invokeDataType(options.type);
				});
			});
		});
	},
};
