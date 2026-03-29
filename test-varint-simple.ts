import { Protocol } from "./src/proto/Protocol.js";

const proto = new Protocol({
  types: { test: "varint" }
});

console.log("Testing varint encode/decode...");

const testCases = [
  [0, [0x00]],
  [2, [0x02]],
  [127, [0x7f]],
  [128, [0x80, 0x01]],
  [-1, [0xff, 0xff, 0xff, 0xff, 0x0f]],
];

for (const [value, expectedBytes] of testCases) {
  try {
    // Encode
    const buffer = new Uint8Array(10);
    proto.write("varint", value, buffer);
    const actualBytes = Array.from(buffer);
    
    console.log(`✓ Encoded ${value}:`, actualBytes);
    
    // Decode
    const decoded = proto.read("varint", new Uint8Array(expectedBytes));
    console.log(`  Decoded:`, decoded);
    
  } catch (error) {
    console.log(`✗ Failed for value ${value}:`, error.message);
  }
}
