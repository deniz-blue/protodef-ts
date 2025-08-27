import type { DataTypeImplementation } from "../../proto/datatype.js";
import type { ProtoDef } from "../../types.js";
import { iife, switchStmt } from "../../utils/code.js";

export const Switch: DataTypeImplementation<any, ProtoDef.Native.SwitchArgs> = {
    read: (ctx) => {
        let discriminant = ctx.args.compareToValue ?? ctx.getValue(ctx.args.compareTo);

        if (ctx.args.fields[discriminant] !== undefined) {
            ctx.value = ctx.read(ctx.args.fields[discriminant]);
        } else if (ctx.args.default !== undefined) {
            ctx.value = ctx.read(ctx.args.default);
        } else {
            throw `Value '${discriminant}' switched to nothing`;
        }
    },

    write: (ctx, value) => {
        let discriminant = ctx.args.compareToValue ?? ctx.getValue(ctx.args.compareTo);
        let type = ctx.args.fields[discriminant] ?? ctx.args.default;
        if (type === undefined) throw `Value '${discriminant}' switched to nothing`;
        ctx.write(type, value);
    },

    size: (ctx, value) => {
        let discriminant = ctx.args.compareToValue ?? ctx.getValue(ctx.args.compareTo);
        let type = ctx.args.fields[discriminant] ?? ctx.args.default;
        if (type === undefined) throw `Value '${discriminant}' switched to nothing`;
        return ctx.size(type, value);
    },

    getChildDataTypes: (args) => [
        ...Object.values(args.fields),
        args.default,
    ].filter(x => !!x),

    codegenSize(ctx) {
        return iife(switchStmt(
            ctx.args.compareToValue ?? ctx.getFieldReference(ctx.args.compareTo),
            Object.fromEntries(Object.entries(ctx.args.fields).map(([k, v]) => (
                [k, `return ${ctx.inline(v)}`]
            ))),
            ctx.args.default ? `return ${ctx.inline(ctx.args.default)}` : undefined,
        ))
    },

    codegenWrite(ctx) {
        return switchStmt(
            ctx.args.compareToValue ?? ctx.getFieldReference(ctx.args.compareTo),
            Object.fromEntries(Object.entries(ctx.args.fields).map(([k, v]) => (
                [k, `${ctx.inline(v)}`]
            ))),
            ctx.args.default ? `${ctx.inline(ctx.args.default)}` : undefined,
        ).join("\n");
    },

    codegenRead(ctx) {
        return iife(switchStmt(
            ctx.args.compareToValue ?? ctx.getFieldReference(ctx.args.compareTo),
            Object.fromEntries(Object.entries(ctx.args.fields).map(([k, v]) => (
                [k, `${ctx.inline(v)}`]
            ))),
            ctx.args.default ? `${ctx.inline(ctx.args.default)}` : undefined,
        ))
    },
};
