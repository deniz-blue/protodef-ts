import type { Codec, Context, DecoderContext, EncodedSizeContext, EncoderContext, PathSegment } from "./codec.js";
import NativeCodecs from "../native/index.js";
import CodeBlockWriter from "code-block-writer";

const globalTextDecoder = new TextDecoder();
const globalTextEncoder = new TextEncoder();
export const globalTextByteLength = (str: string) => {
	let s = str.length;
	for (let i = str.length - 1; i >= 0; i--) {
		let code = str.charCodeAt(i);
		if (code > 0x7f && code <= 0x7ff) s++;
		else if (code > 0x7ff && code <= 0xffff) s += 2;
		if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
	}
	return s;
};

const textEncoderVariable = "textEncoder";
const textDecoderVariable = "textDecoder";
const textByteLengthVariable = "textByteLength";

const compile = (code: string) => {
	return eval(code)({
		[textDecoderVariable]: globalTextDecoder,
		[textEncoderVariable]: globalTextEncoder,
		[textByteLengthVariable]: globalTextByteLength,
	});
};

export class ProtocolGenerator {
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
		let path: PathSegment[] = [{ value: root, type: "object" }];

		const getPacket = () => packet;
		const getPath = () => [...path];

		const withNewPacket = (newPacket: string, lifetime: () => void, segment?: PathSegment) => {
			const oldPacket = packet;
			packet = newPacket;
			if (segment !== undefined) path.push(segment);
			lifetime();
			packet = oldPacket;
			if (segment !== undefined) path.pop();
		};

		const resolveRelativePath = (relativePath: string) => {
			const segments = relativePath.split("/").filter(Boolean).filter(s => s !== ".");

			let path = [...getPath()];
			path.pop();
			for (const segment of segments) {
				if (segment == "..") {
					let removed;
					do {
						removed = path.pop();
					} while (removed?.type == "array");
				} else {
					path.push({ value: segment, type: "object" });
				};
			}

			return path[0]?.value + path.slice(1).map(s => s.type == "array" ? `[${s.value}]` : `.${s.value}`).join("");
		};

		// == Temp vars ==

		let temporaryVariables: Set<string> = new Set();

		const withTempVar = (hint: string, lifetime: (variable: string) => void) => {
			let variable = hint;
			let i = 0;
			while (temporaryVariables.has(variable)) variable = `${hint}${i++}`;
			temporaryVariables.add(variable);
			writer.writeLine(`// withTempVar: ${variable}`);
			lifetime(variable);
		};

		// == Context ==

		const create = (options: unknown) => {
			const invokeDataType = (type: ProtoDef.DataType) => {
				const [id, options] = typeof type === "string" ? [type, null] : type;
				const newCtx = create(options);

				if (id in this.natives) {
					writer.writeLine(`// < ${id} >`);
					onCodecInvoke(this.natives[id]!, newCtx);
					writer.writeLine(`// </ ${id} >`).blankLine();
				} else if (id in this.types)
					invokeDataType(this.types[id]!);
				else writer.writeLine(`throw new Error("Unknown data type: ${id}")`);
			};

			const ctx = {
				...base,
				options,
				invokeDataType,
				getPath,
				getPacket,
				resolveRelativePath,
				withNewPacket,
				withTempVar,
			} as Context<unknown>;

			return ctx as any as Ctx;
		};

		return create;
	}

	/** Generates function string for decoding packets */
	generateDecoderCode(type: ProtoDef.DataType) {
		const writer = new CodeBlockWriter();

		const root: string = "packet";
		let buffer: string = "buffer";
		let offset: string = "offset";
		let view: string = "view";

		const vars = {
			buffer,
			offset,
			view,
			textDecoder: textDecoderVariable,
		};

		const factory = this.createContextFactory<DecoderContext<unknown>>(
			writer,
			vars,
			(codec, ctx) => codec.decoder(writer, ctx),
			root
		);

		const ctx = factory(null);

		writer.write(`(({ ${textDecoderVariable}, ${textByteLengthVariable} }) => (function __decoder__(${buffer}) `).inlineBlock(() => {
			writer
				.writeLine(`let ${root} = {}`)
				.writeLine(`let ${offset} = 0`)
				.writeLine(`let ${view} = new DataView(${buffer}.buffer)`)
				.blankLine();

			ctx.invokeDataType(type);

			writer
				.blankLine()
				.writeLine(`return ${root}`);
		}).write(`))`);

		return writer.toString();
	}

	/** Generates function string for encoding packets */
	generateEncoderCode(type: ProtoDef.DataType) {
		const writer = new CodeBlockWriter();

		const root: string = "packet";
		let buffer: string = "buffer";
		let offset: string = "offset";
		let view: string = "view";

		const vars = {
			buffer,
			offset,
			view,
			textEncoder: textEncoderVariable,
			textByteLength: textByteLengthVariable,
		};

		const factory = this.createContextFactory<EncoderContext<unknown>>(
			writer,
			vars,
			(codec, ctx) => codec.encoder(writer, ctx),
			root
		);

		const ctx = factory(null);

		writer.write(`(({ ${textEncoderVariable}, ${textByteLengthVariable} }) => (function __encoder__(${root}, ${buffer}) `).inlineBlock(() => {
			writer
				.writeLine(`let ${offset} = 0`)
				.writeLine(`let ${view} = new DataView(${buffer}.buffer)`)
				.blankLine()

			ctx.invokeDataType(type);

			writer
				.blankLine()
				.writeLine(`return ${buffer}`);
		}).write(`))`);

		return writer.toString();
	}

	/** Generates function string for calculating encoded size */
	generateEncodedSizeCode(type: ProtoDef.DataType) {
		const writer = new CodeBlockWriter();

		const root: string = "packet";
		let size: string = "size";

		const vars = {
			size,
			textEncoder: textEncoderVariable,
			textByteLength: textByteLengthVariable,
		};

		const factory = this.createContextFactory<EncodedSizeContext<unknown>>(
			writer,
			vars,
			(codec, ctx) => codec.encodedSize(writer, ctx),
			root
		);

		const ctx = factory(null);

		writer.write(`(({ ${textByteLengthVariable}, ${textEncoderVariable} }) => (function __encodedSize__(${root}) `).inlineBlock(() => {
			writer
				.writeLine(`let ${size} = 0`)
				.blankLine()

			ctx.invokeDataType(type);

			writer
				.blankLine()
				.writeLine(`return ${size}`);
		}).write(`))`);

		return writer.toString();
	}

	generateEncoderFunction(type: ProtoDef.DataType) {
		try {
			return compile(this.generateEncoderCode(type)) as (packet: unknown, buffer: Uint8Array) => Uint8Array;
		} catch (e) {
			console.error("Error generating encoder function:", e);
			console.error("Generated code was:", this.generateEncoderCode(type));
			throw e;
		}
	}

	generateDecoderFunction(type: ProtoDef.DataType) {
		try {
			return compile(this.generateDecoderCode(type)) as (buffer: Uint8Array) => unknown;
		} catch (e) {
			console.error("Error generating decoder function:", e);
			console.error("Generated code was:", this.generateDecoderCode(type));
			throw e;
		}
	}

	generateEncodedSizeFunction(type: ProtoDef.DataType) {
		try {
			return compile(this.generateEncodedSizeCode(type)) as (packet: unknown) => number;
		} catch (e) {
			console.error("Error generating encoded size function:", e);
			console.error("Generated code was:", this.generateEncodedSizeCode(type));
			throw e;
		}
	}
};
