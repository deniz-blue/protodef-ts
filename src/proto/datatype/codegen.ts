import type { ProtoDef } from "../../types.js";

export interface CodegenDataTypeImpl<TArgs> {
    codegenRead?: (ctx: ImplCodegenContext<TArgs>) => string | { pre?: string; value: string; post?: string; };
    codegenWrite?: (ctx: ImplCodegenContext<TArgs>) => string;
    codegenSize?: (ctx: ImplCodegenContext<TArgs>) => string;
};

export interface ImplCodegenContext<TArgs> {
    args: TArgs;
    vars: ICodegenVars;
    inline: (type: ProtoDef.DataType) => string;
    getFieldReference: (path: string) => string;
    throw: (s: string) => string;
};

export interface ICodegenVars {
    packet: string;
    value: string;
    buffer: string;
    view: string;
    offset: string;
    textEncoder: string;
    textDecoder: string;
    textByteLength: string;
};
