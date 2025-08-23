import type { ProtoDef } from "../../types.js";
import type { IOContext } from "./io.js";

export interface InterpretedDataTypeImpl<TValue, TArgs = any> {
    read: (ctx: ImplReadContext<TArgs, TValue>) => void;
    write: (ctx: ImplWriteContext<TArgs>, value: TValue) => void;
    size: (ctx: ImplSizeContext<TArgs>, value: TValue) => number;
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
