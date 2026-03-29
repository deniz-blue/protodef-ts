import { bench, describe } from "vitest";
import ProtoDefNode from "protodef";
import { Protocol } from "../src/proto/Protocol.js";

const types = {
	string: ["pstring", { countType: "u8" }],
	packet: ["container", [
		{ name: "documentName", type: "string" },
		{
			name: "properties", type: [
				"array",
				{
					countType: "varint",
					type: ["container", [
						{ name: "propertyName", type: "u8" },
						{ name: "propertyType", type: "string" },
						{
							name: "propertyValue",
							type: [
								"switch",
								{
									compareTo: "propertyType",
									fields: {
										"string": "string",
										"number": "i32",
										"boolean": "bool",
									},
									default: "void",
								},
							],
						},
					]],
				},
			]
		},
	]],
} as Record<string, ProtoDef.DataType>;

const exampleValue = {
	documentName: "meow",
	properties: [
		{ propertyName: "a", propertyType: "string", propertyValue: "xyz" },
		{ propertyName: "b", propertyType: "number", propertyValue: 2 },
		{ propertyName: "c", propertyType: "boolean", propertyValue: true },
	],
};

const exampleBuffer = (() => {
	const proto = new Protocol({
		types,
	});
	let buf = new Uint8Array(proto.size("packet", exampleValue));
	proto.write("packet", exampleValue, buf);
	return buf;
})();


const protoTs = new Protocol({
	types,
});

const protoTsCompiled = protoTs.compile("packet");

const protoNode = new ProtoDefNode.ProtoDef();
protoNode.addProtocol({ types } as any, []);

const protodefNodeCompiler = new ProtoDefNode.Compiler.ProtoDefCompiler();
protodefNodeCompiler.addProtocol({ types } as any, []);

const protoNodeCompiled = protodefNodeCompiler.compileProtoDefSync();

describe("size", () => {
	bench("protodef-ts", () => {
		protoTsCompiled.size(exampleValue);
	});

	bench("node-protodef", () => {
		protoNode.sizeOf(exampleValue, "packet", exampleValue);
	});

	bench("node-protodef (compiled)", () => {
		protoNodeCompiled.sizeOf(exampleValue, "packet", exampleValue);
	});
})

describe("size + write", () => {
	bench("protodef-ts", () => {
		let size = protoTsCompiled.size(exampleValue)
		let buffer = new Uint8Array(size)
		protoTsCompiled.encode(exampleValue, buffer)
	});

	bench("node-protodef", () => {
		let size = protoNode.sizeOf(exampleValue, "packet", exampleValue);
		let buffer = Buffer.allocUnsafe(size);
		protoNode.write(exampleValue, buffer, 0, "packet", exampleValue);
	});

	bench("node-protodef (compiled)", () => {
		let size = protoNodeCompiled.sizeOf(exampleValue, "packet", exampleValue);
		let buffer = Buffer.allocUnsafe(size);
		protoNodeCompiled.write(exampleValue, buffer, 0, "packet", exampleValue);
	});
})


describe("read", () => {
	bench("protodef-ts", () => {
		protoTsCompiled.decode(exampleBuffer);
	});

	bench("node-protodef", () => {
		protoNode.read(Buffer.from(exampleBuffer), 0, "packet", {});
	});

	bench("node-protodef (compiled)", () => {
		protoNodeCompiled.read(Buffer.from(exampleBuffer), 0, "packet", {});
	});
})
