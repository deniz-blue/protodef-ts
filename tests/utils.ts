import { expect } from "vitest";
import type { Protocol } from "../src/proto/Protocol.js";

export const roundtrip = <Packet>({
	proto,
	expectBuffer,
	packet,
	type,
	annotate,
}: {
	annotate: (a: string) => void,
	proto: Protocol,
	type: string,
	packet: Packet,
	expectBuffer: Uint8Array,
}) => {
	let size: number;
	let buffer: Uint8Array;
	let read: any;

	try {
		size = proto.size(type, packet);
		expect(size).toBe(expectBuffer.byteLength);
	} catch (e) {
		annotate(JSON.stringify(packet, null, 2));
		annotate("const encodedSize = " + proto.generateEncodedSizeCode(type));
		throw e;
	}

	try {
		buffer = new Uint8Array(size);
		proto.write(type, packet, buffer);
		expect(buffer).deep.eq(expectBuffer);
	} catch (e) {
		annotate(JSON.stringify(packet, null, 2));
		annotate("const encoder = " + proto.generateEncoderCode(type));
		throw e;
	}

	try {
		read = proto.read(type, buffer);
		expect(read).deep.eq(packet);
	} catch (e) {
		annotate(JSON.stringify(packet, null, 2));
		annotate("const decoder = " + proto.generateDecoderCode(type));
		throw e;
	}
};

export const testWriteRead = <P>(
	proto: Protocol,
	path: string,
	packet: P,
	expectedBuffer: Uint8Array,
	noAssertReRead?: boolean,
) => {
	let size: number;
	let buffer: Uint8Array;
	let read: any;

	try {
		size = proto.size(path, packet);
		expect(size).toBe(expectedBuffer.byteLength);
	} catch (e) {
		console.error("Size error, code:");
		console.error(proto.generateEncodedSizeCode(path));
		throw e;
	}

	try {
		buffer = new Uint8Array(size);
		proto.write(path, packet, buffer);
		expect(buffer).deep.eq(expectedBuffer);
	} catch (e) {
		console.error("Write error, code:");
		console.error(proto.generateEncoderCode(path));
		throw e;
	}

	try {
		read = proto.read(path, buffer);
		if (!noAssertReRead) expect(read).deep.eq(packet);
	} catch (e) {
		console.error("Read error, code:");
		console.error(proto.generateDecoderCode(path));
		throw e;
	}
};
