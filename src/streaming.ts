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
