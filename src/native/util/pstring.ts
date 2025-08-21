import type { DataTypeImplementation } from "../../proto/datatype.js";
import type { ProtoDef } from "../../types.js";

export const pstring: DataTypeImplementation<string, ProtoDef.Native.PStringArgs> = {
    read: (ctx) => {
        const length = ("count" in ctx.args) ? (typeof ctx.args.count == "number" ? ctx.args.count : ctx.getValue<number>(ctx.args.count)) : ctx.read<number>(ctx.args.countType);
        const buf = ctx.io.buffer.slice(ctx.io.offset, ctx.io.offset + length);
        ctx.value = new TextDecoder(ctx.args.encoding).decode(buf);
        ctx.io.offset += length;
    },

    write: (ctx, value) => {
        const buf = new TextEncoder().encode(value);
        if ("countType" in ctx.args && !!ctx.args.countType) ctx.write(ctx.args.countType, buf.byteLength);
        new Uint8Array(ctx.io.buffer, ctx.io.offset, buf.byteLength).set(buf);
        ctx.io.offset += buf.byteLength;
    },

    size: (ctx, value) => {
        let size = 0;
        if ("countType" in ctx.args && !!ctx.args.countType) size += ctx.size(ctx.args.countType, value.length);
        const buf = new TextEncoder().encode(value);
        size += buf.byteLength;
        return size;
    },

    getChildDataTypes: (args) => "countType" in args ? [args.countType] : [],
};
