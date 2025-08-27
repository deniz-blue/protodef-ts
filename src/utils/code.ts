export const iife = (lines: string[]) => {
    return `(() => {\n${lines.join("\n").split("\n").map(line => "  " + line).join("\n")}\n})()`;
};

export const indentCode = (code: string, level = 1) => {
    const indent = "  ".repeat(level);
    return code.split("\n").map(x => `${indent}${x}`).join("\n");
};

export const switchStmt = (
    expr: string,
    cases: Record<string, string>,
    defaultCase?: string,
) => {
    let lines = [`switch(${expr}) {`];

    for (let [val, stmt] of Object.entries(cases)) {
        lines.push(indentCode(`case ${JSON.stringify(val)}:`))
        lines.push(indentCode(stmt, 2))
        lines.push(indentCode(`break`, 2))
    }

    if (defaultCase) {
        lines.push(indentCode(`default:`))
        lines.push(indentCode(defaultCase, 2))
    }

    lines.push("}");
    return lines;
};
