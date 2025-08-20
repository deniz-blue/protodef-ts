import { expect } from "vitest";
import type { Protocol } from "../src/proto/Protocol.js";

export const testWriteRead = <P>(
    proto: Protocol,
    path: string,
    packet: P,
    expectedBytes: number[],
    noAssertReRead?: boolean,
) => {
    const size = proto.size(path, packet);
    expect(size).toBe(expectedBytes.length);
    const buffer = new ArrayBuffer(size);
    proto.write(path, packet, buffer);
    expect([...new Uint8Array(buffer)]).deep.eq(expectedBytes);
    const read = proto.read(path, buffer);
    if(!noAssertReRead) expect(read).deep.eq(packet);
};
