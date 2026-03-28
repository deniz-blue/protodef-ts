import { Protocol } from "../src/proto/Protocol.js";

const protocol = new Protocol({
	types: {
		"test1": ["option", "u8"],
	},
});

console.log(protocol.generateDecoderCode("test1"))
console.log(protocol.generateEncoderCode("test1"))
