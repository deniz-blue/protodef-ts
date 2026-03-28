import type { DataTypeImplementation } from "../proto/datatype.js";

declare global {
	namespace ProtoDef {
		interface IntrinsicDataTypes {
			varint: "varint";
			varint64: "varint64";
			varint128: "varint128";
			zigzag32: "zigzag32";
			zigzag64: "zigzag64";
		}
	}
}

const varint: DataTypeImplementation<number> = {
	read: (ctx) => {
		let value = 0;
		let position = 0;
		while (true) {
			let byte = ctx.io.buffer[ctx.io.offset++] ?? 0;
			value |= (byte & 0x7F) << position;
			if ((byte & 0x80) == 0) break;
			position += 7;
			if (position >= 32) throw "VarInt too big";
		}

		ctx.value = value;
	},

	write: (ctx, value) => {
		let cursor = 0;
		while (value & ~0x7F) {
			ctx.io.buffer[ctx.io.offset++] = (value & 0xFF) | 0x80;
			cursor++;
			value >>>= 7;
		}
		ctx.io.buffer[ctx.io.offset++] = value;
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

const varint64: DataTypeImplementation<number | bigint> = {
	read: (ctx) => {
		let value = 0n;
		let position = 0n;
		while (true) {
			let byte = ctx.io.buffer[ctx.io.offset++] ?? 0;
			value |= (BigInt(byte) & 0x7Fn) << position;
			if ((byte & 0x80) == 0) break;
			position += 7n;
			if (position >= 63n) throw "VarInt64 too big";
		}

		ctx.value = value;
	},

	write: (ctx, value) => {
		value = BigInt(value);
		do {
			const byte = value & 0x7Fn;
			value >>= 7n;
			ctx.io.buffer[ctx.io.offset++] = Number(byte) | (value ? 0x80 : 0);
		} while (value);
	},

	size: (ctx, value) => {
		value = BigInt(value);
		let size = 0;
		do {
			value >>= 7n;
			size++;
		} while (value !== 0n);
		return size;
	},
};

const varint128: DataTypeImplementation<number | bigint> = {
	read: (ctx) => {
		let value = 0n;
		let position = 0n;
		while (true) {
			let byte = ctx.io.buffer[ctx.io.offset++] ?? 0;
			value |= (BigInt(byte) & 0x7Fn) << position;
			if ((byte & 0x80) == 0) break;
			position += 7n;
			if (position >= 127n) throw "VarInt64 too big";
		}

		ctx.value = value;
	},

	write: varint64.write,
	size: varint64.size,
};

const zigzag32: DataTypeImplementation<number> = {
	read: (ctx) => {
		const value = ctx.read<number>("varint");
		ctx.value = (value >>> 1) ^ -(value & 1);
	},

	write: (ctx, value) => {
		ctx.write("varint", (value << 1) ^ (value >> 31));
	},

	size: (ctx, value) => {
		return ctx.size("varint", (value << 1) ^ (value >> 31));
	},
};

const zigzag64: DataTypeImplementation<number | bigint> = {
	read: (ctx) => {
		const value = ctx.read<bigint>("varint64");
		ctx.value = (value >> 1n) ^ -(value & 1n);
	},

	write: (ctx, value) => {
		value = BigInt(value);
		ctx.write("varint64", (value << 1n) ^ (value >> 63n));
	},

	size: (ctx, value) => {
		value = BigInt(value);
		return ctx.size("varint64", (value << 1n) ^ (value >> 63n));
	},
};

export {
	varint,
	varint128,
	varint64,
	zigzag32,
	zigzag64,
};
