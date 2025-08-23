import type { DataTypeImplementation } from "../proto/datatype.js";

export const Void: DataTypeImplementation<null> = {
    read: (ctx) => ctx.value = null,
    write: () => { },
    size: () => 0,
};

export const bool: DataTypeImplementation<boolean> = {
    read: (ctx) => ctx.value = !!ctx.io.view.getInt8(ctx.io.offset++),
    write: (ctx, value) => ctx.io.view.setInt8(ctx.io.offset++, +value),
    size: () => 1,
};
