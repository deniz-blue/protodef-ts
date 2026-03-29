import { Protocol } from "./src/proto/Protocol.js";

const proto = new Protocol({
  types: { test: "varint" }
});

const encoderCode = proto.generateEncoderCode("varint");
console.log("=== VARINT ENCODER CODE ===");
console.log(encoderCode);

// Extract the bounds check line
const lines = encoderCode.split('\n');
const boundsCheckLine = lines.find(line => line.includes('VarInt out of bounds'));
console.log("\n=== BOUNDS CHECK LINE ===");
console.log(boundsCheckLine);

// Try to extract the min/max values
const match = boundsCheckLine?.match(/if \(packet < (.+?) \|\| packet > (.+?)\)/);
if (match) {
  console.log("\nMin value:", match[1]);
  console.log("Max value:", match[2]);
}

// Test encoding 2147483647
try {
  const data = new Uint8Array(10);
  proto.write("varint", 2147483647, data);
  console.log("\n✓ Successfully encoded 2147483647");
} catch (e) {
  console.log("\n✗ Failed to encode 2147483647:", e.message);
}

// Test encoding -2147483648
try {
  const data = new Uint8Array(10);
  proto.write("varint", -2147483648, data);
  console.log("✓ Successfully encoded -2147483648");
} catch (e) {
  console.log("✗ Failed to encode -2147483648:", e.message);
}
