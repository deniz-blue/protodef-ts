import { ProtocolGenerator } from "./ProtocolGenerator.js";

export class Protocol extends ProtocolGenerator {
	size<Packet>(type: ProtoDef.DataType, packet: Packet): number {
		// debugger;
		const fn = this.generateEncodedSizeFunction(type);
		return fn(packet);
	}

	write<Packet>(type: ProtoDef.DataType, packet: Packet, buffer: Uint8Array): void {
		const fn = this.generateEncoderFunction(type);
		debugger;
		fn(packet, buffer);
	}

	read<Packet>(type: ProtoDef.DataType, buffer: Uint8Array): Packet {
		// debugger;
		const fn = this.generateDecoderFunction(type);
		return fn(buffer) as Packet;
	}
};
