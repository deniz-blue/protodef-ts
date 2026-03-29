import type { StreamDecoder, StreamDecoderFactory, StreamDecodeRuntime } from "../streaming.js";

export interface StreamDecoderDriverOptions {
	/** Initial shared buffer capacity in bytes */
	initialCapacity?: number;
};

export class StreamDecoderDriver<Packet = unknown> implements StreamDecodeRuntime {
	buffer: Uint8Array;
	view: DataView;
	available: number = 0;
	offset: number = 0;

	private decoder: StreamDecoder<Packet>;
	private state: IteratorResult<number, Packet>;

	constructor(
		public factory: StreamDecoderFactory<Packet>,
		{ initialCapacity = 4096 }: StreamDecoderDriverOptions = {},
	) {
		this.buffer = new Uint8Array(initialCapacity);
		this.view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);

		this.decoder = this.factory(this);
		this.state = this.decoder.next();
	}

	push(chunk: Uint8Array): void {
		if (!chunk.byteLength) return;
		this.ensureCapacity(chunk.byteLength);
		this.buffer.set(chunk, this.available);
		this.available += chunk.byteLength;
	}

	isIncomplete() {
		return this.requestedByteAmount() !== 0 && (this.available - this.offset) > 0;
	}

	requestedByteAmount() {
		return this.state.done ? 0 : this.state.value;
	}

	decode(): Packet[] {
		const packets: Packet[] = [];
		let packetStartOffset = this.offset;

		while (true) {
			if (this.state.done) {
				packets.push(this.state.value);
				this.compact();

				const consumed = this.offset - packetStartOffset;
				this.decoder = this.factory(this);
				this.state = this.decoder.next();
				packetStartOffset = this.offset;
				
				continue;
			}

			const needed = this.state.value;
			if (!Number.isInteger(needed) || needed <= 0)
				throw new Error(`Invalid byte request: ${needed}`);

			if ((this.available - this.offset) < needed) break;

			this.state = this.decoder.next();
			if (this.offset > this.available)
				throw new Error("Offset exceeded available bytes");
		}

		return packets;
	}

	private ensureCapacity(extra: number) {
		const required = this.available + extra;
		if (required <= this.buffer.byteLength) return;

		this.compact();
		if (required <= this.buffer.byteLength) return;

		let nextCapacity = this.buffer.byteLength;
		while (nextCapacity < required)
			nextCapacity *= 2;

		const nextBuffer = new Uint8Array(nextCapacity);
		nextBuffer.set(this.buffer.subarray(0, this.available), 0);
		this.buffer = nextBuffer;
		this.view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
	}

	/** Compact the buffer, used after each successful decode */
	compact() {
		if (this.offset === 0) return;

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
