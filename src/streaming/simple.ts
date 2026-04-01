import type { StreamDecoder, StreamDecoderFactory, StreamDecodeRuntime } from "../streaming.js";
import { BaseRuntime } from "./base.js";

export interface SimpleRuntimeOptions {
	/** Initial shared buffer capacity in bytes */
	initialCapacity?: number;
};

export class SimpleRuntime<Packet = unknown> extends BaseRuntime {
	#decoder: StreamDecoder<Packet>;
	#state: IteratorResult<number, Packet>;

	constructor(
		public factory: StreamDecoderFactory<Packet>,
		{ initialCapacity = 4096 }: SimpleRuntimeOptions = {},
	) {
		super(initialCapacity);
		this.#decoder = this.factory(this);
		this.#state = this.#decoder.next();
	}

	requestedByteAmount = () => this.#state.done ? 0 : this.#state.value;

	hasPartialPacket = () => !this.#state.done;
	isIdle = () => this.#state.done;
	hasBytes = () => (this.available - this.offset) > 0;

	/**
	 * Decodes the available bytes into a list of packets.
	 * The runtime's buffer is compacted after each packet is decoded to remove consumed bytes.
	 * @returns An array of fully decoded packets.
	 */
	decode(): Packet[] {
		const packets: Packet[] = [];
		let packetStartOffset = this.offset;

		while (true) {
			if (this.#state.done) {
				packets.push(this.#state.value);
				this.shrinkBuffer();

				const consumed = this.offset - packetStartOffset;
				this.#decoder = this.factory(this);
				this.#state = this.#decoder.next();
				packetStartOffset = this.offset;

				continue;
			}

			const needed = this.#state.value;
			if (!Number.isInteger(needed) || needed <= 0)
				throw new Error(`Invalid byte request: ${needed}`);

			if ((this.available - this.offset) < needed) break;

			this.#state = this.#decoder.next();
			if (this.offset > this.available)
				throw new Error("Offset exceeded available bytes");
		}

		return packets;
	}
}
