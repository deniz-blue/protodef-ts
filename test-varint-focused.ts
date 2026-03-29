import { Protocol } from "./src/proto/Protocol.js";

console.log("Creating protocol...");
const proto = new Protocol({
  types: { test: "varint" }
});

console.log("Testing first case: 0");
const testCases = [
  [0, new Uint8Array([0x00])],
  [2, new Uint8Array([0x02])],
];

for (let i = 0; i < testCases.length; i++) {
  const [value, expectedBuffer] = testCases[i];
  console.log(`\nTest case ${i + 1}: ${value}`);
  
  try {
    // Encode
    const buffer = new Uint8Array(10);
    proto.write("varint", value, buffer);
    console.log("Encoded:", Array.from(buffer.slice(0, expectedBuffer.length)));
    
    // Check
    if (buffer[0] === expectedBuffer[0]) {
      console.log("✓ Encoding correct");
    } else {
      console.log("✗ Encoding mismatch");
    }
    
    // Decode
    console.log("Decoding...");
    const decoded = proto.read("varint", expectedBuffer);
    console.log("Decoded:", decoded);
    
    if (decoded === value) {
      console.log("✓ Roundtrip successful");
    } else {
      console.log("✗ Roundtrip failed");
    }
  } catch (e) {
    console.log("✗ Error:", e.message);
  }
}

console.log("\nDone!");
