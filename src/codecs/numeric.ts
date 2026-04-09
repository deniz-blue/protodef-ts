import type { Codec } from "../codec.js";

declare global {
	namespace ProtoDef {
		interface IntrinsicDataTypes {
			i8: "i8";
			u8: "u8";
			i16: "i16";
			u16: "u16";
			i32: "i32";
			u32: "u32";
			i64: "i64";
			u64: "u64";
			f32: "f32";
			f64: "f64";
		}
	}
}

const numberIR = { kind: "identifier", identifier: "number" } as const;
const bigintIR = { kind: "identifier", identifier: "bigint" } as const;

const dataViewImpl = (
	getMethod: keyof DataView & `get${string}`,
	setMethod: keyof DataView & `set${string}`,
	byteLength: number,
	littleEndian: boolean,
	big: boolean = false,
): Codec => {
	return {
		decoder: (writer, { getPacket, view, offset, requestBytes }) => {
			requestBytes(byteLength);
			writer
				.writeLine(`${getPacket()} = ${view}.${getMethod}(${offset}, ${littleEndian})`)
				.writeLine(`${offset} += ${byteLength}`)
		},

		encoder: (writer, { view, offset, getPacket }) => {
			writer
				.writeLine(`${view}.${setMethod}(${offset}, ${big ? "BigInt" : "Number"}(${getPacket()}), ${littleEndian})`)
				.writeLine(`${offset} += ${byteLength}`)
		},

		encodedSize: (writer, { size }) => {
			writer.writeLine(`${size} += ${byteLength}`);
		},

		getIR: () => {
			return big ? bigintIR : numberIR;
		},
	};
};

export const i8: Codec = {
	decoder: (writer, { getPacket, offset, buffer, requestBytes }) => {
		requestBytes(1);
		writer.writeLine(`${getPacket()} = ${buffer}[${offset}++] << 24 >> 24`);
	},

	encoder: (writer, { getPacket, buffer, offset }) => {
		writer.writeLine(`${buffer}[${offset}++] = Number(${getPacket()}) & 0xFF`);
	},

	encodedSize: (writer, { size }) => void writer.writeLine(`${size}++`),

	getIR: () => numberIR,
};

export const u8: Codec = {
	decoder: (writer, { getPacket, offset, buffer, requestBytes }) => {
		requestBytes(1);
		writer.writeLine(`${getPacket()} = ${buffer}[${offset}++]`);
	},

	encoder: (writer, { getPacket, buffer, offset }) => {
		writer.writeLine(`${buffer}[${offset}++] = Number(${getPacket()})`);
	},

	encodedSize: (writer, { size }) => void writer.writeLine(`${size}++`),

	getIR: () => numberIR,
};

export const li8 = dataViewImpl("getInt8", "setInt8", 1, true, false);
export const lu8 = dataViewImpl("getUint8", "setUint8", 1, true, false);

export const i16 = dataViewImpl("getInt16", "setInt16", 2, false, false);
export const u16 = dataViewImpl("getUint16", "setUint16", 2, false, false);
export const i32 = dataViewImpl("getInt32", "setInt32", 4, false, false);
export const u32 = dataViewImpl("getUint32", "setUint32", 4, false, false);
export const i64 = dataViewImpl("getBigInt64", "setBigInt64", 8, false, true);
export const u64 = dataViewImpl("getBigUint64", "setBigUint64", 8, false, true);
export const f16 = dataViewImpl("getFloat16", "setFloat16", 2, false, false);
export const f32 = dataViewImpl("getFloat32", "setFloat32", 4, false, false);
export const f64 = dataViewImpl("getFloat64", "setFloat64", 8, false, false);
export const li16 = dataViewImpl("getInt16", "setInt16", 2, true, false);
export const lu16 = dataViewImpl("getUint16", "setUint16", 2, true, false);
export const li32 = dataViewImpl("getInt32", "setInt32", 4, true, false);
export const lu32 = dataViewImpl("getUint32", "setUint32", 4, true, false);
export const li64 = dataViewImpl("getBigInt64", "setBigInt64", 8, true, true);
export const lu64 = dataViewImpl("getBigUint64", "setBigUint64", 8, true, true);
export const lf16 = dataViewImpl("getFloat16", "setFloat16", 2, true, false);
export const lf32 = dataViewImpl("getFloat32", "setFloat32", 4, true, false);
export const lf64 = dataViewImpl("getFloat64", "setFloat64", 8, true, false);
