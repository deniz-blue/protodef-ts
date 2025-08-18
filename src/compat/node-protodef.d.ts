export namespace NodeProtoDef {
    export type ReadResult<Value> = {
        value: Value,
        size: number,
    };

    export type ReadFn<Value, Args> = (
        buffer: Buffer,
        cursor: any,
        typeArgs: Args,
        rootNodes: any,
    ) => ReadResult;

    export type WriteFn<Value, Args> = (
        value: Value,
        buffer: Buffer,
        offset: any,
        typeArgs: Args,
        rootNode: any,
    ) => ReadResult;

    export type SizeOfFn<Value, Args> = (
        value: Value,
        typeArgs: Args,
        rootNode: any,
    ) => ReadResult;

    export type DataTypeFunc<Value, Args> = [
        ReadFn<Value, Args>,
        WriteFn<Value, Args>,
        SizeOfFn<Value, Args> | number,

    ];
};
