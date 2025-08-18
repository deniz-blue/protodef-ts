import type { DataTypeImplementation } from "../../proto/datatype.js";
import type { ProtoDef } from "../../types.js";

export const buffer: DataTypeImplementation<ArrayBuffer, ProtoDef.Native.BufferArgs> = {
    read: (ctx) => {
        const length = ctx.read<number>(ctx.args.countType);

        const buf = ctx.buffer.slice(ctx.offset, ctx.offset + length);
        ctx.offset += length;

        return buf;
    },

    write: (ctx, value) => {
        ctx.write(ctx.args.countType, value.byteLength);

        new Uint8Array(ctx.buffer, ctx.offset, value.byteLength).set(new Uint8Array(value));
        ctx.offset += value.byteLength;
    },

    size: (ctx, value) => {
        return ctx.size(ctx.args.countType, value.byteLength) + value.byteLength;
    },
};
