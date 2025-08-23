export const iife = (lines: string[]) => {
    return `(() => {\n${lines.map(x => "\t"+x).join("\n")}\n})()`;
};
