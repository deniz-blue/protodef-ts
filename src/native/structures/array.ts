import type { DataTypeImplementation } from "../../proto/datatype.js";
import type { ProtoDef } from "../../types.js";

export const array: DataTypeImplementation<any[], ProtoDef.Native.ArrayArgs> = {
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
};
