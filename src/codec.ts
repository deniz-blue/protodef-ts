import CodeBlockWriter from "code-block-writer";
import type { IRNode } from "./typegen/ir.js";

export interface PathSegment {
	value: string;
	type: "array" | "object";
};

export interface Context<TOptions> {
	/** The options for the current context */
	options: TOptions;
	/** Returns the variable name for the current packet/value */
	getPacket(): string;
	/** Resolves a relative path like "../field" into an absolute variable identifier like "packet.field" */
	resolveRelativePathCode(relativePath: string): string;
	/** Resolves a relative path like "../field" into a path segment array */
	resolveRelativePath(relativePath: string): PathSegment[];
	/** Creates a temporary variable with a given hint and lifetime */
	withTempVar(hint: string, lifetime: (variable: string) => void): void;
	/** Changes packet variable for the duration of the given function */
	withNewPacket(packet: string, lifetime: () => void, segment?: PathSegment): void;
	/** Invokes the encoding/decoding logic for a given data type */
	invokeDataType(type: ProtoDef.DataType): void;
	/** Returns the path stack */
	getPath(): PathSegment[];
};

export interface DecoderContext<TOptions> extends Context<TOptions> {
	/** The current offset variable */
	offset: string;
	/** The current buffer variable */
	buffer: string;
	/** The current DataView variable */
	view: string;
	/** The current TextDecoder variable */
	textDecoder: string;
	/** No-op in non-streaming mode */
	requestBytes(expr: number | string): void;
};

export interface EncoderContext<TOptions> extends Context<TOptions> {
	/** The current offset variable */
	offset: string;
	/** The current buffer variable */
	buffer: string;
	/** The current DataView variable */
	view: string;
	/** The current TextEncoder variable */
	textEncoder: string;
	/** Fast function name to calculate byte length of a string */
	textByteLength: string;
};

export interface EncodedSizeContext<TOptions> extends Context<TOptions> {
	/** The current size variable */
	size: string;
	/** Fast function name to calculate byte length of a string */
	textByteLength: string;
};

export interface PreprocessTypeGenContext<TOptions> extends Context<TOptions> {
	schemas: ProtoDef.DataType[];
};

export interface GetIRContext<TOptions> {
	/** The options for the current context */
	options: TOptions;
	/** Get IR node for a given data type */
	getIR(type: ProtoDef.DataType): IRNode;
};

declare global {
	namespace ProtoDef {
		export interface Codec<TOptions = void> {
			/** Buffer to object */
			decoder(writer: CodeBlockWriter, ctx: DecoderContext<TOptions>): void;
			/** Object to buffer */
			encoder(writer: CodeBlockWriter, vars: EncoderContext<TOptions>): void;
			/** Object to buffer size */
			encodedSize(writer: CodeBlockWriter, ctx: EncodedSizeContext<TOptions>): void;

			getIR?(ctx: GetIRContext<TOptions>): IRNode;
			preprocessTypeGen?(ctx: PreprocessTypeGenContext<TOptions>): void;
		}
	}
}

export type Codec<TOptions = void> = ProtoDef.Codec<TOptions>;
