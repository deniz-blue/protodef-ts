import type { DataTypeImplementation } from "../../proto/datatype.js";
import type { ProtoDef } from "../../types.js";

const isSome = (x: any) => x !== null && x !== undefined;

export const option: DataTypeImplementation<any, ProtoDef.DataType> = {
    read: (ctx) => {
        const some = !!new DataView(ctx.io.buffer, ctx.io.offset++).getInt8(0);
        if (some) {
            ctx.value = ctx.read(ctx.args);
        } else {
            ctx.value = null;
        }
    },

    write: (ctx, value) => {
        if (isSome(value)) {
            new DataView(ctx.io.buffer, ctx.io.offset++, 1).setInt8(0, 1);
            ctx.write(ctx.args, value);
        } else {
            new DataView(ctx.io.buffer, ctx.io.offset++, 1).setInt8(0, 0);
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
