import type { DataTypeImplementation } from "../../proto/datatype.js";
import type { ProtoDef } from "../../types.js";

const isSome = (x: any) => x !== null && x !== undefined;

export const option: DataTypeImplementation<any, ProtoDef.DataType> = {
    read: (ctx) => {
        const some = !!ctx.read<number>("u8");
        if (some) {
            return ctx.read(ctx.args);
        } else {
            return null;
        }
    },

    write: (ctx, value) => {
        if (isSome(value)) {
            ctx.write("u8", 1);
            ctx.write(ctx.args, value);
        } else {
            ctx.write("u8", 0);
        }
    },

    size: (ctx, value) => {
        if (isSome(value)) {
            return ctx.size(ctx.args, value) + 1;
        } else {
            return 1;
        }
    },
};
