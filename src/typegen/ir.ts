import type CodeBlockWriter from "code-block-writer";

export namespace IRNode {
	export type Identifier = { kind: "identifier"; identifier: string };
	export type Object = { kind: "object"; fields: Record<string, IRNode> };
	export type Generic = { kind: "generic"; identifier: string; parameters: IRNode[] };
	export type Union = { kind: "union"; types: IRNode[] };
}

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
				if (Array.isArray(value)) return this.generic("Array", [this.union(value.map(v => this.fromConstant(v)))]);
				return this.object(Object.fromEntries(Object.entries(value).map(([k, v]) => [k, this.fromConstant(v)])));
			default:
				throw new Error(`Unsupported constant type: ${typeof value}`);
		}
	}
};

// IR Writers - separated for SRP and OCP
type IRWriter = (writer: CodeBlockWriter, node: IRNode) => void;

const writeIdentifier: IRWriter = (writer, node) => {
	writer.write((node as IRNode.Identifier).identifier);
};

const writeObject: IRWriter = (writer, node) => {
	const obj = node as IRNode.Object;
	writer.inlineBlock(() => {
		for (const [key, value] of Object.entries(obj.fields)) {
			const formattedKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
			writer.write(`${formattedKey}: `);
			writeIR(writer, value);
			writer.write(";").newLine();
		}
	});
};

const writeGeneric: IRWriter = (writer, node) => {
	const generic = node as IRNode.Generic;
	if (generic.identifier === "Array" && generic.parameters.length === 1) {
		writer.write("(");
		writeIR(writer, generic.parameters[0]!);
		writer.write(")[]");
	} else {
		writer.write(generic.identifier);
		if (generic.parameters.length > 0) {
			writer.write("<");
			generic.parameters.forEach((param, i) => {
				if (i > 0) writer.write(", ");
				writeIR(writer, param);
			});
			writer.write(">");
		}
	}
};

const writeUnion: IRWriter = (writer, node) => {
	const union = node as IRNode.Union;
	writer.write("(");
	union.types.forEach((type, i) => {
		if (i > 0) writer.write(" | ");
		writeIR(writer, type);
	});
	writer.write(")");
};

const writers: Record<IRNode["kind"], IRWriter> = {
	identifier: writeIdentifier,
	object: writeObject,
	generic: writeGeneric,
	union: writeUnion,
};

export const writeIR = (writer: CodeBlockWriter, node: IRNode): CodeBlockWriter => {
	const writeNode = writers[node.kind];
	if (!writeNode) throw new Error(`Unhandled IR node kind: ${(node as any).kind}`);
	writeNode(writer, node);
	return writer;
};
