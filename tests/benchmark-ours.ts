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

console.log(`// == Compiler Output ==`);
console.log(protoTsCompiled.size.toString());
console.log(protoTsCompiled.encode.toString());
console.log(protoTsCompiled.decode.toString());

for (let i = 0; i < 1_000_000; i++) {
	protoTsCompiled.size(exampleValue);
	protoTsCompiled.encode(exampleValue, new Uint8Array(protoTsCompiled.size(exampleValue)));
	protoTsCompiled.decode(exampleBuffer);
}
