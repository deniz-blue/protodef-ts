import type { DataTypeImplementation } from "../../proto/datatype.js";
import type { ProtoDef } from "../../types.js";

const bitMask = (n: number) => (1 << n) - 1;

export const bitfield: DataTypeImplementation<Record<string, number>, ProtoDef.Native.BitfieldArgs> = {
    // ! I used ChatGPT for read and write
    // im sorry im not smart enough for bit manipulation
    // i did go ahead and rewrite most of the functions but still...
    // todo review and test

    read: (ctx) => {
        const beginOffset = ctx.io.offset;
        let curVal = 0
        let bits = 0

        ctx.value = {};

        for (let { size, signed, name } of ctx.args) {
            let currentSize = size
            let val = 0
            while (currentSize > 0) {
                if (bits === 0) {
                    // if (ctx.buffer.length < offset + 1) { throw new PartialReadError() }
                    curVal = new DataView(ctx.io.buffer, ctx.io.offset++, 1).getInt8(0);
                    bits = 8
                }
                const bitsToRead = Math.min(currentSize, bits)
                val = (val << bitsToRead) | (curVal & bitMask(bits)) >> (bits - bitsToRead)
                bits -= bitsToRead
                currentSize -= bitsToRead
            }
            if (signed && val >= 1 << (size - 1)) { val -= 1 << size }
            ctx.value[name] = val
        };
    },

    write: (ctx, value) => {
        let toWrite = 0
        let bits = 0

        for (let { name, signed, size } of ctx.args) {
            const val = value[name] ?? 0;

            // if ((!signed && val < 0) || (signed && val < -(1 << (size - 1)))) {
            //     throw new Error(value + ' < ' + signed ? (-(1 << (size - 1))) : 0)
            // } else if ((!signed && val >= 1 << size) ||
            //     (signed && val >= (1 << (size - 1)) - 1)) {
            //     throw new Error(value + ' >= ' + signed ? (1 << size) : ((1 << (size - 1)) - 1))
            // }

            while (size > 0) {
                const writeBits = Math.min(8 - bits, size)
                toWrite = toWrite << writeBits |
                    ((val >> (size - writeBits)) & bitMask(writeBits))
                size -= writeBits
                bits += writeBits
                if (bits === 8) {
                    new DataView(ctx.io.buffer, ctx.io.offset++, 1)
                        .setInt8(0, toWrite);
                    bits = 0
                    toWrite = 0
                }
            }
        }


        if (bits !== 0)
            new DataView(ctx.io.buffer, ctx.io.offset++, 1)
                .setInt8(0,
                    toWrite << (8 - bits)
                );
    },

    size: (ctx, value) => {
        let size = 0;
        for (let field of ctx.args) size += field.size;
        return Math.ceil(size / 8);
    },
};
