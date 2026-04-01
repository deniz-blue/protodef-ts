import type { StreamDecodeRuntime } from "../streaming.js";

export abstract class BaseRuntime implements StreamDecodeRuntime {
	buffer: Uint8Array;
	view: DataView;
	available: number = 0;
	offset: number = 0;

	constructor(initialCapacity: number = 4096) {
		this.buffer = new Uint8Array(initialCapacity);
		this.view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
	}

	/**
	 * Appends a chunk of bytes to the runtime's buffer, growing the buffer if necessary.
	 * @param chunk The chunk of bytes to append to the runtime's buffer.
	 */
	push(chunk: Uint8Array): void {
		if (!chunk.byteLength) return;
		this.growBuffer(chunk.byteLength);
		this.buffer.set(chunk, this.available);
		this.available += chunk.byteLength;
	}

	/**
	 * Grows the buffer if necessary to accommodate additional bytes.
	 * @param additionalBytes The number of additional bytes needed to accommodate new data.
	 */
	growBuffer(additionalBytes: number): void {
		const requiredCapacity = this.available + additionalBytes;
		if (requiredCapacity <= this.buffer.byteLength) return;

		let newCapacity = this.buffer.byteLength * 2;
		while (newCapacity < requiredCapacity) {
			newCapacity *= 2;
		}

		const newBuffer = new Uint8Array(newCapacity);
		newBuffer.set(this.buffer);
		this.buffer = newBuffer;
		this.view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
	}

	/**
	 * Compacts the buffer by removing consumed bytes and shifting remaining bytes to the start.
	 */
	shrinkBuffer(): void {
		if (this.offset === 0) return;
		if (this.offset >= this.available) {
			this.available = 0;
			this.offset = 0;
			return;
		}

		this.buffer.copyWithin(0, this.offset, this.available);
		this.available -= this.offset;
		this.offset = 0;
	}
}
