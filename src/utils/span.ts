import type { ProtoDef } from "../types.js";

let level = 0;
const indent = 4;

export const dbgDataType = (ty: ProtoDef.DataType) => {
    return Array.isArray(ty) ? ty[0] : ty;
};

export const enterSpan = (...log: any[]) => {
    if(log.length) console.log("|".padEnd(level*indent, " "), ...log);
    level++;
};

export const logSpan = (...log: any[]) => {
    console.log("|".padEnd(level*indent, " "), ...log);
};

export const leaveSpan = (...log: any[]) => {
    level--;
    if(log.length) console.log("|".padEnd(level*indent, " "), ...log);
};
