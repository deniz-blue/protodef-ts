import type { DataTypeImplementation } from "../../proto/datatype.js";
import type { ProtoDef } from "../../types.js";

const getCount = (x: any) => {
    if(Array.isArray(x)) return x.length;
    throw `Cannot count '${x}'`;
};

export const count: DataTypeImplementation<any, ProtoDef.Native.CountArgs> = {
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
};
