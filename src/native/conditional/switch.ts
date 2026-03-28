import type { Codec } from "../../proto/codec.js";

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

// All three methods are the same

// todo: move the common code into a helper function

export const Switch: Codec<SwitchArgs> = {
	decoder: (writer, {
		withTempVar,
		options,
		resolveRelativePath,
		invokeDataType,
	}) => {
		withTempVar("discriminant", (discriminant) => {
			if (options.compareToValue != null)
				writer.writeLine(`let ${discriminant} = ${JSON.stringify(options.compareToValue)}`);
			else
				writer.writeLine(`let ${discriminant} = ${resolveRelativePath(options.compareTo)}`);

			writer.write(`switch (${discriminant}) `).inlineBlock(() => {
				for (let [value, type] of Object.entries(options.fields)) {
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
	},

	encoder: (writer, {
		withTempVar,
		options,
		resolveRelativePath,
		invokeDataType,
	}) => {
		withTempVar("discriminant", (discriminant) => {
			if (options.compareToValue != null)
				writer.writeLine(`let ${discriminant} = ${JSON.stringify(options.compareToValue)}`);
			else
				writer.writeLine(`let ${discriminant} = ${resolveRelativePath(options.compareTo)}`);

			writer.write(`switch (${discriminant}) `).inlineBlock(() => {
				for (let [value, type] of Object.entries(options.fields)) {
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
	},

	encodedSize: (writer, { options, withTempVar, resolveRelativePath, invokeDataType }) => {
		withTempVar("discriminant", (discriminant) => {
			if (options.compareToValue != null)
				writer.writeLine(`let ${discriminant} = ${JSON.stringify(options.compareToValue)}`);
			else
				writer.writeLine(`let ${discriminant} = ${resolveRelativePath(options.compareTo)}`);

			writer.write(`switch (${discriminant}) `).inlineBlock(() => {
				for (let [value, type] of Object.entries(options.fields)) {
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
	},
};
