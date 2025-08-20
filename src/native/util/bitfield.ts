import type { DataTypeImplementation } from "../../proto/datatype.js";
import type { ProtoDef } from "../../types.js";

export const bitfield: DataTypeImplementation<Record<string, any>, ProtoDef.Native.BitfieldArgs> = {
    // ! I used ChatGPT for read and write
    // im sorry im not smart enough for bit manipulation
    // i did go ahead and rewrite most of the functions but still...
    // todo review and test

    read: (ctx) => {
        const view = new DataView(ctx.io.buffer);
        let bitOffset = ctx.io.offset * 8; // start in bits
        const result: { [name: string]: number } = {};

        for (const { name, size, signed } of ctx.args) {
            let value = 0;
            let bitsRead = 0;

            while (bitsRead < size) {
                const byteIndex = Math.floor(bitOffset / 8);
                const bitInByte = bitOffset % 8;
                const bitsAvailable = Math.min(8 - bitInByte, size - bitsRead);

                const byte = view.getUint8(byteIndex);
                const mask = ((1 << bitsAvailable) - 1) << bitInByte;
                const chunk = (byte & mask) >>> bitInByte;

                value |= chunk << bitsRead;

                bitOffset += bitsAvailable;
                bitsRead += bitsAvailable;
            }

            if (signed) {
                const signBit = 1 << (size - 1);
                if (value & signBit) {
                    value = value - (1 << size);
                }
            }

            result[name] = value;
        }

        ctx.value = result;
        ctx.io.offset = Math.ceil(bitOffset / 8); // move offset to next byte boundary
    },

    write: (ctx, value) => {
        const view = new DataView(ctx.io.buffer);
        let bitOffset = ctx.io.offset * 8;

        for (const { name, size, signed } of ctx.args) {
            let val = value[name];

            if (signed && val < 0) {
                val = (1 << size) + val; // two’s complement
            }

            let bitsWritten = 0;

            while (bitsWritten < size) {
                const byteIndex = Math.floor(bitOffset / 8);
                const bitInByte = bitOffset % 8;
                const bitsAvailable = Math.min(8 - bitInByte, size - bitsWritten);

                const mask = (1 << bitsAvailable) - 1;
                const chunk = (val >>> bitsWritten) & mask;

                const existing = view.getUint8(byteIndex);
                const cleared = existing & ~(mask << bitInByte);
                view.setUint8(byteIndex, cleared | (chunk << bitInByte));

                bitOffset += bitsAvailable;
                bitsWritten += bitsAvailable;
            }
        }

        ctx.io.offset = Math.ceil(bitOffset / 8);
    },

    size: (ctx, value) => {
        let size = 0;
        for (let field of ctx.args) size += field.size;
        return Math.ceil(size / 8);
    },
};
