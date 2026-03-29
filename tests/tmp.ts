import { Protocol } from "../src/protocol/Protocol.js";

const protocol = new Protocol({
	types: {
		"doc": ["container", [
			{ name: "field1", type: "u8" },
			{ name: "field2", type: "u8" },
		]],
		
		"test1": "cstring",
	},
});

console.log(`const decoder = ` + protocol.generateStreamDecoderCode("test1"))

