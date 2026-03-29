import type CodeBlockWriter from "code-block-writer";
import type { Codec, Context } from "../../codec.js";

export type SwitchArgs = {
	compareTo: string;
	compareToValue?: any;
	fields: Record<string, ProtoDef.DataType>;
	default?: ProtoDef.DataType;
};

declare global {
	namespace ProtoDef {
		interface IntrinsicDataTypes {
			switch: ["switch", SwitchArgs];
		}
	}
}

const dispacher = (writer: CodeBlockWriter, {
	withTempVar,
	options,
	resolveRelativePath,
	invokeDataType,
}: Context<SwitchArgs>) => {
	withTempVar("discriminant", (discriminant) => {
		if (options.compareToValue != null)
			writer.writeLine(`let ${discriminant} = ${JSON.stringify(options.compareToValue)}`);
		else
			writer.writeLine(`let ${discriminant} = String(${resolveRelativePath(options.compareTo)})`);

		writer.write(`switch (${discriminant}) `).inlineBlock(() => {
			const entries: [string, ProtoDef.DataType][] = Object.entries(options.fields);

			for (let [value, type] of entries) {
				writer.writeLine(`case ${JSON.stringify(value)}:`).indent(() => {
					invokeDataType(type);
					writer.writeLine(`break`);
				});
			}

			if (options.default) {
				writer.writeLine(`default:`).indent(() => {
					invokeDataType(options.default!);
				});
			}
		});
	});
};

export const Switch: Codec<SwitchArgs> = {
	decoder: dispacher,
	encoder: dispacher,
	encodedSize: dispacher,
};
