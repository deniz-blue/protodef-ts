export type IO = {
    offset: number;
    buffer: Uint8Array;
    view: DataView;
    encodeText: (text?: string) => Uint8Array;
    decodeText: (buf: AllowSharedBufferSource) => string;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
export const createIO = (buffer: ArrayBuffer, offset: number = 0): IO => {
    return {
        buffer: new Uint8Array(buffer),
        offset: offset ?? 0,
        view: new DataView(buffer),
        encodeText(text?: string) {
            return textEncoder.encode(text);
        },
        decodeText(buf: AllowSharedBufferSource) {
            return textDecoder.decode(buf);
        },
    };
};
