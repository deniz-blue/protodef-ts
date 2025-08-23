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

    codegenRead(ctx) {
        const length = "count" in ctx.args ? (
            typeof ctx.args.count == "number" ? ctx.args.count.toString() : ctx.getFieldReference(ctx.args.count)
        ) : ctx.inline(ctx.args.countType);

        return {
            value: `${ctx.vars.textDecoder}.decode(${ctx.vars.buffer}.subarray(${ctx.vars.offset}, ${ctx.vars.offset} + ${length}))`,
            post: `${ctx.vars.offset} += ${length}`,
        };
    },

    codegenSize(ctx) {
        const length = "count" in ctx.args ? (
            typeof ctx.args.count == "number" ? ctx.args.count.toString() : ctx.getFieldReference(ctx.args.count)
        ) : ctx.inline(ctx.args.countType);

        return `(${length} + ${ctx.vars.textByteLength}(${ctx.vars.value}))`;
    },

    codegenWrite(ctx) {
        const lengthWriteCode = "countType" in ctx.args ? ctx.inline(ctx.args.countType) : "";

        return [
            lengthWriteCode,
            `(() => {`,
            `\tlet buf = ${ctx.vars.textEncoder}.encode(${ctx.vars.value})`,
            `\t${ctx.vars.buffer}.set(buf, ${ctx.vars.offset})`,
            `\t${ctx.vars.offset} += buf.byteLength`,
            `})()`,
        ].filter(x=>x).join("\n");
    },
};
