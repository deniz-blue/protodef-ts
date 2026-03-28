import { Protocol } from "../src/proto/Protocol.js";

const protocol = new Protocol({
	types: {
		"doc": ["container", [
			{ name: "field1", type: "u8" },
			{ name: "field2", type: "u8" },
		]],
		
		"test1": "cstring",
	},
});

console.log(`const decoder = ` + protocol.generateDecoderCode("test1"))
console.log(`const encoder = ` + protocol.generateEncoderCode("test1"))
console.log(`const encodedSize = ` + protocol.generateEncodedSizeCode("test1"))

