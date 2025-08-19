import type { DataTypeImplementation } from "../../proto/datatype.js";
import type { ProtoDef } from "../../types.js";

export const bitfield: DataTypeImplementation<Record<string, any>, ProtoDef.Native.BitfieldArgs> = {
    // ! I used ChatGPT for read and write
    // im sorry im not smart enough for bit manipulation
    // i did go ahead and rewrite most of the functions but still...
    // todo review and test

    read: (ctx) => {
        let struct: Record<string, any> = {};

        let bitSize = 0;

        let position = 0;
        for (const field of ctx.args) {
            bitSize += field.size;

            let value = 0n;
            let remaining = field.size;

            // fast-path: align to next byte
            while (remaining >= 8 && ((position & 7) === 0)) {
                const byteIndex = ctx.io.offset + (position >> 3);
                value = (value << 8n) | BigInt(new DataView(ctx.io.buffer).getUint8(byteIndex));
                position += 8;
                remaining -= 8;
            }

            // slow-path: residual bits
            while (remaining > 0) {
                const byteIndex = ctx.io.offset + (position >> 3);
                const bitIndex = 7 - (position & 7);
                const bit = (new DataView(ctx.io.buffer).getUint8(byteIndex) >> bitIndex) & 1;
                value = (value << 1n) | BigInt(bit);
                position++;
                remaining--;
            }

            if (field.signed && field.size > 0) {
                const signBit = 1n << BigInt(field.size - 1);
                if (value & signBit) {
                    value -= 1n << BigInt(field.size);
                }
            }

            struct[field.name] = Number(value);
        }

        ctx.io.offset += Math.ceil(bitSize / 8);

        return struct;
    },

    write: (ctx, struct) => {
        let bitPos = 0;
        for (const field of ctx.args) {
            let fieldVal = BigInt(struct[field.name] ?? 0);
            let remaining = field.size;

            // fast-path: whole-byte chunks
            while (remaining >= 8 && ((bitPos & 7) === 0)) {
                const byteIndex = ctx.io.offset + (bitPos >> 3);
                const byte = Number((fieldVal >> BigInt(remaining - 8)) & 0xFFn);
                new DataView(ctx.io.buffer).setUint8(byteIndex, byte);
                bitPos += 8;
                remaining -= 8;
            }

            // slow-path: residual bits
            for (let i = remaining - 1; i >= 0; i--) {
                const bit = Number((fieldVal >> BigInt(i)) & 1n);
                const globalBit = bitPos + (remaining - 1 - i);
                const byteIndex = ctx.io.offset + (globalBit >> 3);
                const bitIndex = 7 - (globalBit & 7);

                const old = new DataView(ctx.io.buffer).getUint8(byteIndex);
                new DataView(ctx.io.buffer).setUint8(byteIndex, (old & ~(1 << bitIndex)) | (bit << bitIndex));
            }

            bitPos += field.size;
        }

        // small improvement by using bitPos instead of calculating again
        ctx.io.offset += Math.ceil(bitPos / 8);
    },

    size: (ctx, value) => {
        let size = 0;
        for (let field of ctx.args) size += field.size;
        return Math.ceil(size / 8);
    },
};
