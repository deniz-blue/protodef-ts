import { importNativeTypes, NativeDataTypes } from "../native/index.js";
import type { ProtoDef } from "../types.js";
import type { DataTypeImplementation } from "./datatype.js";

export interface ProtocolNamespace {
    types: Map<string, ProtoDef.DataType>;
};

const splitNamespacePath = (path: string): [string, string] => {
    const arr = path.split(".");
    const name = arr.pop() || "";
    const namespace = arr.join(".");
    return [namespace, name];
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
        protocol?: ProtoDef.Protocol;
    } = {}) {
        this._processProtocol(protocol || (noStd ? {} : { types: importNativeTypes }));

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

    size<Packet>(path: string, packet: Packet): number {
        throw new Error("abstract method not implemented");
    }
    read(path: string, buffer: ArrayBuffer) {
        throw new Error("abstract method not implemented");
    }
    write<Packet>(path: string, packet: Packet, buffer: ArrayBuffer) {
        throw new Error("abstract method not implemented");
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

    createVisitor<TReturn, TFnArgs extends any[]>({
        visitNative,
    }: {
        visitNative: <ImplArgs>(visitCtx: {
            impl: DataTypeImplementation<ImplArgs>;
            args: ImplArgs;
            visit: (ty: ProtoDef.DataType, ...args: TFnArgs) => TReturn;
        }) => TReturn;
    }) {
        const visit = (
            dataType: ProtoDef.DataType,
            namespace: string,
            ...args: TFnArgs
        ): TReturn => {
            const [typeName, typeArgs] = Array.isArray(dataType) ? dataType : [dataType];

            const innerType = this.namespaces.get(namespace)?.get(typeName)
                || this.namespaces.get("")?.get(typeName);

            if (!innerType) throw new Error(`Unknown type '${typeName}'`);

            if (innerType == "native" || innerType[0] == "native") {
                const impl = this.natives.get(typeName);
                if(!impl) throw new Error(`Implementation of Native DataType '${typeName}' not found`);
                return visitNative({
                    impl,
                    args: typeArgs,
                    visit(ty, ...args) {
                        return visit(ty, namespace, ...args);
                    },
                });
            } else {
                return visit(innerType, namespace, ...args);
            }
        };

        return visit;
    }
};
