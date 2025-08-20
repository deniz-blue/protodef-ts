import { NativeDataTypes } from "../native/index.js";
import type { ProtoDef } from "../types.js";
import { dbgDataType, enterSpan, leaveSpan, logSpan } from "../utils/span.js";
import type { DataTypeImplementation, ImplReadContext, ImplSizeContext, ImplWriteContext, IO, IOContext } from "./datatype.js";

export interface ProtocolNamespace {
    types: Map<string, ProtoDef.DataType>;
};

const splitNamespacePath = (path: string): [string, string] => {
    const arr = path.split(".");
    const name = arr.pop() || "";
    const namespace = arr.join(".");
    return [namespace, name];
};

const getValueFrom = <P, T>(
    packet: P,
    path: string,
    dataTypePath: (string | number)[]
): T => {
    const pathSegments = path.split("/").filter(Boolean);
    const currentPath = [...dataTypePath];
    currentPath.pop();

    for (let segment of pathSegments) {
        if (segment == "..") {
            let removed;
            do {
                removed = currentPath.pop();
                // skip arrays
            } while(typeof removed == "number");
        } else {
            currentPath.push(segment);
        };
    }

    let value: any = packet;
    for (const segment of currentPath) {
        value = value?.[segment];
    }

    return value as T;
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

    resolveDataType(path: string): [string, string, ProtoDef.DataType] {
        if (!path) throw new Error(`path cannot be an empty string`);
        const [namespaceKey, name] = splitNamespacePath(path);
        const namespace = this.namespaces.get(namespaceKey);
        if (!namespace) throw new Error(`Unknown namespace '${namespace}' (for path '${path}')`);
        const dataType = namespace.get(name);
        if (!dataType) throw new Error(`DataType '${name}' not found in namespace '${namespaceKey}'`);
        return [namespaceKey, name, dataType];
    }

    readDataType<Packet, Output>(
        io: IO,
        dataType: ProtoDef.DataType,
        packet: Packet,
        namespace: string,
        path: (string | number)[],
    ): Output {
        const [typeName, typeArgs] = Array.isArray(dataType) ? dataType : [dataType];

        const innerType = this.namespaces.get(namespace)?.get(typeName)
            || this.namespaces.get("")?.get(typeName);

        if (!innerType) throw new Error(`Unknown type '${typeName}'`);

        let result: any = undefined;
        if (innerType == "native" || innerType[0] == "native") {
            let parent: any = packet;
            let key: string | number | undefined = path[path.length - 1];
            for (let i = 0; i < path.length - 1; i++) {
                const seg = path[i]!;
                if (parent[seg] == null || typeof parent[seg] !== "object") parent[seg] = {};
                parent = parent[seg];
            }

            const ctx: ImplReadContext<any, typeof typeArgs> = {
                io,
                args: typeArgs,
                getValue: (p) => getValueFrom(packet, p, path),
                get value() {
                    return result;
                },
                set value(v) {
                    if (key !== undefined) parent[key] = v;
                    result = v;
                },
                read: <Reading>(ty: ProtoDef.DataType, key?: string | number): Reading => {
                    enterSpan(`Reading ${dbgDataType(ty)} at offset ${io.offset}`, path);
                    let v = this.readDataType<Packet, Reading>(io, ty, packet, namespace, key !== undefined ? [...path, key] : path);
                    leaveSpan(`Read`, v, `at offset ${io.offset}`, path);
                    return v;
                },
            };

            const v = this.natives.get(typeName)!.read(ctx)!;
            result = ctx.value ?? v;
        } else {
            result = this.readDataType<Packet, Output>(
                io,
                innerType,
                packet,
                namespace,
                path,
            );
        }

        return result;
    }

    writeDataType<T, P>(
        io: IO,
        dataType: ProtoDef.DataType,
        value: T,
        packet: P,
        namespace: string,
        path: (string | number)[],
    ) {
        const [typeName, typeArgs] = Array.isArray(dataType) ? dataType : [dataType];

        const innerType = this.namespaces.get(namespace)?.get(typeName)
            || this.namespaces.get("")?.get(typeName);

        if (!innerType) throw new Error(`Unknown type '${typeName}'`);

        if (innerType == "native" || innerType[0] == "native") {
            const ctx: ImplWriteContext<typeof typeArgs> = {
                io,
                args: typeArgs,
                getValue: (p) => getValueFrom(packet, p, path),
                write: <NT>(ty: ProtoDef.DataType, v: NT, key?: string | number) => {
                    enterSpan(`Writing ${dbgDataType(ty)} at offset ${io.offset}`, path);
                    this.writeDataType<NT, P>(io, ty, v, packet, namespace, key !== undefined ? [...path, key] : path);
                    leaveSpan(`Wrote ${dbgDataType(ty)} now at offset ${io.offset}`, path);
                },
            };

            return this.natives.get(typeName)!.write(ctx, value)!;
        } else {
            this.writeDataType<T, P>(
                io,
                innerType,
                value,
                packet,
                namespace,
                path,
            );
        }
    }

    size = <P>(path: string, packet: P): number => {
        const [namespace, _, type] = this.resolveDataType(path);
        return this.sizeDataType(type, packet, packet, namespace, []);
    };

    sizeDataType<T, P>(
        dataType: ProtoDef.DataType,
        value: T,
        packet: P,
        namespace: string,
        path: (string | number)[],
    ): number {
        const [typeName, typeArgs] = Array.isArray(dataType) ? dataType : [dataType];

        const innerType = this.namespaces.get(namespace)?.get(typeName)
            || this.namespaces.get("")?.get(typeName);

        if (!innerType) throw new Error(`Unknown type '${typeName}'`);

        if (innerType == "native" || innerType[0] == "native") {
            const ctx: ImplSizeContext<typeof typeArgs> = {
                args: typeArgs,
                getValue: (p) => getValueFrom(packet, p, path),
                size: <NT>(ty: ProtoDef.DataType, v: NT, key?: string | number) => {
                    enterSpan(`SizeOf ${dbgDataType(ty)}`, path);
                    logSpan(ty);
                    let s = this.sizeDataType<NT, P>(ty, v, packet, namespace, key !== undefined ? [...path, key] : path);
                    leaveSpan(`SizeOf ${dbgDataType(ty)} is`, s, path);
                    return s;
                },
            };

            return this.natives.get(typeName)!.size(ctx, value)!;
        } else {
            return this.sizeDataType<T, P>(
                innerType,
                value,
                packet,
                namespace,
                path,
            );
        }
    }
};
