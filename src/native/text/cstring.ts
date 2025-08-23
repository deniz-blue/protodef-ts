import type { DataTypeImplementation } from "../../proto/datatype.js";
import { iife } from "../../utils/code.js";
import { textByteLength } from "../../utils/string.js";

export const cstring: DataTypeImplementation<string> = {
    read: (ctx) => {
        let size = 0;
        while (!ctx.io.buffer[ctx.io.offset + size]) size++;
        ctx.value = ctx.io.decodeText(ctx.io.buffer.subarray(ctx.io.offset, ctx.io.offset + size));
        ctx.io.offset += size;
        ctx.io.offset += 1;
    },
    write: (ctx, value) => {
        const buf = ctx.io.encodeText(value);
        ctx.io.buffer.set(buf, ctx.io.offset);
        ctx.io.offset += buf.byteLength;
        ctx.io.buffer[ctx.io.offset++] = 0x00;
    },
    size: (ctx, value) => {
        return textByteLength(value) + 1;
    },

    codegenRead(ctx) {
        return {
            pre: [
                `let size = 0`,
                `while(!${ctx.vars.buffer}[${ctx.vars.offset} + size]) size++`,
            ].join("\n"),
            value: `${ctx.vars.textDecoder}.decode(${ctx.vars.buffer}.subarray(${ctx.vars.offset}, ${ctx.vars.offset} + size))`,
            post: `${ctx.vars.offset} += size + 1`,
        };
    },

    codegenSize(ctx) {
        return `(${ctx.vars.textByteLength}(${ctx.vars.value}) + 1)`;
    },

    codegenWrite(ctx) {
        return iife([
            `let buf = ${ctx.vars.textEncoder}.encode(${ctx.vars.value})`,
            `${ctx.vars.buffer}.set(buf, ${ctx.vars.offset})`,
            `${ctx.vars.offset} += buf.byteLength`,
            `${ctx.vars.buffer}[${ctx.vars.offset}++] = 0x00`,
        ]);
    },
};
