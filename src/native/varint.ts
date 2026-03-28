import type { Codec } from "../proto/codec.js";

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

const $impl = (
	byteSize: number,
	big: boolean,
	zigzag: boolean,
): Codec => {
	const lit = (v: number | bigint | string) => big ? `${v}n` : `${v}`;

	const max = big ? (1n << BigInt(byteSize * 7)) - 1n : (1 << (byteSize * 7)) - 1;
	const min = big ? -(1n << BigInt(byteSize * 7)) : -(1 << (byteSize * 7));

	return {
		decoder: (writer, { getPacket, buffer, offset, withTempVar }) => {
			withTempVar("position", (position) => {
				writer
					.writeLine(`let ${position} = 0`)
					.writeLine(`${getPacket()} = 0`)
					.write(`while (true) `).inlineBlock(() => {
						withTempVar("byte", (byte) => {
							const byteAccess = `${buffer}[${offset}++] ?? 0`;
							writer
								.writeLine(`let ${byte} = ${big ? `BigInt(${byteAccess})` : byteAccess}`)
								.writeLine(`${getPacket()} |= (${big ? `BigInt(${byte})` : byte} & ${lit(0x7F)}) << ${position}`)
								.writeLine(`if ((${byte} & ${lit(0x80)}) == 0) break`)
								.writeLine(`${position} += ${lit(7)}`)
								.writeLine(`if (${position} >= ${lit(byteSize * 7)}) throw "VarInt too big"`);
						});
					});
			});

			if (zigzag) {
				writer.writeLine(`${getPacket()} = (${getPacket()} >> ${lit(1)}) ^ -((${getPacket()}) & ${lit(1)})`);
			}
		},

		encoder: (writer, { getPacket, buffer, offset, withTempVar }) => {
			if (zigzag) {
				writer.writeLine(`${getPacket()} = ((${getPacket()} << ${lit(1)}) ^ (${getPacket()} >> ${lit(byteSize * 7 - 1)}))`);
			}

			writer
				.writeLine(`${getPacket()} = ${big ? `BigInt(${getPacket()})` : getPacket()}`)
				.writeLine(`if (${getPacket()} < ${lit(min)} || ${getPacket()} > ${lit(max)}) throw "VarInt out of bounds"`)
				.write(`do `).inlineBlock(() => {
					writer
						.writeLine(`${getPacket()} >>= ${lit(7)}`)
						.writeLine(`${buffer}[${offset}++] = Number(${getPacket()} & ${lit("0x7F")}) | (${getPacket()} ? ${lit("0x80")} : 0)`);
				}).write(` while (${getPacket()})`);
		},

		encodedSize(writer, { size, getPacket }) {
			writer
				.writeLine(`${getPacket()} = ${big ? `BigInt(${getPacket()})` : getPacket()}`)
				.write(`do `).inlineBlock(() => {
					writer.writeLine(`${getPacket()} >>= ${lit(7)}`)
					writer.writeLine(`${size}++`);
				}).write(` while (${getPacket()})`)
		},
	};
};

const varint32: Codec = $impl(4, false, false);
const varint64: Codec = $impl(8, true, false);
const varint128: Codec = $impl(16, true, false);
const zigzag32: Codec = $impl(4, false, true);
const zigzag64: Codec = $impl(8, true, true);
const zigzag128: Codec = $impl(16, true, true);

const varint: Codec = varint32;

export {
	varint,
	varint32,
	varint128,
	varint64,
	zigzag32,
	zigzag64,
	zigzag128,
};
