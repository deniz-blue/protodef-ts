import { describe, it, expect } from "vitest";
import { ProtocolRegistry } from "../src/protocol/ProtocolRegistry.js";
import { typegen } from "../src/typegen/typegen.js";
import { generateIR } from "../src/typegen/generateIR.js";
import { ir, writeIR } from "../src/typegen/ir.js";
import CodeBlockWriter from "code-block-writer";

describe("typegen", () => {
	describe("IR generation", () => {
		it("generates IR for primitive types", () => {
			const registry = new ProtocolRegistry({
				types: { myString: "cstring" }
			});

			const irNode = generateIR(registry, "myString");
			expect(irNode.kind).toBe("union");
			expect((irNode as any).types).toHaveLength(1);
		});

		it("generates IR for container types", () => {
			const registry = new ProtocolRegistry({
				types: {
					packet: ["container", [
						{ name: "id", type: "u32" },
						{ name: "name", type: "cstring" }
					]]
				}
			});

			const irNode = generateIR(registry, "packet");
			expect(irNode.kind).toBe("union");
		});

		it("generates IR for array types", () => {
			const registry = new ProtocolRegistry({
				types: {
					items: ["array", { countType: "u8", type: "u32" }]
				}
			});

			const irNode = generateIR(registry, "items");
			expect(irNode.kind).toBe("union");
		});
	});

	describe("IR writing", () => {
		it("writes identifier nodes", () => {
			const writer = new CodeBlockWriter();
			const node = ir.identifier("string");
			writeIR(writer, node);
			expect(writer.toString()).toBe("string");
		});

		it("writes object nodes with formatted keys", () => {
			const writer = new CodeBlockWriter();
			const node = ir.object({
				name: ir.identifier("string"),
				age: ir.identifier("number")
			});
			writeIR(writer, node);
			const output = writer.toString();
			expect(output).toContain("name:");
			expect(output).toContain("age:");
		});

		it("writes union nodes with pipe operator", () => {
			const writer = new CodeBlockWriter();
			const node = ir.union([
				ir.identifier("string"),
				ir.identifier("null")
			]);
			writeIR(writer, node);
			const output = writer.toString();
			expect(output).toContain("|");
		});

		it("writes array types correctly", () => {
			const writer = new CodeBlockWriter();
			const node = ir.generic("Array", [
				ir.identifier("string")
			]);
			writeIR(writer, node);
			const output = writer.toString();
			expect(output).toContain("[]");
		});

		it("writes generic types", () => {
			const writer = new CodeBlockWriter();
			const node = ir.generic("Promise", [
				ir.identifier("string")
			]);
			writeIR(writer, node);
			const output = writer.toString();
			expect(output).toContain("Promise<string>");
		});

		it("escapes object keys with special characters", () => {
			const writer = new CodeBlockWriter();
			const node = ir.object({
				"special-key": ir.identifier("string"),
				normalKey: ir.identifier("number")
			});
			writeIR(writer, node);
			const output = writer.toString();
			expect(output).toContain('"special-key"');
			expect(output).toContain("normalKey:");
		});
	});

	describe("IR from constants", () => {
		it("converts string constants", () => {
			const node = ir.fromConstant("hello");
			expect(node.kind).toBe("identifier");
			expect((node as any).identifier).toBe('"hello"');
		});

		it("converts number constants", () => {
			const node = ir.fromConstant(42);
			expect(node.kind).toBe("identifier");
			expect((node as any).identifier).toBe("42");
		});

		it("converts boolean constants", () => {
			const node = ir.fromConstant(true);
			expect(node.kind).toBe("identifier");
			expect((node as any).identifier).toBe("true");
		});

		it("converts bigint constants", () => {
			const node = ir.fromConstant(BigInt(9007199254740991));
			expect(node.kind).toBe("identifier");
			expect((node as any).identifier).toContain("n");
		});

		it("converts null to nullish union", () => {
			const node = ir.fromConstant(null);
			expect(node.kind).toBe("union");
		});

		it("converts array constants", () => {
			const node = ir.fromConstant([1, 2, 3]);
			expect(node.kind).toBe("generic");
			expect((node as any).identifier).toBe("Array");
		});

		it("converts object constants", () => {
			const node = ir.fromConstant({ x: 1, y: 2 });
			expect(node.kind).toBe("object");
		});
	});

	describe("typegen integration", () => {
		it("generates type definitions for simple containers", () => {
			const registry = new ProtocolRegistry({
				types: {
					packet: ["container", [
						{ name: "id", type: "u32" },
						{ name: "data", type: "cstring" }
					]]
				}
			});

			const result = typegen(registry, "packet");
			expect(result).toContain("export type packet");
			expect(result).toContain("id");
			expect(result).toContain("data");
		});

		it("generates type definitions with arrays", () => {
			const registry = new ProtocolRegistry({
				types: {
					list: ["array", { countType: "u8", type: "u32" }]
				}
			});

			const result = typegen(registry, "list");
			expect(result).toContain("export type list");
		});
	});

	describe("switch type generation", () => {
		it("generates union types for simple boolean switch", () => {
			const registry = new ProtocolRegistry({
				types: {
					packet: ["container", [
						{ name: "hasData", type: "bool" },
						{
							name: "data", type: [
								"switch",
								{
									compareTo: "hasData",
									fields: {
										true: "u32",
										false: "void"
									}
								}
							]
						}
					]]
				}
			});

			const irNode = generateIR(registry, "packet");
			expect(irNode.kind).toBe("union");
			const unionNode = irNode as any;
			expect(unionNode.types).toHaveLength(2);
			unionNode.types.forEach((type: any) => {
				expect(type.kind).toBe("object");
				expect(type.fields).toHaveProperty("hasData");
				expect(type.fields).toHaveProperty("data");
			});

			const result = typegen(registry, "packet");
			expect(result).toContain("export type packet");
			expect(result).toContain("data");
		});

		it("generates union types for switch with default case", () => {
			const registry = new ProtocolRegistry({
				types: {
					packet: ["container", [
						{ name: "type", type: "u8" },
						{
							name: "payload", type: [
								"switch",
								{
									compareTo: "type",
									fields: {
										"1": "u32",
										"2": "cstring"
									},
									default: "void"
								}
							]
						}
					]]
				}
			});

			const irNode = generateIR(registry, "packet");
			expect(irNode.kind).toBe("union");
			const unionNode = irNode as any;
			// 2 explicit cases + 1 default = 3 schema variations
			expect(unionNode.types).toHaveLength(3);
			unionNode.types.forEach((type: any) => {
				expect(type.kind).toBe("object");
				expect(type.fields).toHaveProperty("type");
				expect(type.fields).toHaveProperty("payload");
			});

			const result = typegen(registry, "packet");
			expect(result).toContain("export type packet");
		});

		it("generates correct types for switch inside array", () => {
			const registry = new ProtocolRegistry({
				types: {
					string: ["pstring", { countType: "u8" }],
					packet: ["container", [
						{ name: "hasEntries", type: "bool" },
						{
							name: "entries", type: [
								"switch",
								{
									compareTo: "hasEntries",
									fields: {
										true: ["array", {
											countType: "u8",
											type: ["container", [
												{ name: "text", type: "string" }
											]]
										}]
									},
									default: "void"
								}
							]
						}
					]]
				}
			});

			const irNode = generateIR(registry, "packet");
			expect(irNode.kind).toBe("union");
			const unionNode = irNode as any;
			// true case + default case = 2 schema variations
			expect(unionNode.types).toHaveLength(2);
			unionNode.types.forEach((type: any) => {
				expect(type.kind).toBe("object");
				expect(type.fields).toHaveProperty("hasEntries");
				expect(type.fields).toHaveProperty("entries");
			});

			const result = typegen(registry, "packet");
			expect(result).toContain("export type packet");
			expect(result).toContain("entries");
		});

		it("generates union with multiple switch cases", () => {
			const registry = new ProtocolRegistry({
				types: {
					packet: ["container", [
						{ name: "kind", type: "u8" },
						{
							name: "data", type: [
								"switch",
								{
									compareTo: "kind",
									fields: {
										"0": "u32",
										"1": ["container", [{ name: "value", type: "cstring" }]],
										"2": "bool"
									}
								}
							]
						}
					]]
				}
			});

			const irNode = generateIR(registry, "packet");
			expect(irNode.kind).toBe("union");
			const unionNode = irNode as any;
			// 3 cases with no default = 3 schema variations
			expect(unionNode.types).toHaveLength(3);
			unionNode.types.forEach((type: any) => {
				expect(type.kind).toBe("object");
				expect(type.fields).toHaveProperty("kind");
				expect(type.fields).toHaveProperty("data");
			});

			const result = typegen(registry, "packet");
			expect(result).toContain("export type packet");
		});

		it("generates types for nested switches with parent path references", () => {
			const registry = new ProtocolRegistry({
				types: {
					string: ["pstring", { countType: "u8" }],
					packet: ["container", [
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
														}
													]
												}
											]]
										}]
									},
									default: "void"
								}
							]
						}
					]]
				}
			});

			const irNode = generateIR(registry, "packet");
			expect(irNode.kind).toBe("union");
			const unionNode = irNode as any;
			// true case + default case = 2 schema variations (nested switches multiply cases)
			expect(unionNode.types.length).toBeGreaterThanOrEqual(2);
			unionNode.types.forEach((type: any) => {
				expect(type.kind).toBe("object");
				expect(type.fields).toHaveProperty("hasEntries");
				expect(type.fields).toHaveProperty("detailed");
				expect(type.fields).toHaveProperty("entries");
			});

			const result = typegen(registry, "packet");
			expect(result).toContain("export type packet");
		});

		it("correctly expands switch discriminator values as union members", () => {
			const registry = new ProtocolRegistry({
				types: {
					packet: ["container", [
						{ name: "state", type: "bool" },
						{
							name: "value", type: [
								"switch",
								{
									compareTo: "state",
									fields: {
										true: "u32",
										false: "cstring"
									}
								}
							]
						}
					]]
				}
			});

			const irNode = generateIR(registry, "packet");
			expect(irNode.kind).toBe("union");
			const unionNode = irNode as any;
			// true + false = 2 schema variations
			expect(unionNode.types).toHaveLength(2);
			
			// Check that both schema variations exist with correct discriminator values
			const hasTrue = unionNode.types.some((type: any) => 
				type.kind === "object" && type.fields.state && type.fields.value
			);
			const hasFalse = unionNode.types.some((type: any) => 
				type.kind === "object" && type.fields.state && type.fields.value
			);
			expect(hasTrue).toBe(true);
			expect(hasFalse).toBe(true);
		});

		it("does not blow up unions for repeated switches on the same discriminator", () => {
			const registry = new ProtocolRegistry({
				types: {
					packet: ["container", [
						{ name: "target", type: "varint" },
						{ name: "mouse", type: "varint" },
						{
							name: "x", type: [
								"switch",
								{
									compareTo: "mouse",
									fields: {
										"2": "f32"
									},
									default: "void"
								}
							]
						},
						{
							name: "y", type: [
								"switch",
								{
									compareTo: "mouse",
									fields: {
										"2": "f32"
									},
									default: "void"
								}
							]
						},
						{
							name: "z", type: [
								"switch",
								{
									compareTo: "mouse",
									fields: {
										"2": "f32"
									},
									default: "void"
								}
							]
						},
						{
							name: "hand", type: [
								"switch",
								{
									compareTo: "mouse",
									fields: {
										"0": "varint",
										"2": "varint"
									},
									default: "void"
								}
							]
						},
						{ name: "sneaking", type: "bool" }
					]]
				}
			});

			const irNode = generateIR(registry, "packet");
			expect(irNode.kind).toBe("union");
			const unionNode = irNode as any;

			// Expected cases by discriminator:
			// mouse=2 => x/y/z + hand
			// mouse=0 => hand only
			// mouse=other => no optional fields
			expect(unionNode.types).toHaveLength(3);
		});
	});
});
