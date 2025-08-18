import type { DataTypeImplementation } from "../../proto/datatype.js";
import type { ProtoDef } from "../../types.js";

export const array: DataTypeImplementation<any[], ProtoDef.Native.ArrayArgs> = {
    read: (ctx) => {
        const value: any[] = [];

        const count = ctx.read<number | bigint>(ctx.args.countType);
        for (let i = 0; i < count; i++) {
            value.push(ctx.read(ctx.args.type));
        }

        return value;
    },

    write: (ctx, value) => {
        ctx.write(ctx.args.countType, value.length);
        for (let element of value) ctx.write(ctx.args.type, element);
    },

    size: (ctx, value) => {
        let size = 0;
        size += ctx.size(ctx.args.countType, value.length);
        for (let element of value) size += ctx.size(ctx.args.type, element);
        return size;
    },
};
