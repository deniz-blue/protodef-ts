import type { ProtoDef } from "../types.js";
import type { CodegenDataTypeImpl } from "./datatype/codegen.js";
import type { InterpretedDataTypeImpl } from "./datatype/interpreted.js";

export interface DataTypeImplementation<TValue, TArgs = any>
    extends InterpretedDataTypeImpl<TValue, TArgs>, CodegenDataTypeImpl<TArgs> {
    
    // Experimental
    getChildDataTypes?: (args: TArgs) => ProtoDef.DataType[];
};

