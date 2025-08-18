import type { DataTypeImplementation } from "../../proto/datatype.js";
import type { ProtoDef } from "../../types.js";

export const bitflags: DataTypeImplementation<ProtoDef.Native.Bitflags, ProtoDef.Native.BitflagsArgs> = {
    read: (ctx) => {
        const source = ctx.read<number | bigint>(ctx.args.type);

        const value: ProtoDef.Native.Bitflags = {
            _value: source,
        };

        if (Array.isArray(ctx.args.flags)) {
            for (let i = 0; i < ctx.args.flags.length; i++) {
                const flag = ctx.args.flags[i]!;
                const bitMask = ctx.args.big ? (1n << BigInt(i)) : (1 << i);
                value[flag] = ((source as any) & (bitMask as any) as any) === bitMask;
            }
        } else {
            if (ctx.args.shift) {
                for (let flag in ctx.args.flags) {
                    const bitMask = ctx.args.big ? (
                        1n << BigInt(ctx.args.flags[flag]!)
                    ) : (
                        1 << ctx.args.flags[flag]!
                    );

                    value[flag] = ((source as any) & (bitMask as any) as any) === bitMask;
                }
            } else {
                for (let flag in ctx.args.flags) {
                    value[flag] = ((source as any) & (ctx.args.flags[flag]! as any) as any) === ctx.args.flags[flag]!;
                }
            }
        }

        return value;
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
};
