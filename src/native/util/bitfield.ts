import type { Codec } from "../../proto/codec.js";
import type { DataTypeImplementation } from "../../proto/datatype.js";

export type BitfieldField = {
	name: string;
	size: number;
	signed: boolean;
};

export type BitfieldArgs = BitfieldField[];

declare global {
	namespace ProtoDef {
		interface IntrinsicDataTypes {
			bitfield: ["bitfield", BitfieldArgs];
		}
	}
}

const bitMask = (n: number) => (1 << n) - 1;

export const bitfield: DataTypeImplementation<Record<string, number>, BitfieldArgs> & Codec<BitfieldArgs> = {
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
					curVal = ctx.io.buffer[ctx.io.offset++] ?? 0
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
					ctx.io.buffer[ctx.io.offset++] = toWrite;
					bits = 0
					toWrite = 0
				}
			}
		}


		if (bits !== 0)
			ctx.io.buffer[ctx.io.offset++] = toWrite << (8 - bits);
	},

	size: (ctx, value) => {
		let size = 0;
		for (let field of ctx.args) size += field.size;
		return Math.ceil(size / 8);
	},

	decoder(writer, {
		options,
		withTempVar,
		buffer,
		offset,
		getPacket,
	}) {
		const totalBits = options.reduce((sum, f) => sum + f.size, 0);
		const totalBytes = Math.ceil(totalBits / 8);

		writer.writeLine(`${getPacket()} = {}`);

		withTempVar("raw", (raw) => {
			writer.writeLine(`let ${raw} = 0n;`);

			for (let i = 0; i < totalBytes; i++) {
				writer.writeLine(
					`${raw} |= BigInt(${buffer}[${offset} + ${i}]) << ${i * 8}n`
				);
			}

			let currentBitOffset = 0;
			options.forEach(field => {
				const mask = (1 << field.size) - 1;
				const maskHex = `0x${mask.toString(16)}n`;

				let val = `(${raw} >> ${currentBitOffset}n) & ${maskHex}`;

				if (field.signed) {
					const signBit = 1 << (field.size - 1);
					const signHex = `0x${signBit.toString(16)}n`;
					val = `((${val} ^ ${signHex}) - ${signHex})`;
				}

				writer.writeLine(`${getPacket()}.${field.name} = ${val}`);
				currentBitOffset += field.size;
			});

			writer.writeLine(`${offset} += ${totalBytes}`);
		});
	},

	encoder(writer, { options, buffer, offset, withTempVar, getPacket }) {
		const totalBits = options.reduce((sum, f) => sum + f.size, 0);
		const totalBytes = Math.ceil(totalBits / 8);

		withTempVar("raw", (raw) => {
			writer.writeLine(`let ${raw} = 0n`);

			let currentBitOffset = 0;
			options.forEach(field => {
				const size = field.size;
				const mask = (1 << size) - 1;
				const maskHex = `0x${mask.toString(16)}n`;

				writer.writeLine(
					`${raw} |= (BigInt(${getPacket()}.${field.name}) & ${maskHex}) << ${currentBitOffset}n`
				);
				currentBitOffset += size;
			});

			for (let i = 0; i < totalBytes; i++) {
				writer.writeLine(
					`${buffer}[${offset} + ${i}] = Number((${raw} >> ${i * 8}n) & 0xffn)`
				);
			}

			writer.writeLine(`${offset} += ${totalBytes}`);
		});
	}
};
