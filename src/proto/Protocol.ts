import type { ProtoDef } from "../types.js";
import type { DataTypeImplementation } from "./datatype.js";

export class Protocol {
    natives: Map<string, DataTypeImplementation<any>> = new Map();
    dataTypes: Map<string, ProtoDef.DataType> = new Map();
    protocol: ProtoDef.Protocol = {};

    constructor({
        natives,
        protocol,
    }: {
        natives?: Record<string, DataTypeImplementation<any>>;
        protocol: ProtoDef.Protocol;
    }) {
        this.protocol = protocol;

        this._processProtocol(this.protocol);

        for(let [k,v] of Object.entries(natives || {}))
            this.natives.set(k, v);
    }

    private _processProtocol(protocol: ProtoDef.Protocol) {
        for(let k in protocol) {
            if(k == "types") {
                
            } else {
                
            }
        }
    }

    resolveDataType(type: ProtoDef.DataType) {
        
    }
};
