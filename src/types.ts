export namespace ProtoDef {
    export type ProtocolTypes = {
        types?: Partial<Record<string, DataType>>;
    };

    export type ProtocolNamespace = {
        [namespace: string]: Protocol;
    };

    export type Protocol = ProtocolTypes & ProtocolNamespace;

    export type GenericDataType<TName, TArgs = never> = TArgs extends never ? (
        TName
    ) : (
            [TName, TArgs]
        );

    export type DataType = Native.DataType | AnyDataType;
    export type AnyDataType = (string & {}) | [(string & {}), any];
    export type ImplementedDataType = "native";
};

export namespace ProtoDef.Native {
    export type UnitType = "bool" | "cstring" | "void";

    export type SwitchArgs = { compareTo: string; compareToValue?: any; fields: Record<string, DataType>; default?: DataType };
    export type IntArgs = { size: number };
    export type ArrayArgs = { type: DataType; countType: DataType; count?: string };
    export type ContainerArgs = { name: string; type: DataType; anon?: boolean }[];
    export type CountArgs = { type: DataType; countFor: string };
    export type PStringArgs = { countType: DataType; count?: string; encoding?: string };
    export type BufferArgs = { countType: DataType; count?: string; rest?: boolean };
    export type BitfieldArgs = { name: string; size: number; signed: boolean }[];
    export type MapperArgs = { type: DataType; mappings: Record<string, any> };

    export type Bitflags = {
        // TODO: fix...
        [k: string]: boolean | number | bigint | undefined;
        _value?: number | bigint;
    };

    export type BitflagsArgs = {
        type: string;
        flags: string[] | { [flag: string]: bigint };
        big: true;
        shift?: boolean;
    } | {
        type: string;
        flags: string[] | { [flag: string]: number };
        big?: false;
        shift?: boolean;
    };

    export type NumericType =
        | `${"i" | "u"}${"8" | "16" | "32" | "64"}`
        | `f${"32" | "64"}`
        | "varint"
        | "varint64"
        | "varint128"
        | "zigzag32"
        | "zigzag64"
        ;

    export type DataType =
        // Conditional
        | ["switch", SwitchArgs]
        | ["option", DataType]
        // Numeric
        | NumericType
        | ["int", IntArgs]
        | [NumericType, any]
        // Primitives
        | UnitType
        | [UnitType, any]
        // Structures
        | ["array", ArrayArgs]
        | ["container", ContainerArgs]
        | ["count", CountArgs]
        // Utils
        | ["pstring", PStringArgs]
        | ["buffer", BufferArgs]
        | ["bitfield", BitfieldArgs]
        | ["mapper", MapperArgs]
        | ["bitflags", BitflagsArgs]
        ;
};



