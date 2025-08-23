import type { DataTypeImplementation } from "../../proto/datatype.js";
import type { ProtoDef } from "../../types.js";
import { textByteLength } from "../../utils/string.js";

export const pstring: DataTypeImplementation<string, ProtoDef.Native.PStringArgs> = {
    read: (ctx) => {
        const length = ("count" in ctx.args) ? (typeof ctx.args.count == "number" ? ctx.args.count : ctx.getValue<number>(ctx.args.count)) : ctx.read<number>(ctx.args.countType);
        const buf = ctx.io.buffer.subarray(ctx.io.offset, ctx.io.offset + length);
        ctx.value = ctx.io.decodeText(buf);
        ctx.io.offset += length;
    },

    write: (ctx, value) => {
        const buf = ctx.io.encodeText(value);
        if ("countType" in ctx.args && !!ctx.args.countType) ctx.write(ctx.args.countType, buf.byteLength);
        ctx.io.buffer.set(buf, ctx.io.offset);
        ctx.io.offset += buf.byteLength;
    },

    size: (ctx, value) => {
        let size = 0;
        if ("countType" in ctx.args && !!ctx.args.countType) size += ctx.size(ctx.args.countType, value.length);
        size += textByteLength(value);
        return size;
    },

    getChildDataTypes: (args) => "countType" in args ? [args.countType] : [],
};
