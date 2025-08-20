import type { DataTypeImplementation } from "../../proto/datatype.js";
import type { ProtoDef } from "../../types.js";

export const Switch: DataTypeImplementation<any, ProtoDef.Native.SwitchArgs> = {
    read: (ctx) => {
        let discriminant = ctx.args.compareToValue ?? ctx.getValue(ctx.args.compareTo);

        if (ctx.args.fields[discriminant] !== undefined) {
            ctx.value = ctx.read(ctx.args.fields[discriminant]);
        } else if(ctx.args.default !== undefined) {
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
};
