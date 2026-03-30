import type { StreamDecoderFactory } from "../streaming.js";
import { SimpleRuntime } from "./simple.js";

export interface DecodeTransformOptions {
	/**
	 * If false (default), flushing with unread trailing bytes throws.
	 * If true, trailing bytes are ignored.
	 */
	allowIncompleteOnFlush?: boolean;
};

/**
 * Creates a Web TransformStream that decodes Uint8Array chunks into packets.
 */
export const createDecodeTransform = <Packet = unknown>(
	factory: StreamDecoderFactory<Packet>,
	options: DecodeTransformOptions = {},
): TransformStream<Uint8Array, Packet> => {
	const { allowIncompleteOnFlush = false, ...driverOptions } = options;
	const driver = new SimpleRuntime(factory, driverOptions);

	return new TransformStream<Uint8Array, Packet>({
		transform(chunk, controller) {
			driver.push(chunk);
			for (const packet of driver.decode()) {
				controller.enqueue(packet);
			}
		},
		flush(controller) {
			for (const packet of driver.decode()) {
				controller.enqueue(packet);
			}

			if (!allowIncompleteOnFlush && driver.isIncomplete())
				throw new Error("Stream ended with an incomplete packet");
		},
	});
};
