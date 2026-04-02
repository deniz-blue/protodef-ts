import CodeBlockWriter from "code-block-writer";
import { ProtocolRegistry } from "../protocol/ProtocolRegistry.js";
import { generateIR } from "./generateIR.js";
import { writeIR } from "./ir.js";

export const typegen = (reg: ProtocolRegistry, targetTypeId: string) => {
	const ir = generateIR(reg, targetTypeId);
	const writer = new CodeBlockWriter();
	writer.write(`export type ${targetTypeId} = `);
	return writeIR(writer, ir).toString();
};

console.log(typegen(new ProtocolRegistry({
	types: {
		string: "cstring",
		packet: ["container", [
			{ name: "documentName", type: "string" },
			{ name: "hasEntries", type: "bool" },
			{ name: "detailed", type: "bool" },
			{
				name: "entries", type: [
					"switch",
					{
						compareTo: "hasEntries",
						fields: {
							true: ["array", {
								countType: "u8",
								type: ["container", [
									{ name: "text", type: "string" },
									{
										name: "detailText", type: [
											"switch",
											{
												compareTo: "../detailed",
												fields: {
													true: "string",
												},
												default: "void",
											},
										]
									},
								]]
							}]
						},
						default: "void",
					},
				]
			},
		]]
	},
}), "packet"));

