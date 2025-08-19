import type { DataTypeImplementation } from "../proto/datatype.js";

export const Void: DataTypeImplementation<null> = {
    read: () => null,
    write: () => { },
    size: () => 0,
};

export const bool: DataTypeImplementation<boolean> = {
    read: (ctx) => !!ctx.read("i8"),
    write: (ctx, value) => ctx.write("i8", +value),
    size: () => 1,
};

export const cstring: DataTypeImplementation<string> = {
    read: (ctx) => {
        let size = 0;
        while(new DataView(ctx.io.buffer).getInt8(ctx.io.offset + size) !== 0x00) size++;
        const value = new TextDecoder().decode(ctx.io.buffer.slice(ctx.io.offset, ctx.io.offset + size));
        ctx.io.offset += size;
        ctx.io.offset += 1;
        return value;
    },
    write: (ctx, value) => {
        const buf = new TextEncoder().encode(value);
        new Uint8Array(ctx.io.buffer, ctx.io.offset, buf.byteLength).set(buf);
        ctx.io.offset += buf.byteLength;
        ctx.write("i8", 0x00);
    },
    size: (ctx, value) => {
        return new TextEncoder().encode(value).byteLength + 1;
    },
};
