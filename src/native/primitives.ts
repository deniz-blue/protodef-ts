import type { DataTypeImplementation } from "../proto/datatype.js";

export const Void: DataTypeImplementation<null> = {
    read: (ctx) => ctx.value = null,
    write: () => { },
    size: () => 0,
};

export const bool: DataTypeImplementation<boolean> = {
    read: (ctx) => ctx.value = !!new DataView(ctx.io.buffer, ctx.io.offset++, 1).getInt8(0),
    write: (ctx, value) => new DataView(ctx.io.buffer, ctx.io.offset++, 1).setInt8(0, +value),
    size: () => 1,
};

export const cstring: DataTypeImplementation<string> = {
    read: (ctx) => {
        let size = 0;
        while(new DataView(ctx.io.buffer).getInt8(ctx.io.offset + size) !== 0x00) size++;
        ctx.value = new TextDecoder().decode(ctx.io.buffer.slice(ctx.io.offset, ctx.io.offset + size));
        ctx.io.offset += size;
        ctx.io.offset += 1;
    },
    write: (ctx, value) => {
        const buf = new TextEncoder().encode(value);
        new Uint8Array(ctx.io.buffer, ctx.io.offset, buf.byteLength).set(buf);
        ctx.io.offset += buf.byteLength;
        new DataView(ctx.io.buffer, ctx.io.offset, 1).setInt8(0, 0x00);
        ctx.io.offset += 1;
    },
    size: (ctx, value) => {
        return new TextEncoder().encode(value).byteLength + 1;
    },
};
