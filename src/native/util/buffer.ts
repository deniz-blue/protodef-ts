import type { DataTypeImplementation } from "../../proto/datatype.js";
import type { ProtoDef } from "../../types.js";

export const buffer: DataTypeImplementation<Uint8Array, ProtoDef.Native.BufferArgs> = {
    read: (ctx) => {
        const length = ("count" in ctx.args) ? (typeof ctx.args.count == "number" ? ctx.args.count : ctx.getValue<number>(ctx.args.count)) : ctx.read<number>(ctx.args.countType);
        ctx.value = ctx.io.buffer.slice(ctx.io.offset, ctx.io.offset + length);
        ctx.io.offset += length;
    },

    write: (ctx, value) => {
        if ("countType" in ctx.args && !!ctx.args.countType) ctx.write(ctx.args.countType, value.byteLength);
        // new Uint8Array(ctx.io.buffer.buffer, ctx.io.offset, value.byteLength).set(new Uint8Array(value));
        ctx.io.buffer.set(value, ctx.io.offset);
        ctx.io.offset += value.byteLength;
    },

    size: (ctx, value) => {
        if ("count" in ctx.args && typeof ctx.args.count == "number") return ctx.args.count;
        let size = 0;
        if ("countType" in ctx.args && !!ctx.args.countType) size += ctx.size(ctx.args.countType, value.byteLength);
        size += value.byteLength;
        return size;
    },

    getChildDataTypes: (args) => "countType" in args ? [args.countType] : [],
};
