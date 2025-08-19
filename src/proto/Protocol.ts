import { NativeDataTypes } from "../native/index.js";
import type { ProtoDef } from "../types.js";
import type { DataTypeImplementation, ImplSizeContext } from "./datatype.js";

export interface ProtocolNamespace {
    types: Map<string, ProtoDef.DataType>;
};

const splitNamespacePath = (path: string): [string, string] => {
    const arr = path.split(".");
    const name = arr.pop() || "";
    const namespace = arr.join(".");
    return [namespace, name];
};

const getValueFn = <P>(packet: P, dataTypePath: string[]) => {
    return <T>(path: string): T => {
        const pathSegments = path.split("/").filter(Boolean);
        const currentPath = [...dataTypePath];
        currentPath.pop();

        for (let segment of pathSegments) {
            if (segment == "..") currentPath.pop();
            else currentPath.push(segment);
        }

        let value: any = packet;
        for (const segment of currentPath) {
            value = value?.[segment];
        }

        console.log(`getValue(${path}) @ ${dataTypePath} -> ${value}`);
        return value as T;
    };
};

export class Protocol {
    natives: Map<string, DataTypeImplementation<any>> = new Map();
    namespaces: Map<string, Map<string, ProtoDef.DataType>> = new Map();

    constructor({
        natives,
        protocol,
        noStd,
    }: {
        natives?: Record<string, DataTypeImplementation<any>>;
        noStd?: boolean;
        protocol: ProtoDef.Protocol;
    }) {
        this._processProtocol(protocol);

        if (noStd !== true)
            for (let [k, v] of Object.entries(NativeDataTypes))
                this.natives.set(k, v);

        for (let [k, v] of Object.entries(natives || {}))
            this.natives.set(k, v);
    }

    private _processProtocol(protocol: ProtoDef.Protocol, nsPath: string[] = []) {
        const nsKey = nsPath.join(".");
        if (!this.namespaces.has(nsKey)) this.namespaces.set(nsKey, new Map());
        let ns = this.namespaces.get(nsKey)!;

        for (let k in protocol) {
            if (k == "types") {
                for (let name in protocol[k])
                    ns.set(name, protocol[k]![name]!);
            } else {
                this._processProtocol(protocol[k]! as ProtoDef.Protocol, [...nsPath, k]);
            }
        }
    }

    getDataTypeOrThrow(path: string) {
        const keys = path.split(".");
        const name = keys.pop();
        if (!name) throw new Error(`path cannot be an empty string`);
        const namespaceKey = keys.join(".");
        const namespace = this.namespaces.get(namespaceKey);
        if (!namespace) throw new Error(`Unknown namespace '${namespace}' (for path '${path}')`);
        const dataType = namespace.get(name);
        if (!dataType) throw new Error(`DataType '${name}' not found in namespace '${namespaceKey}'`);
        return dataType;
    }

    readDataType() {

    }

    writeDataType() {

    }

    size = <T>(path: string, value: T) => {

    }

    test() {
        let s = this.sizeDataType(
            ["pstring", { countType: "i8" }],
            "meow",
            "meow",
            "",
            [],
        )
    }

    sizeDataType<T, P>(
        dataType: ProtoDef.DataType,
        value: T,
        packet: P,
        namespace: string,
        path: string[],
    ): number {
        // console.log(`sizeDataType()`, { dataType, value, packet, namespace, path });

        const [typeName, typeArgs] = Array.isArray(dataType) ? dataType : [dataType];

        const ctx: ImplSizeContext<any> = {
            args: typeArgs,
            getValue: getValueFn(packet, path),
            size: <NT>(ty: ProtoDef.DataType, v: NT, key?: string) => {
                console.log(`Reading ${ty}`);
                return this.sizeDataType<NT, P>(ty, v, packet, namespace, key ? [...path, key] : path);
            },
        };

        const innerType = this.namespaces.get(namespace)?.get(typeName)
            || this.namespaces.get("")?.get(typeName);

        if (!innerType) throw new Error(`Unknown type '${typeName}'`);

        if (innerType == "native" || innerType[0] == "native")
            return this.natives.get(typeName)!.size(ctx, value)!;

        return this.sizeDataType<T, P>(
            innerType,
            value,
            packet,
            namespace,
            path,
        );
    }
};
