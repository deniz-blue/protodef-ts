import type { Codec } from "../../proto/codec.js";
import type { DataTypeImplementation } from "../../proto/datatype.js";

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

export const Switch: DataTypeImplementation<any, SwitchArgs> & Codec<SwitchArgs> = {
	read: (ctx) => {
		let discriminant = ctx.args.compareToValue ?? ctx.getValue(ctx.args.compareTo);

		if (ctx.args.fields[discriminant] !== undefined) {
			ctx.value = ctx.read(ctx.args.fields[discriminant]);
		} else if (ctx.args.default !== undefined) {
			ctx.value = ctx.read(ctx.args.default);
		} else {
			throw `Value '${discriminant}' switched to nothing`;
		}
	},

	write: (ctx, value) => {
		let discriminant = ctx.args.compareToValue ?? ctx.getValue(ctx.args.compareTo);
		let type = ctx.args.fields[discriminant] ?? ctx.args.default;
		if (type === undefined) throw `Value '${discriminant}' switched to nothing`;
		ctx.write(type, value);
	},

	size: (ctx, value) => {
		let discriminant = ctx.args.compareToValue ?? ctx.getValue(ctx.args.compareTo);
		let type = ctx.args.fields[discriminant] ?? ctx.args.default;
		if (type === undefined) throw `Value '${discriminant}' switched to nothing`;
		return ctx.size(type, value);
	},
	
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

			writer.write(`switch (${discriminant}) `).block(() => {
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

			writer.write(`switch (${discriminant}) `).block(() => {
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
