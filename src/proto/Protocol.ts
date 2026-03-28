import { ProtocolGenerator } from "./ProtocolGenerator.js";

export class Protocol extends ProtocolGenerator {
	size<Packet>(type: ProtoDef.DataType, packet: Packet): number {
		return this.generateEncodedSizeFunction(type)(packet);
	}

	write<Packet>(type: ProtoDef.DataType, packet: Packet, buffer: Uint8Array): void {
		this.generateEncoderFunction(type)(packet, buffer);
	}

	read<Packet>(type: ProtoDef.DataType, buffer: Uint8Array): Packet {
		return this.generateDecoderFunction(type)(buffer) as Packet;
	}
};
