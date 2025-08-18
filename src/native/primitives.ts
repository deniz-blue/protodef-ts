import type { DataTypeImplementation } from "../proto/datatype.js";

export const Void: DataTypeImplementation<undefined> = {
    read: () => undefined,
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
        while(ctx.view.getInt8(ctx.offset + size) !== 0x00) size++;
        const value = new TextDecoder().decode(ctx.buffer.slice(ctx.offset, ctx.offset + size));
        ctx.offset += size;
        ctx.offset += 1;
        return value;
    },
    write: (ctx, value) => {
        const buf = new TextEncoder().encode(value);
        new Uint8Array(ctx.buffer, ctx.offset, buf.byteLength).set(buf);
        ctx.offset += buf.byteLength;
        ctx.write("i8", 0x00);
    },
    size: (ctx, value) => {
        return new TextEncoder().encode(value).byteLength + 1;
    },
};
