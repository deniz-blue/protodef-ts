/**
 * StreamDecodeRuntime provides the shared buffer and its state
 */
export interface StreamDecodeRuntime {
	buffer: Uint8Array;
	view: DataView;
	available: number;
	offset: number;
};

/**
 * A StreamDecoderFactory is a function that creates a StreamDecoder for a specific packet type.
 * The factory is given a StreamDecodeRuntime, which provides access to the shared buffer and its state.
 * The factory returns a StreamDecoder, which is a generator that decodes a packet from the stream.
 */
export type StreamDecoderFactory<Packet = unknown> = (rt: StreamDecodeRuntime) => StreamDecoder<Packet>;

/**
 * A StreamDecoder is a generator that decodes a packet from a stream of shared bytes
 * The generator yields the number of bytes it needs to read;
 * The caller must read at least that many bytes into the shared buffer before resuming the generator.
 * When the decoding is complete, the generator returns the decoded packet.
 */
export type StreamDecoder<Packet = unknown> = Generator<number, Packet, void>;

export interface StreamDecoderDriverOptions {
	/** Initial shared buffer capacity in bytes */
	initialCapacity?: number;
	/** Compact the buffer once consumed bytes exceed this threshold */
	compactThreshold?: number;
};

/**
 * Runtime runner for generated stream decoders.
 *
 * It owns a shared append-only byte buffer and resumes the decoder generator
 * only when the requested amount of bytes is available.
 */
export class StreamDecoderDriver<Packet = unknown> implements StreamDecodeRuntime {
	buffer: Uint8Array;
	view: DataView;
	available: number = 0;
	offset: number = 0;

	private readonly factory: StreamDecoderFactory<Packet>;
	private decoder: StreamDecoder<Packet>;
	private state: IteratorResult<number, Packet>;
	private readonly compactThreshold: number;

	constructor(
		factory: StreamDecoderFactory<Packet>,
		{ initialCapacity = 4096, compactThreshold = 4096 }: StreamDecoderDriverOptions = {},
	) {
		if (!Number.isInteger(initialCapacity) || initialCapacity <= 0)
			throw new Error(`initialCapacity must be a positive integer, got ${initialCapacity}`);
		if (!Number.isInteger(compactThreshold) || compactThreshold < 0)
			throw new Error(`compactThreshold must be a non-negative integer, got ${compactThreshold}`);

		this.buffer = new Uint8Array(initialCapacity);
		this.view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
		this.compactThreshold = compactThreshold;

		this.factory = factory;
		this.decoder = this.factory(this);
		this.state = this.decoder.next();
	}

	/** Last requested missing byte count. Returns null when a packet has just completed. */
	get need(): number | null {
		return this.state.done ? null : this.state.value;
	}

	/** Appends bytes and returns all packets that can be decoded after this push. */
	push(chunk: Uint8Array): Packet[] {
		if (chunk.byteLength > 0) {
			this.ensureCapacity(chunk.byteLength);
			this.buffer.set(chunk, this.available);
			this.available += chunk.byteLength;
		}

		return this.drain();
	}

	/** Tries to decode any packets already buffered, without appending bytes. */
	drain(): Packet[] {
		const packets: Packet[] = [];
		let packetStartOffset = this.offset;

		while (true) {
			if (this.state.done) {
				packets.push(this.state.value);

				const consumed = this.offset - packetStartOffset;
				this.resetDecoder();
				packetStartOffset = this.offset;

				// A zero-byte packet type would otherwise loop forever.
				if (consumed === 0) break;
				continue;
			}

			const needed = this.state.value;
			if (!Number.isInteger(needed) || needed <= 0)
				throw new Error(`Decoder requested an invalid byte count: ${needed}`);

			if ((this.available - this.offset) < needed) break;

			this.state = this.decoder.next();
			if (this.offset > this.available)
				throw new Error("Decoder advanced beyond available bytes. Ensure requestBytes(...) covers all lookahead reads.");
		}

		this.compactIfNeeded();
		return packets;
	}

	private resetDecoder() {
		this.decoder = this.factory(this);
		this.state = this.decoder.next();
	}

	private ensureCapacity(extra: number) {
		const required = this.available + extra;
		if (required <= this.buffer.byteLength) return;

		// Always compact before growth to reuse consumed space first.
		this.compact(true);
		if (required <= this.buffer.byteLength) return;

		let nextCapacity = this.buffer.byteLength;
		while (nextCapacity < required)
			nextCapacity *= 2;

		const nextBuffer = new Uint8Array(nextCapacity);
		nextBuffer.set(this.buffer.subarray(0, this.available), 0);
		this.buffer = nextBuffer;
		this.view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
	}

	private compactIfNeeded() {
		if (this.offset === 0) return;
		if (this.offset >= this.compactThreshold || this.offset > (this.buffer.byteLength >> 1)) {
			this.compact(true);
		}
	}

	private compact(force: boolean) {
		if (this.offset === 0) return;
		if (!force && this.offset < this.compactThreshold) return;

		if (this.offset === this.available) {
			this.offset = 0;
			this.available = 0;
			return;
		}

		const unread = this.available - this.offset;
		this.buffer.copyWithin(0, this.offset, this.available);
		this.offset = 0;
		this.available = unread;
	}
}
