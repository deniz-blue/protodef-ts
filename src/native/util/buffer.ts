import type { DataTypeImplementation } from "../../proto/datatype.js";
import type { ProtoDef } from "../../types.js";

export const buffer: DataTypeImplementation<ArrayBuffer, ProtoDef.Native.BufferArgs> = {
    read: (ctx) => {
        const length = ctx.read<number>(ctx.args.countType);
        ctx.value = ctx.io.buffer.slice(ctx.io.offset, ctx.io.offset + length);
        ctx.io.offset += length;
    },

    write: (ctx, value) => {
        ctx.write(ctx.args.countType, value.byteLength);

        new Uint8Array(ctx.io.buffer, ctx.io.offset, value.byteLength).set(new Uint8Array(value));
        ctx.io.offset += value.byteLength;
    },

    size: (ctx, value) => {
        return ctx.size(ctx.args.countType, value.byteLength) + value.byteLength;
    },
};
