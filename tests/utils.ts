import { expect } from "vitest";
import { Protocol } from "../src/protocol/Protocol.js";

export const roundtrip = <Packet>({
	expectBuffer,
	packet,
	type = "test",
	types,
	annotate,
}: {
	types: Record<string, ProtoDef.DataType>,
	packet: Packet,
	expectBuffer: Uint8Array,
	annotate: (a: string) => void,
	type?: string,
}) => {
	const proto = new Protocol({ types });

	let size: number;
	let buffer: Uint8Array;
	let read: any;

	annotate("Protocol definition:\n" + JSON.stringify(types, null, 2));

	annotate("const packet = " + JSON.stringify(packet, (k,v) => {
		if (typeof v === "bigint") return v.toString() + "n";
		return v;
	}, 2));
	annotate("const encodedSize = " + proto.generateEncodedSizeCode(type));
	annotate("const encoder = " + proto.generateEncoderCode(type));
	annotate("const decoder = " + proto.generateDecoderCode(type));

	size = proto.size(type, packet);
	expect(size).toBe(expectBuffer.byteLength);

	buffer = new Uint8Array(size);
	proto.write(type, packet, buffer);
	expect(buffer).deep.eq(expectBuffer);

	read = proto.read(type, buffer);
	expect(read).deep.eq(packet);
};
