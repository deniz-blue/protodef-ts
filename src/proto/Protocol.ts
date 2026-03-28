import type { Codec, Context, DecoderContext, EncoderContext } from "./codec.js";
import NativeCodecs from "../native/index.js";
import CodeBlockWriter from "code-block-writer";

export class Protocol {
	natives: Record<string, Codec<unknown>> = {};
	types: ProtoDef.Protocol = {};

	constructor({
		natives,
		types,
		noStd,
	}: {
		natives?: Record<string, Codec<unknown>>;
		noStd?: boolean;
		types?: ProtoDef.Protocol;
	} = {}) {
		this.types = types || {};

		if (noStd !== true)
			for (let [k, v] of Object.entries(NativeCodecs))
				this.natives[k] = v;

		for (let [k, v] of Object.entries(natives || {}))
			this.natives[k] = v;
	}

	createContextFactory<Ctx extends Context<unknown>>(
		writer: CodeBlockWriter,
		base: Omit<Ctx, keyof Context<unknown>>,
		onCodecInvoke: (codec: Codec<unknown>, ctx: Ctx) => void,
		root: string = "packet",
	) {
		// == Packeting ==

		let packet: string = root;

		const getPacket = () => packet;

		const withNewPacket = (newPacket: string, lifetime: () => void) => {
			const oldPacket = packet;
			packet = newPacket;
			lifetime();
			packet = oldPacket;
		};

		const resolveRelativePath = (relativePath: string) => {
			writer.writeLine(`// Unimplemented yet: ${relativePath}`);
			return JSON.stringify(relativePath);
		};

		// == Temp vars ==

		let temporaryVariables: Set<string> = new Set();

		const withTempVar = (hint: string, lifetime: (variable: string) => void) => {
			let variable = hint;
			let i = 0;
			while (temporaryVariables.has(variable)) variable = `${hint}${i++}`;
			temporaryVariables.add(variable);
			lifetime(variable);
			temporaryVariables.delete(variable);
		};

		// == Context ==

		const create = (options: unknown) => {
			const invokeDataType = (type: ProtoDef.DataType) => {
				const [id, options] = typeof type === "string" ? [type, null] : type;
				const newCtx = create(options);
				if (id in this.natives)
					onCodecInvoke(this.natives[id]!, newCtx);
				else if (id in this.types)
					invokeDataType(this.types[id]!);
			};

			const ctx = {
				...base,
				options,
				invokeDataType,

				getPacket,
				resolveRelativePath,
				withNewPacket,
				withTempVar,
			} as Context<unknown>;

			return ctx as any as Ctx;
		};

		return create;
	}

	generateDecoderCode(type: ProtoDef.DataType) {
		const writer = new CodeBlockWriter();

		const root: string = "packet";
		let buffer: string = "buffer";
		let offset: string = "offset";
		let view: string = "view";
		let textDecoder: string = "textDecoder";

		const vars = {
			buffer,
			offset,
			textDecoder,
			view,
		};

		const factory = this.createContextFactory<DecoderContext<unknown>>(
			writer,
			vars,
			(codec, ctx) => codec.decoder(writer, ctx),
			root
		);

		const ctx = factory(null);

		writer.write(`((${buffer}) => `).inlineBlock(() => {
			writer
				.writeLine(`let ${root} = {}`)
				.writeLine(`let ${offset} = 0`)
				.writeLine(`let ${view} = new DataView(${buffer})`)
				.writeLine(`let ${textDecoder} = new TextDecoder()`)
				.blankLine()

			ctx.invokeDataType(type);
		}).write(`)`);

		return writer.toString();
	}

	generateEncoderCode(type: ProtoDef.DataType) {
		const writer = new CodeBlockWriter();

		const root: string = "packet";
		let buffer: string = "buffer";
		let offset: string = "offset";
		let view: string = "view";
		let textEncoder: string = "textEncoder";

		const vars = {
			buffer,
			offset,
			textEncoder,
			view,
		};

		const factory = this.createContextFactory<EncoderContext<unknown>>(
			writer,
			vars,
			(codec, ctx) => codec.encoder(writer, ctx),
			root
		);

		const ctx = factory(null);

		writer.write(`((${root}, ${buffer}) => `).inlineBlock(() => {
			writer
				.writeLine(`let ${offset} = 0`)
				.writeLine(`let ${view} = new DataView(${buffer})`)
				.writeLine(`let ${textEncoder} = new TextEncoder()`)
				.blankLine()

			ctx.invokeDataType(type);
		}).write(`)`);

		return writer.toString();
	}
};
