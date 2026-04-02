import type { Codec } from "../codec.js";
import NativeCodecs from "../codecs/index.js";

export interface ProtocolRegistryOptions {
	natives?: Record<string, Codec<unknown>>;
	noStd?: boolean;
	types?: ProtoDef.Protocol;
}

export class ProtocolRegistry {
	natives: Record<string, Codec<unknown>> = {};
	types: ProtoDef.Protocol = {};
	noStd: boolean = false;

	constructor({
		natives,
		types,
		noStd,
	}: ProtocolRegistryOptions = {}) {
		this.types = types || {};
		this.noStd = noStd || false;

		if (noStd !== true) {
			for (let [k, v] of Object.entries(NativeCodecs)) {
				this.types[k] = "native";
				this.natives[k] = v;
			}
		}

		for (let [k, v] of Object.entries(natives || {})) {
			this.natives[k] = v;
			this.types[k] = "native";
		}
	}
};
