import type { Codec } from "../../proto/codec.js";
import type { DataTypeImplementation } from "../../proto/datatype.js";

export type CountArgs = {
	type: ProtoDef.DataType;
	countFor: string;
};

declare global {
	namespace ProtoDef {
		interface IntrinsicDataTypes {
			count: ["count", CountArgs];
		}
	}
}

const getCount = (x: any) => {
    if(Array.isArray(x)) return x.length;
    throw `Cannot count '${x}'`;
};

export const count: DataTypeImplementation<any, CountArgs> & Codec<CountArgs> = {
    read: (ctx) => {
        ctx.value = ctx.read(ctx.args.type);
    },

    write: (ctx, value) => {
        const iterable = ctx.getValue<any>(ctx.args.countFor);
        ctx.write(ctx.args.type, getCount(iterable));
    },

    size: (ctx, value) => {
        const iterable = ctx.getValue<any>(ctx.args.countFor);
        return ctx.size(ctx.args.type, getCount(iterable));
    },

    getChildDataTypes: (args) => [args.type],

	decoder: (writer, { getPacket, invokeDataType, options }) => {
		invokeDataType(options.type);
	},

	encoder: (writer, { withNewPacket, options, resolveRelativePath, invokeDataType }) => {
		withNewPacket(`${resolveRelativePath(options.countFor)}.length`, () => {
			invokeDataType(options.type);
		});
	},
};
