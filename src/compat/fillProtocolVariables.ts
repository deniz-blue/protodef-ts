import type { ProtoDef } from "../types.js";

export const fillProtocolVariables = (
    protocol: ProtoDef.Protocol,
    variables: Record<string, any> = {},
) => {
    const fix = (type?: ProtoDef.DataType): ProtoDef.DataType | undefined => {
        if (!type) return type;
        if (typeof type == "string") return type;

        if (type[0] == "switch") {
            const fields = { ...type[1].fields };

            for(let key in fields)
                if(key[0] == "/") {
                    fields[variables[key.slice(1)]] = fields[key];
                    delete fields[key];
                }

            return [
                type[0],
                {
                    ...type[1],
                    default: fix(type[1].default),
                    fields,
                }
            ];
        };

        if (type[0] == "array") return [
            type[0],
            {
                ...type[1],
                type: fix(type[1].type),
                countType: fix(type[1].countType),
            },
        ];

        if (type[0] == "container") return [
            type[0],
            type[1].map((field: ProtoDef.Native.ContainerArgs[number]) => ({
                ...field,
                type: fix(field.type),
            })),
        ];

        if (type[0] == "count") return [
            type[0],
            { ...type[1], type: fix(type[1].type) },
        ];

        if (type[0] == "pstring") return [
            type[0],
            { ...type[1], countType: fix(type[1].countType) },
        ];

        if (type[0] == "buffer") return [
            type[0],
            { ...type[1], countType: fix(type[1].countType) },
        ];

        if (type[0] == "mapper") return [
            type[0],
            { ...type[1], type: fix(type[1].type) },
        ];

        return type;
    };

    const obj: ProtoDef.Protocol = {};

    for (let [k, v] of Object.entries(protocol)) {
        if (k == "types") {
            obj.types = {};
            for (let type in protocol.types) {
                let fixed = fix(protocol.types[type]!)!;
                obj.types[type] = fixed;
            }
        } else {
            obj[k] = fillProtocolVariables(obj[k] as ProtoDef.Protocol);
        }
    }

    return obj;
};
