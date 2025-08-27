import type { ProtoDef } from "../types.js";
import type { ImplReadContext, ImplSizeContext, ImplWriteContext } from "./datatype/interpreted.js";
import { createIO, type IO } from "./datatype/io.js";
import { Protocol } from "./Protocol.js";

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
            } while (typeof removed == "number");
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

export class ProtocolInterpreter extends Protocol {
    read = <P>(path: string, buffer: ArrayBuffer, offset?: number): P => {
        const [namespace, name, type] = this.resolveDataType(path);
        const io = createIO(buffer, offset);
        return this.readDataType(io, type == "native" ? name : type, {}, namespace, []);
    };

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
                    // enterSpan(`Reading ${dbgDataType(ty)} at offset ${io.offset}`, path);
                    let v = this.readDataType<Packet, Reading>(io, ty, packet, namespace, key !== undefined ? [...path, key] : path);
                    // leaveSpan(`Read`, v, `at offset ${io.offset}`, path);
                    return v;
                },
            };

            this.natives.get(typeName)!.read(ctx)!;
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

    write = <P>(path: string, packet: P, buffer: ArrayBuffer, offset?: number) => {
        const [namespace, name, type] = this.resolveDataType(path);
        const io = createIO(buffer, offset);
        // is packet being initialized to `null` a good idea?
        this.writeDataType(io, type == "native" ? name : type, packet, packet, namespace, []);
    };

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
                    // enterSpan(`Writing ${dbgDataType(ty)} at offset ${io.offset}`, path);
                    this.writeDataType<NT, P>(io, ty, v, packet, namespace, key !== undefined ? [...path, key] : path);
                    // leaveSpan(`Wrote ${dbgDataType(ty)} now at offset ${io.offset}`, path);
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
        const [namespace, name, type] = this.resolveDataType(path);
        return this.sizeDataType(type == "native" ? name : type, packet, packet, namespace, []);
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

        if (!innerType) throw new Error(`Unknown type '${typeName}' at path ${path.join(".")}`);

        if (innerType == "native" || innerType[0] == "native") {
            const ctx: ImplSizeContext<typeof typeArgs> = {
                args: typeArgs,
                getValue: (p) => getValueFrom(packet, p, path),
                size: <NT>(ty: ProtoDef.DataType, v: NT, key?: string | number) => {
                    // enterSpan(`SizeOf ${dbgDataType(ty)}`, path);
                    let s = this.sizeDataType<NT, P>(ty, v, packet, namespace, key !== undefined ? [...path, key] : path);
                    // leaveSpan(`SizeOf ${dbgDataType(ty)} is`, s, path);
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
