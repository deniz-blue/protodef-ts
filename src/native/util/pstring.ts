import type { DataTypeImplementation } from "../../proto/datatype.js";
import type { ProtoDef } from "../../types.js";

export const pstring: DataTypeImplementation<string, ProtoDef.Native.PStringArgs> = {
    read: (ctx) => {
        const length = ctx.read<number>(ctx.args.countType);
        const buf = ctx.buffer.slice(ctx.offset, ctx.offset + length);
        ctx.offset += length;
        return new TextDecoder(ctx.args.encoding).decode(buf);
    },

    write: (ctx, value) => {
        ctx.write(ctx.args.countType, value.length);
        const buf = new TextEncoder().encode(value);
        new Uint8Array(ctx.buffer, ctx.offset, buf.byteLength).set(buf);
        ctx.offset += buf.byteLength;
    },

    size: (ctx, value) => {
        let size = 0;
        size += ctx.size(ctx.args.countType, value.length);
        const buf = new TextEncoder().encode(value);
        size += buf.byteLength;
        return size;
    },
};
