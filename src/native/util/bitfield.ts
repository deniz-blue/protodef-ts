import type { Codec } from "../../codec.js";

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

export const bitfield: Codec<BitfieldArgs> = {
	encodedSize(writer, { size, options }) {
		const totalBits = options.reduce((sum, f) => sum + f.size, 0);
		const totalBytes = Math.ceil(totalBits / 8);
		writer.writeLine(`${size} += ${totalBytes}`);
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

		writer.writeLine(`${getPacket()} ??= {}`);

		withTempVar("raw", (raw) => {
			writer.writeLine(`let ${raw} = 0n;`);

			for (let i = 0; i < totalBytes; i++) {
				writer.writeLine(
					`${raw} |= BigInt(${buffer}[${offset} + ${i}]) << ${(totalBytes - 1 - i) * 8}n`
				);
			}

			let currentBitOffset = totalBytes * 8;
			options.forEach(field => {
				const mask = (1n << BigInt(field.size)) - 1n;
				const maskHex = `0x${mask.toString(16)}n`;
				currentBitOffset -= field.size;

				let val = `(${raw} >> ${currentBitOffset}n) & ${maskHex}`;

				if (field.signed) {
					const signBit = 1n << BigInt(field.size - 1);
					const signHex = `0x${signBit.toString(16)}n`;
					val = `((${val} ^ ${signHex}) - ${signHex})`;
				}

				writer.writeLine(`${getPacket()}.${field.name} = Number(${val})`);
			});

			writer.writeLine(`${offset} += ${totalBytes}`);
		});
	},

	encoder(writer, { options, buffer, offset, withTempVar, getPacket }) {
		const totalBits = options.reduce((sum, f) => sum + f.size, 0);
		const totalBytes = Math.ceil(totalBits / 8);

		withTempVar("raw", (raw) => {
			writer.writeLine(`let ${raw} = 0n`);

			let currentBitOffset = totalBytes * 8;
			options.forEach(field => {
				const size = field.size;
				const mask = (1n << BigInt(size)) - 1n;
				const maskHex = `0x${mask.toString(16)}n`;
				currentBitOffset -= size;

				writer.writeLine(
					`${raw} |= (BigInt(${getPacket()}.${field.name}) & ${maskHex}) << ${currentBitOffset}n`
				);
			});

			for (let i = 0; i < totalBytes; i++) {
				writer.writeLine(
					`${buffer}[${offset} + ${i}] = Number((${raw} >> ${(totalBytes - 1 - i) * 8}n) & 0xffn)`
				);
			}

			writer.writeLine(`${offset} += ${totalBytes}`);
		});
	}
};
