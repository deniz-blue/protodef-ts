import type { Codec } from "../proto/codec.js";
import type { DataTypeImplementation } from "../proto/datatype.js";

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

const dataViewImpl = (
	getMethod: keyof DataView & `get${string}`,
	setMethod: keyof DataView & `set${string}`,
	size: number,
	littleEndian?: boolean,
): DataTypeImplementation<number | bigint> & Codec => {
	return {
		read(ctx) {
			let n = ctx.io.view[getMethod](ctx.io.offset, littleEndian);
			ctx.io.offset += size;
			ctx.value = n;
		},

		write(ctx, value) {
			// Weird typescript error...
			type DataViewSetMethod = (byteOffset: number, value: number | bigint, littleEndian?: boolean) => void;
			(ctx.io.view[setMethod] as DataViewSetMethod)(ctx.io.offset, value, littleEndian);
			ctx.io.offset += size;
		},

		size: () => size,

		decoder: (writer, { getPacket, view, offset }) => {
			writer
				.writeLine(`${getPacket()} = ${view}.${getMethod}(${offset}, ${littleEndian})`)
				.writeLine(`${offset} += ${size}`)
		},

		encoder: (writer, { view, offset, getPacket }) => {
			writer
				.writeLine(`${view}.${setMethod}(${offset}, ${getPacket()}, ${littleEndian})`)
				.writeLine(`${offset} += ${size}`)
		},
	};
};

export const i8 = dataViewImpl("getInt8", "setInt8", 1, false);
export const u8 = dataViewImpl("getUint8", "setUint8", 1, false);
export const i16 = dataViewImpl("getInt16", "setInt16", 2, false);
export const u16 = dataViewImpl("getUint16", "setUint16", 2, false);
export const i32 = dataViewImpl("getInt32", "setInt32", 4, false);
export const u32 = dataViewImpl("getUint32", "setUint32", 4, false);
export const i64 = dataViewImpl("getBigInt64", "setBigInt64", 8, false);
export const u64 = dataViewImpl("getBigUint64", "setBigUint64", 8, false);
export const f16 = dataViewImpl("getFloat16", "setFloat16", 2, false);
export const f32 = dataViewImpl("getFloat32", "setFloat32", 4, false);
export const f64 = dataViewImpl("getFloat64", "setFloat64", 8, false);
export const li8 = dataViewImpl("getInt8", "setInt8", 1, true);
export const lu8 = dataViewImpl("getUint8", "setUint8", 1, true);
export const li16 = dataViewImpl("getInt16", "setInt16", 2, true);
export const lu16 = dataViewImpl("getUint16", "setUint16", 2, true);
export const li32 = dataViewImpl("getInt32", "setInt32", 4, true);
export const lu32 = dataViewImpl("getUint32", "setUint32", 4, true);
export const li64 = dataViewImpl("getBigInt64", "setBigInt64", 8, true);
export const lu64 = dataViewImpl("getBigUint64", "setBigUint64", 8, true);
export const lf16 = dataViewImpl("getFloat16", "setFloat16", 2, true);
export const lf32 = dataViewImpl("getFloat32", "setFloat32", 4, true);
export const lf64 = dataViewImpl("getFloat64", "setFloat64", 8, true);
