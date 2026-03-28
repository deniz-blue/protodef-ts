import type { Codec } from "../../proto/codec.js";
import type { DataTypeImplementation } from "../../proto/datatype.js";

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

export const bitflags: DataTypeImplementation<Bitflags, BitflagsArgs> & Codec<BitflagsArgs> = {
	read: (ctx) => {
		const source = ctx.read<number | bigint>(ctx.args.type);

		ctx.value = {
			_value: source,
		};

		if (Array.isArray(ctx.args.flags)) {
			for (let i = 0; i < ctx.args.flags.length; i++) {
				const flag = ctx.args.flags[i]!;
				const bitMask = ctx.args.big ? (1n << BigInt(i)) : (1 << i);
				ctx.value[flag] = ((source as any) & (bitMask as any) as any) === bitMask;
			}
		} else {
			if (ctx.args.shift) {
				for (let flag in ctx.args.flags) {
					const bitMask = ctx.args.big ? (
						1n << BigInt(ctx.args.flags[flag]!)
					) : (
						1 << ctx.args.flags[flag]!
					);

					ctx.value[flag] = ((source as any) & (bitMask as any) as any) === bitMask;
				}
			} else {
				for (let flag in ctx.args.flags) {
					ctx.value[flag] = ((source as any) & (ctx.args.flags[flag]! as any) as any) === ctx.args.flags[flag]!;
				}
			}
		}
	},

	write: (ctx, value) => {
		let flags = value._value || (ctx.args.big ? 0n : 0);

		if (Array.isArray(ctx.args.flags)) {
			for (let i = 0; i < ctx.args.flags.length; i++) {
				const flag = ctx.args.flags[i]!;
				const bitMask = ctx.args.big ? (1n << BigInt(i)) : (1 << i);
				// @ts-ignore
				flags |= bitMask;
			}
		} else {
			if (ctx.args.shift) {
				for (let flag in ctx.args.flags) {
					const bitMask = ctx.args.big ? (
						1n << BigInt(ctx.args.flags[flag]!)
					) : (
						1 << ctx.args.flags[flag]!
					);

					// @ts-ignore
					flags |= bitMask;
				}
			} else {
				for (let flag in ctx.args.flags) {
					// @ts-ignore
					flags |= ctx.args.flags[flag]!;
				}
			}
		}

		ctx.write(ctx.args.type, flags);
	},

	size: (ctx, value) => {
		let flags = value._value || (ctx.args.big ? 0n : 0);

		if (Array.isArray(ctx.args.flags)) {
			for (let i = 0; i < ctx.args.flags.length; i++) {
				const flag = ctx.args.flags[i]!;
				const bitMask = ctx.args.big ? (1n << BigInt(i)) : (1 << i);
				// @ts-ignore
				flags |= bitMask;
			}
		} else {
			if (ctx.args.shift) {
				for (let flag in ctx.args.flags) {
					const bitMask = ctx.args.big ? (
						1n << BigInt(ctx.args.flags[flag]!)
					) : (
						1 << ctx.args.flags[flag]!
					);

					// @ts-ignore
					flags |= bitMask;
				}
			} else {
				for (let flag in ctx.args.flags) {
					// @ts-ignore
					flags |= ctx.args.flags[flag]!;
				}
			}
		}

		return ctx.size(ctx.args.type, flags);
	},

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
			withNewPacket(raw, () => {
				invokeDataType(options.type);
			});

			writer.writeLine(`${getPacket()} = {}`);

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
			writer.writeLine(`let ${raw} = ${lit(0)};`);

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
	}
};
