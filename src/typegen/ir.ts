import type CodeBlockWriter from "code-block-writer";

export namespace IRNode {
	// { kind: "identifier"; type: "string" | "number" | "boolean" | "bigint" | "symbol" | "undefined" | "null" }
	export type Identifier = { kind: "identifier"; identifier: string };

	export type Object = { kind: "object"; fields: Record<string, IRNode> };

	// { kind: "generic"; name: "Array"; typeArgs: [ IRNode (element type) ] }
	export type Generic = { kind: "generic"; identifier: string; parameters: IRNode[] };

	export type Union = { kind: "union"; types: IRNode[] };
};

export type IRNode = IRNode.Identifier | IRNode.Object | IRNode.Generic | IRNode.Union;

export const ir = {
	identifier: (identifier: string): IRNode.Identifier => ({ kind: "identifier", identifier }),
	object: (fields: Record<string, IRNode>): IRNode.Object => ({ kind: "object", fields }),
	generic: (identifier: string, parameters: IRNode[]): IRNode.Generic => ({ kind: "generic", identifier, parameters }),
	union: (types: IRNode[]): IRNode.Union => ({ kind: "union", types }),

	nullish: () => ir.union([ir.identifier("null"), ir.identifier("undefined")]),

	fromConstant(value: any): IRNode {
		switch (typeof value) {
			case "string":
			case "number":
			case "boolean":
				return this.identifier(JSON.stringify(value));
			case "bigint":
				return this.identifier(value.toString() + "n");
			case "undefined":
				return this.nullish();
			case "object":
				if (value === null) return this.nullish();
				if (Array.isArray(value)) return this.generic("Array", [this.union(value.map(this.fromConstant))]);
				return this.object(Object.fromEntries(Object.entries(value).map(([k, v]) => [k, this.fromConstant(v)])));
			default:
				throw new Error(`Unsupported constant type: ${typeof value}`);
		}
	}
};

export const writeIR = (writer: CodeBlockWriter, node: IRNode): CodeBlockWriter => {
	const formatKey = (key: string): string => {
		const isPretty = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
		return isPretty ? key : `"${key}"`;
	};

	switch (node.kind) {
		case "identifier": {
			writer.write(node.identifier);
			break;
		}
		case "object": {
			writer.inlineBlock(() => {
				for (const [key, value] of Object.entries(node.fields)) {
					writer.write(`${formatKey(key)}: `);
					writeIR(writer, value);
					writer.write(";")
						.newLine();
				}
			});
			break;
		}
		case "generic": {
			if (node.identifier === "Array" && node.parameters.length === 1) {
				writer.write("(");
				writeIR(writer, node.parameters[0]!);
				writer.write(")[]");
			} else {
				writer.write(node.identifier);
				if (node.parameters.length > 0) {
					writer.write("<");
					node.parameters.forEach((param, i) => {
						if (i > 0) writer.write(", ");
						writeIR(writer, param);
					});
					writer.write(">");
				}
			}
			break;
		}
		case "union": {
			writer.write("(");
			node.types.forEach((type, i) => {
				if (i > 0) writer.write(" | ");
				writeIR(writer, type);
			});
			writer.write(")");
			break;
		}
		default:
			const _exhaustiveCheck: never = node;
			throw new Error(`Unhandled IR node kind: ${(node as any).kind}`);
	}

	return writer;
};
