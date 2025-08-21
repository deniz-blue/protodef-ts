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

export interface ImplReadContext<Args, T> extends ImplContext<Args>, IOContext {
    value?: T;
    read: <R>(type: ProtoDef.DataType, key?: string | number) => R;
};

export interface ImplWriteContext<Args> extends ImplContext<Args>, IOContext {
    write: <W>(type: ProtoDef.DataType, value: W, key?: string | number) => void;
};

export interface ImplSizeContext<Args> extends ImplContext<Args> {
    size: <S>(type: ProtoDef.DataType, value: S, key?: string | number) => number;
};

export interface DataTypeImplementation<T, Args = any> {
    read: (ctx: ImplReadContext<Args, T>) => void;
    write: (ctx: ImplWriteContext<Args>, value: T) => void;
    size: (ctx: ImplSizeContext<Args>, value: T) => number;
    
    // Experimental
    
    getChildDataTypes?: (args: Args) => ProtoDef.DataType[];
};
