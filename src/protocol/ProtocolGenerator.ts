import type { Codec, Context, DecoderContext, EncodedSizeContext, EncoderContext, PathSegment } from "../codec.js";
import CodeBlockWriter from "code-block-writer";
import { ProtocolRegistry, type ProtocolRegistryOptions } from "./ProtocolRegistry.js";
import { generateIR } from "../typegen/generateIR.js";
import { writeIR } from "../typegen/ir.js";

const implTextDecoder = new TextDecoder();
const implTextEncoder = new TextEncoder();
const implTextByteLength = (str: string) => {
	let s = str.length;
	for (let i = str.length - 1; i >= 0; i--) {
		let code = str.charCodeAt(i);
		if (code > 0x7f && code <= 0x7ff) s++;
		else if (code > 0x7ff && code <= 0xffff) s += 2;
		if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
	}
	return s;
};

const textEncoder = "textEncoder";
const textDecoder = "textDecoder";
const textByteLength = "textByteLength";

const compile = (code: string) => {
	return eval(code)({
		[textDecoder]: implTextDecoder,
		[textEncoder]: implTextEncoder,
		[textByteLength]: implTextByteLength,
	});
};

/**
 * ProtocolGenerator is the main class of this library.
 * It provides methods for generating encoder, decoder, encoded size and stream decoder functions as well as TypeScript type definitions for the defined data types.
 */
export class ProtocolGenerator extends ProtocolRegistry {
	/**
	 * If true, the generated code will contain comments indicating the current data type being processed and the temporary variables being used.
	 * This can be useful for debugging but will make the generated code larger. Default is false.
	 */
	debug: boolean = false;

	constructor({
		debug,
		...opts
	}: ProtocolRegistryOptions & {
		/** See {@link ProtocolGenerator.debug} */
		debug?: boolean;
	} = {}) {
		super(opts);

		this.debug = debug || false;
	}

	/**
	 * Internal method to create context factory for code generation.
	 * This is used to create the context objects that are passed to codecs during code generation.
	 * Keeps track of the current packet variable, path and temporary variables, and provides utility methods for codecs to use during code generation.
	 * @param writer Writer to use for generating code
	 * @param base Extra properties to be included in the context object passed to codecs
	 * @param onCodecInvoke Callback function that will be called whenever a codec is invoked during code generation
	 * @param root Packet variable name, default is "packet"
	 * @returns A function that creates context object
	 */
	createContextFactory<Ctx extends Context<unknown>>(
		writer: CodeBlockWriter,
		base: Omit<Ctx, keyof Context<unknown>>,
		onCodecInvoke: (codec: Codec<unknown>, ctx: Ctx, id: string) => void,
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

			return path;
		};

		const resolveRelativePathCode = (relativePath: string) => {
			const path = resolveRelativePath(relativePath);
			return path[0]?.value + path.slice(1).map(s => s.type == "array" ? `[${s.value}]` : `.${s.value}`).join("");
		};

		// == Temp vars ==

		let temporaryVariables: Set<string> = new Set();

		const withTempVar = (hint: string, lifetime: (variable: string) => void) => {
			let variable = hint;
			let i = 0;
			while (temporaryVariables.has(variable)) variable = `${hint}${i++}`;
			temporaryVariables.add(variable);
			if (this.debug) writer.writeLine(`// withTempVar: ${variable}`);
			lifetime(variable);
		};

		// == Context ==

		const create = (options: unknown) => {
			const invokeDataType = (type: ProtoDef.DataType) => {
				const [id, options] = typeof type === "string" ? [type, null] : type;
				const newCtx = create(options);

				if (!(id in this.types)) throw new Error(`Unknown data type: ${id}`);

				const typeDef = this.types[id]!;

				if (typeDef === "native") {
					if (this.debug) writer.writeLine(`// < ${id} >`);
					onCodecInvoke(this.natives[id]!, newCtx, id);
					if (this.debug) writer.writeLine(`// </ ${id} >`).blankLine();
				} else invokeDataType(typeDef);
			};

			const ctx = {
				...base,
				options,
				invokeDataType,
				getPath,
				getPacket,
				resolveRelativePath,
				resolveRelativePathCode,
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
			textDecoder: textDecoder,
			requestBytes: () => { },
		};

		const factory = this.createContextFactory<DecoderContext<unknown>>(
			writer,
			vars,
			(codec, ctx) => codec.decoder(writer, ctx),
			root
		);

		const ctx = factory(null);

		writer.write(`(({ ${textDecoder}, ${textByteLength} }) => (function __decoder__(${buffer}) `).inlineBlock(() => {
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
			textEncoder: textEncoder,
			textByteLength: textByteLength,
		};

		const factory = this.createContextFactory<EncoderContext<unknown>>(
			writer,
			vars,
			(codec, ctx) => codec.encoder(writer, ctx),
			root
		);

		const ctx = factory(null);

		writer.write(`(({ ${textEncoder}, ${textByteLength} }) => (function __encoder__(${root}, ${buffer}) `).inlineBlock(() => {
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
			textEncoder: textEncoder,
			textByteLength: textByteLength,
		};

		const factory = this.createContextFactory<EncodedSizeContext<unknown>>(
			writer,
			vars,
			(codec, ctx) => codec.encodedSize(writer, ctx),
			root
		);

		const ctx = factory(null);

		writer.write(`(({ ${textByteLength}, ${textEncoder} }) => (function __encodedSize__(${root}) `).inlineBlock(() => {
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

	/** Generates generator function string for streaming decoding packets */
	generateStreamDecoderCode(type: ProtoDef.DataType) {
		const writer = new CodeBlockWriter();

		const root: string = "packet";

		const impl = {
			buffer: "rt.buffer",
			offset: "rt.offset",
			view: "rt.view",
			textDecoder: textDecoder,
			requestBytes(expr: number | string) {
				writer.writeLine(`while ((rt.available - rt.offset) < ${expr}) yield ${expr};`);
			},
		};

		const factory = this.createContextFactory<DecoderContext<unknown>>(
			writer,
			impl,
			(codec, ctx) => codec.decoder(writer, ctx),
			root
		);

		const ctx = factory(null);

		writer.write(`(({ ${textDecoder}, ${textByteLength} }) => (function* __streamDecoder__(rt) `).inlineBlock(() => {
			writer
				.writeLine(`let ${root} = {}`)
				.blankLine();

			ctx.invokeDataType(type);

			writer
				.blankLine()
				.writeLine(`return ${root}`);
		}).write(`))`);

		return writer.toString();
	}

	compileFunction<F extends Function>(code: string): F {
		try {
			return compile(code) as F;
		} catch (e) {
			console.error("Error compiling function:", e);
			console.error("Generated code was:", code);
			throw e;
		}
	}

	/** Generates TypeScript type definition for a data type */
	generateTypeDefinition(targetTypeId: string): string {
		const ir = generateIR(this, targetTypeId);
		const writer = new CodeBlockWriter();
		writer.write(`export type ${targetTypeId} = `);
		return writeIR(writer, ir).write(";").toString();
	}
};
