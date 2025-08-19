import type { DataTypeImplementation } from "../proto/datatype.js";

const dataViewImpl = (
    getMethod: keyof DataView & `get${string}`,
    setMethod: keyof DataView & `set${string}`,
    size: number,
    littleEndian?: boolean,
): DataTypeImplementation<number | bigint> => {
    return {
        read(ctx) {
            let n = ctx.view[getMethod](ctx.offset);
            ctx.offset += size;
            return n;
        },

        write(ctx, value) {
            // Weird typescript error...
            type DataViewSetMethod = (byteOffset: number, value: number | bigint, littleEndian?: boolean) => void;
            (ctx.view[setMethod] as DataViewSetMethod)(ctx.offset, value, littleEndian);
            ctx.offset += size;
        },

        size: () => size,
    };
};

const varint: DataTypeImplementation<number> = {
    read: (ctx) => {
        let value = 0;
        let position = 0;
        while (true) {
            let byte = ctx.read<number>("u8");
            value |= (byte & 0x7F) << position;
            if ((byte & 0x80) == 0) break;
            position += 7;
            if (position >= 32) throw "VarInt too big";
        }

        return value;
    },

    write: (ctx, value) => {
        let cursor = 0;
        while (value & ~0x7F) {
            ctx.write("u8", (value & 0xFF) | 0x80);
            cursor++;
            value >>>= 7;
        }
        ctx.write("u8", value);
    },

    size: (ctx, value) => {
        let cursor = 0
        while (value & ~0x7F) {
            value >>>= 7
            cursor++
        }
        return cursor + 1;
    },
};

const varint64: DataTypeImplementation<bigint> = {
    read: (ctx) => {
        let value = 0n;
        let position = 0n;
        while (true) {
            let byte = ctx.read<number>("u8");
            value |= (BigInt(byte) & 0x7Fn) << position;
            if ((byte & 0x80) == 0) break;
            position += 7n;
            if (position >= 63n) throw "VarInt64 too big";
        }

        return value;
    },

    write: (ctx, value) => {
        do {
            const byte = value & 0x7Fn;
            value >>= 7n;
            ctx.write("u8", Number(byte) | (value ? 0x80 : 0));
        } while (value);
    },

    size: (ctx, value) => {
        let size = 0;
        do {
            value >>= 7n;
            size++;
        } while (value !== 0n);
        return size;
    },
};

const varint128: DataTypeImplementation<bigint> = {
    read: (ctx) => {
        let value = 0n;
        let position = 0n;
        while (true) {
            let byte = ctx.read<number>("u8");
            value |= (BigInt(byte) & 0x7Fn) << position;
            if ((byte & 0x80) == 0) break;
            position += 7n;
            if (position >= 127n) throw "VarInt64 too big";
        }

        return value;
    },

    write: varint64.write,
    size: varint64.size,
};

const zigzag32: DataTypeImplementation<number> = {
    read: (ctx) => {
        const value = ctx.read<number>("varint");
        return (value >>> 1) ^ -(value & 1);
    },

    write: (ctx, value) => {
        return ctx.write("varint", (value << 1) ^ (value >> 31));
    },

    size: (ctx, value) => {
        return ctx.size("varint", (value << 1) ^ (value >> 31));
    },
};

const zigzag64: DataTypeImplementation<bigint> = {
    read: (ctx) => {
        const value = ctx.read<bigint>("varint64");
        return (value >> 1n) ^ -(value & 1n);
    },

    write: (ctx, value) => {
        return ctx.write("varint64", (value << 1n) ^ (value >> 63n));
    },

    size: (ctx, value) => {
        return ctx.size("varint64", (value << 1n) ^ (value >> 63n));
    },
};

export const NativeNumericDataTypeImpls = {
    i8: dataViewImpl("getInt8", "setInt8", 1),
    u8: dataViewImpl("getUint8", "setUint8", 1),
    i16: dataViewImpl("getInt16", "setInt16", 2),
    u16: dataViewImpl("getUint16", "setUint16", 2),
    i32: dataViewImpl("getInt32", "setInt32", 4),
    u32: dataViewImpl("getUint32", "setUint32", 4),
    i64: dataViewImpl("getBigInt64", "setBigInt64", 8),
    u64: dataViewImpl("getBigUint64", "setBigUint64", 8),
    f16: dataViewImpl("getFloat16", "setFloat16", 2),
    f32: dataViewImpl("getFloat32", "setFloat32", 4),
    f64: dataViewImpl("getFloat64", "setFloat64", 8),

    varint,
    varint64,
    varint128,

    zigzag32,
    zigzag64,
} satisfies Record<string, DataTypeImplementation<any>>;
