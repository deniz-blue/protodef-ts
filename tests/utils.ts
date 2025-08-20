import { expect } from "vitest";
import type { Protocol } from "../src/proto/Protocol.js";

export const testWriteRead = <P>(
    proto: Protocol,
    path: string,
    packet: P,
    expectedBuffer: ArrayBuffer,
    noAssertReRead?: boolean,
) => {
    const size = proto.size(path, packet);
    expect(size).toBe(expectedBuffer.byteLength);
    const buffer = new ArrayBuffer(size);
    proto.write(path, packet, buffer);
    expect(buffer).deep.eq(expectedBuffer);
    const read = proto.read(path, buffer);
    if(!noAssertReRead) expect(read).deep.eq(packet);
};
