import type { ProtoDef } from "../types.js";

export type IO = {
    offset: number;
    buffer: ArrayBuffer;
};

export interface IOContext {
    io: IO;
};

export interface ImplContext<Args> {
    args: Args;
    getValue: <T>(path: string) => T;
};

export interface ImplReadContext<Args> extends ImplContext<Args>, IOContext {
    read: <T>(type: ProtoDef.DataType, key?: string) => T;
};

export interface ImplWriteContext<Args> extends ImplContext<Args>, IOContext {
    write: <T>(type: ProtoDef.DataType, value: T, key?: string) => void;
};

export interface ImplSizeContext<Args> extends ImplContext<Args> {
    size: <T>(type: ProtoDef.DataType, value: T, key?: string) => number;
};

export interface DataTypeImplementation<T, Args = any> {
    read: (ctx: ImplReadContext<Args>) => T;
    write: (ctx: ImplWriteContext<Args>, value: T) => void;
    size: (ctx: ImplSizeContext<Args>, value: T) => number;
};
