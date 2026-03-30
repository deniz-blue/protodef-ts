import type { StreamDecoderFactory } from "../streaming.js";
import { ProtocolGenerator } from "./ProtocolGenerator.js";

export class Protocol extends ProtocolGenerator {
	cache: Map<string, {
		size: (packet: any) => number,
		encode: (packet: any, buffer: Uint8Array) => void,
		decode: (buffer: Uint8Array) => any,
		streamDecoder: StreamDecoderFactory<any>,
	}> = new Map();

	compile(type: string) {
		if (this.cache.has(type)) return this.cache.get(type)!;

		const sizeFn = this.compileFunction<(packet: any) => number>(this.generateEncodedSizeCode(type));
		const encodeFn = this.compileFunction<(packet: any, buffer: Uint8Array) => void>(this.generateEncoderCode(type));
		const decodeFn = this.compileFunction<(buffer: Uint8Array) => any>(this.generateDecoderCode(type));
		const streamDecoderFn = this.compileFunction<StreamDecoderFactory<any>>(this.generateStreamDecoderCode(type));

		this.cache.set(type, {
			size: sizeFn,
			encode: encodeFn,
			decode: decodeFn,
			streamDecoder: streamDecoderFn,
		});

		return this.cache.get(type)!;
	}

	size<Packet>(type: string, packet: Packet): number {
		return this.compile(type).size(packet);
	}

	write<Packet>(type: string, packet: Packet, buffer: Uint8Array): void {
		this.compile(type).encode(packet, buffer);
	}

	read<Packet>(type: string, buffer: Uint8Array): Packet {
		return this.compile(type).decode(buffer) as Packet;
	}

	streamDecoder<Packet>(type: string) {
		return this.compile(type).streamDecoder as StreamDecoderFactory<Packet>;
	}
};
