import type { DataTypeImplementation } from "../../proto/datatype.js";
import type { ProtoDef } from "../../types.js";

export const container: DataTypeImplementation<{ [k: string]: any }, ProtoDef.Native.ContainerArgs> = {
    read: (ctx) => {
        ctx.value = {};

        for (let field of ctx.args) {
            let read = ctx.read<object>(field.type, field.anon ? undefined : field.name);
            if (field.anon) {
                ctx.value = {
                    ...ctx.value,
                    ...read,
                };
            } else {
                ctx.value[field.name] = read;
            }
        }
    },

    write: (ctx, value) => {
        for (let field of ctx.args) {
            ctx.write(field.type, field.anon ? value : value[field.name], field.anon ? undefined : field.name);
        }
    },

    size: (ctx, value) => {
        let size = 0;
        for (let field of ctx.args) {
            size += ctx.size(field.type, field.anon ? value : value[field.name], field.anon ? undefined : field.name);
        }
        return size;
    },

    getChildDataTypes: (args) => args.map(x => x.type),
};
