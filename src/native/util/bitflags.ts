import type { Codec } from "../../proto/codec.js";

export type BitflagsArgs<Big extends boolean = false> = {
	type: ProtoDef.DataType;
	flags: string[] | Record<string, Big extends true ? bigint : number>;
	big?: Big;
	shift?: boolean;
};

declare global {
	namespace ProtoDef {
		interface IntrinsicDataTypes {
			bitflags: ["bitflags", BitflagsArgs];
		}
	}
}

export type Bitflags = {
	[k: string]: boolean | number | bigint | undefined;
	_value?: number | bigint;
};

export const bitflags: Codec<BitflagsArgs> = {
	decoder(writer, {
		options,
		withTempVar,
		withNewPacket,
		invokeDataType,
		getPacket,
	}) {
		const { flags, big, shift } = options;
		const isBig = !!big;
		const lit = (v: number | bigint) => isBig ? `${v}n` : `${v}`;

		withTempVar("raw", (raw) => {
			writer.writeLine(`let ${raw}`);

			withNewPacket(raw, () => {
				invokeDataType(options.type);
			});

			if (isBig) writer.writeLine(`${raw} = BigInt(${raw})`);

			writer
				.writeLine(`${getPacket()} = {}`)
				.writeLine(`${getPacket()}._value = ${raw}`);

			if (Array.isArray(flags)) {
				flags.forEach((name, i) => {
					const bitmask = isBig ? 1n << BigInt(i) : 1 << i;
					writer.writeLine(`${getPacket()}[${JSON.stringify(name)}] = (${raw} & ${lit(bitmask)}) !== ${lit(0)};`);
				});
			} else {
				for (const [name, value] of Object.entries(flags)) {
					const bitmask = shift ? (isBig ? 1n << BigInt(value) : 1 << (value as number)) : value;
					writer.writeLine(`${getPacket()}[${JSON.stringify(name)}] = (${raw} & ${lit(bitmask)}) !== ${lit(0)};`);
				}
			}
		});
	},

	encoder(writer, {
		options,
		withTempVar,
		withNewPacket,
		getPacket,
		invokeDataType,
	}) {
		const { flags, big, shift } = options;
		const isBig = !!big;
		const lit = (v: number | bigint) => isBig ? `${v}n` : `${v}`;

		withTempVar("raw", (raw) => {
			writer.writeLine(`let ${raw} = ${isBig ? "BigInt" : ""}(${getPacket()}._value ?? 0);`);

			if (Array.isArray(flags)) {
				flags.forEach((name, i) => {
					const bitmask = isBig ? 1n << BigInt(i) : 1 << i;
					writer.writeLine(`if (${getPacket()}[${JSON.stringify(name)}]) ${raw} |= ${lit(bitmask)};`);
				});
			} else {
				for (const [name, value] of Object.entries(flags)) {
					const bitmask = shift ? (isBig ? 1n << BigInt(value) : 1 << (value as number)) : value;
					writer.writeLine(`if (${getPacket()}[${JSON.stringify(name)}]) ${raw} |= ${lit(bitmask)};`);
				}
			}

			withNewPacket(raw, () => {
				invokeDataType(options.type);
			});
		});
	},

	encodedSize(writer, { options, invokeDataType }) {
		invokeDataType(options.type);
	},
};
