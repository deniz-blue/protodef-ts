import type { DataTypeImplementation } from "../../proto/datatype.js";
import type { ProtoDef } from "../../types.js";

const isSome = (x: any) => x !== null && x !== undefined;

export const option: DataTypeImplementation<any, ProtoDef.DataType> = {
    read: (ctx) => {
        const some = !!ctx.io.buffer[ctx.io.offset++];
        if (some) {
            ctx.value = ctx.read(ctx.args);
        } else {
            ctx.value = null;
        }
    },

    write: (ctx, value) => {
        if (isSome(value)) {
            ctx.io.buffer[ctx.io.offset++] = 1;
            ctx.write(ctx.args, value);
        } else {
            ctx.io.buffer[ctx.io.offset++] = 0;
        }
    },

    size: (ctx, value) => {
        if (isSome(value)) {
            return ctx.size(ctx.args, value) + 1;
        } else {
            return 1;
        }
    },

    getChildDataTypes: (args) => [args],
};
