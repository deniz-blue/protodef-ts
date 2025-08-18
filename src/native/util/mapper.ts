import type { DataTypeImplementation } from "../../proto/datatype.js";
import type { ProtoDef } from "../../types.js";

export const mapper: DataTypeImplementation<any, ProtoDef.Native.MapperArgs> = {
    read: (ctx) => {
        let source = String(ctx.read(ctx.args.type));
        let value = ctx.args.mappings[source];

        if (!value) throw `Value '${source}' is not mapped to anything, can't read`;

        return value;
    },

    write: (ctx, value) => {
        let mapped = Object.entries(ctx.args.mappings)
            .find(([k, v]) => v == value)
            ?.[0];

        if (!mapped) throw `Value '${value}' is not mapped to anything, can't write`;

        ctx.write(ctx.args.type, mapped);
    },

    size: (ctx, value) => ctx.size(ctx.args.type, value),
};
