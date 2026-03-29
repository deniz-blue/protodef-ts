import type { Codec } from "../codec.js";

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

	const maxBytes = Math.ceil((byteSize * 8) / 7);
	const bigIntMaybe = big ? "BigInt" : "";

	return {
		decoder: (writer, { getPacket, buffer, offset, withTempVar }) => {

			writer.writeLine(`${getPacket()} = 0${big ? "n" : ""}`);

			writer.write(`for (let i = 0; i < ${maxBytes}; i++) `).inlineBlock(() => {
				writer.writeLine(`const byte = ${buffer}[${offset}++]`);

				if (big) {
					writer.writeLine(`${getPacket()} |= BigInt(byte & 0x7F) << BigInt(i * 7)`);
					writer.writeLine(`if (!(byte & 0x80)) `).inlineBlock(() => {
						writer
							.writeLine(`${getPacket()} = BigInt.asIntN(${byteSize * 8}, ${getPacket()})`)
							.writeLine(`break`);
					});
				} else {
					writer.write(`if (i < 4) `).inlineBlock(() => {
						writer.writeLine(`${getPacket()} |= (byte & 0x7F) << (i * 7)`);
					}).write(` else `).inlineBlock(() => {
						writer.writeLine(`${getPacket()} += (byte & 0x7F) * 268435456`);
					});
					writer.writeLine(`if (!(byte & 0x80)) `).inlineBlock(() => {
						writer
							.writeLine(`${getPacket()} |= 0`)
							.writeLine(`break`);
					});
				}

				writer.writeLine(`if (i === ${maxBytes - 1}) throw "varint too big"`);
			});

			if (zigzag) {
				writer.writeLine(`${getPacket()} = (${getPacket()} >> ${lit(1)}) ^ -((${getPacket()}) & ${lit(1)})`);
			}
		},

		encoder: (writer, { getPacket, buffer, offset, withTempVar }) => {
			if (zigzag) {
				writer.writeLine(`${getPacket()} = ((${getPacket()} << ${lit(1)}) ^ (${getPacket()} >> ${lit(byteSize * 8 - 1)}))`);
			}

			writer.writeLine(`${getPacket()} = ${big ? `BigInt.asUintN(${byteSize * 8}, ${getPacket()})` : `${getPacket()} >>> 0`}`);

			writer.write(`while (${getPacket()} > ${lit(127)}) `).inlineBlock(() => {
				writer
					.writeLine(`${buffer}[${offset}++] = ${big ? "Number" : ""}((${getPacket()} & ${lit(0x7F)}) | ${lit(0x80)})`)
					.writeLine(`${getPacket()} ${big ? `>>=` : `>>>=`} ${lit(7)}`);
			});

			writer.writeLine(`${buffer}[${offset}++] = ${big ? "Number" : ""}(${getPacket()})`);
		},

		encodedSize(writer, { size, getPacket, withTempVar }) {
			withTempVar("value", (value) => {
				writer
					.writeLine(`let ${value} = ${big ? `BigInt.asUintN(${byteSize * 8}, ${getPacket()})` : `${getPacket()} >>> 0`}`)
					.write(`do `).inlineBlock(() => {
						writer.writeLine(`${size}++`);
						writer.writeLine(`${value} ${big ? `>>=` : `>>>=`} ${lit(7)}`)
					}).write(` while (${value} > 0${big ? "n" : ""})`);
			});
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
