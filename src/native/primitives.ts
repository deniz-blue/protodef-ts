import type { DataTypeImplementation } from "../proto/datatype.js";
import { textByteLength } from "../utils/string.js";

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

export const cstring: DataTypeImplementation<string> = {
    read: (ctx) => {
        let size = 0;
        while(!ctx.io.buffer[ctx.io.offset + size]) size++;
        ctx.value = ctx.io.decodeText(ctx.io.buffer.slice(ctx.io.offset, ctx.io.offset + size));
        ctx.io.offset += size;
        ctx.io.offset += 1;
    },
    write: (ctx, value) => {
        const buf = ctx.io.encodeText(value);
        ctx.io.buffer.set(buf, ctx.io.offset);
        ctx.io.offset += buf.byteLength;
        ctx.io.buffer[ctx.io.offset++] = 0x00;
    },
    size: (ctx, value) => {
        return textByteLength(value) + 1;
    },
};
