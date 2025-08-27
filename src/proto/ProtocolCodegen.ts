import type { ProtoDef } from "../types.js";
import type { ICodegenVars, ImplCodegenContext } from "./datatype/codegen.js";
import { Protocol } from "./Protocol.js";

const relativeToAbsolutePath = (path: string, absoluteBase: (string | number)[]) => {
    const pathSegments = path.split("/").filter(Boolean);
    const currentPath = [...absoluteBase];
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

    return currentPath;
};

const getFieldReferenceFn = (rootRef: string, basePath: (string | number)[]) => {
    return (refPath: string) => {
        const abs = relativeToAbsolutePath(refPath, basePath);
        let pstr = rootRef;
        for (let c of abs) {
            if (typeof c == "string") {
                pstr += ".";
                pstr += c;
            } else {
                pstr += "[";
                pstr += c;
                pstr += "]";
            }
        }
        return pstr;
    };
};

const defaultCodegenVars: ICodegenVars = {
    buffer: "buffer",
    offset: "offset",
    packet: "packet",
    textByteLength: "textByteLength",
    textDecoder: "textDecoder",
    textEncoder: "textEncoder",
    value: "value",
    view: "dataView",
};

const concatCode = (s: string | { pre?:string;value:string;post?:string }) => {
    if(typeof s == "string") return s;
    return [s.pre, s.value, s.post].filter(x => !!x).join("\n");
};

export class ProtocolCodegen extends Protocol {
    codegenSize(path: string) {
        const [namespace, name, type] = this.resolveDataType(path);
        return this.codegenSizeInline(type == "native" ? name : type, namespace);
    }

    codegenSizeInline = this.createVisitor({
        visitNative({ impl, args, visit }): string {
            const vars: ICodegenVars = {
                ...defaultCodegenVars,
            };

            const ctx: ImplCodegenContext<typeof args> = {
                args,
                vars,
                getFieldReference: getFieldReferenceFn(vars.packet, []),
                inline: (type, valueReference) => {
                    return visit(type);
                },
                throw(s) {
                    return `(throw ${s})`;
                },
            };

            return impl.codegenSize?.(ctx) ?? "";
        },
    });

    codegenWrite(path: string) {
        const [namespace, name, type] = this.resolveDataType(path);
        return this.codegenWriteInline(type == "native" ? name : type, namespace);
    }

    codegenWriteInline = this.createVisitor({
        visitNative({ impl, args, visit }): string {
            const vars: ICodegenVars = {
                ...defaultCodegenVars,
            };

            const ctx: ImplCodegenContext<typeof args> = {
                args,
                vars,
                getFieldReference: getFieldReferenceFn(vars.packet, []),
                inline: (type, valueReference) => {
                    return visit(type);
                },
                throw(s) {
                    return `(throw ${s})`;
                },
            };

            return impl.codegenWrite?.(ctx) ?? "";
        },
    });

    codegenRead(path: string) {
        const [namespace, name, type] = this.resolveDataType(path);
        return this.codegenReadInline(type == "native" ? name : type, namespace);
    }

    codegenReadInline = this.createVisitor({
        visitNative({ impl, args, visit }): string {
            const vars: ICodegenVars = {
                ...defaultCodegenVars,
            };

            const ctx: ImplCodegenContext<typeof args> = {
                args,
                vars,
                getFieldReference: getFieldReferenceFn(vars.packet, []),
                inline: (type, valueReference) => {
                    return visit(type);
                },
                throw(s) {
                    return `(throw ${s})`;
                },
            };

            let o = impl.codegenRead?.(ctx) || "";
            if(typeof o == "string") return o;
            return [
                o.pre,
                o.value,
                o.post,
            ].filter(x => !!x).join("\n");
        },
    });
};
