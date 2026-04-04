import CodeBlockWriter from "code-block-writer";
import type { StreamDecoderFactory } from "../streaming.js";
import { ProtocolGenerator } from "./ProtocolGenerator.js";

/**
 * Wrapper around ProtocolGenerator that compiles and caches encoder, decoder, encoded size and stream decoder functions for defined data types.
 * Provides convenient methods for encoding, decoding and getting encoded size of packets without having to manually compile the functions.
 */
export class Protocol extends ProtocolGenerator {
	/** Cached compilation of functions for the specified data type */
	cache: Map<string, {
		size: (packet: any) => number,
		encode: (packet: any, buffer: Uint8Array) => void,
		decode: (buffer: Uint8Array) => any,
		streamDecoder: StreamDecoderFactory<any>,
	}> = new Map();

	/** Cached compilation of functions for the specified data type */
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

	/** Returns the encoded size of a packet of the specified type */
	size<Packet>(type: string, packet: Packet): number {
		return this.compile(type).size(packet);
	}

	/** Writes a packet of the specified type to the given buffer */
	write<Packet>(type: string, packet: Packet, buffer: Uint8Array): void {
		this.compile(type).encode(packet, buffer);
	}

	/** Reads a packet of the specified type from the given buffer */
	read<Packet>(type: string, buffer: Uint8Array): Packet {
		return this.compile(type).decode(buffer) as Packet;
	}

	/** Generates a stream decoder factory for the specified data type */
	streamDecoder<Packet>(type: string) {
		return this.compile(type).streamDecoder as StreamDecoderFactory<Packet>;
	}

	/** Generates TypeScript type definitions for all data types */
	generateAllTypeDefinitions(): string {
		const writer = new CodeBlockWriter();
		for (const typeId of Object.entries(this.types).map(([id, def]) => (typeof def === "string" && def === "native") ? null : id).filter(Boolean) as string[]) {
			writer.writeLine(this.generateTypeDefinition(typeId)).blankLine();
		}
		return writer.toString();
	}
};
