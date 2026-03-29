import CodeBlockWriter from "code-block-writer";

export interface Context<TOptions> {
	/** The options for the current context */
	options: TOptions;
	/** Returns the variable name for the current packet/value */
	getPacket(): string;
	/** Resolves a relative path like "../field" into an absolute variable identifier like "packet.field" */
	resolveRelativePath(relativePath: string): string;
	/** Creates a temporary variable with a given hint and lifetime */
	withTempVar(hint: string, lifetime: (variable: string) => void): void;
	/** Changes packet variable for the duration of the given function */
	withNewPacket(packet: string, lifetime: () => void, segment?: string | number): void;
	/** Invokes the encoding/decoding logic for a given data type */
	invokeDataType(type: ProtoDef.DataType): void;
	/** Returns the path stack */
	getPath(): (string | number)[];
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
};

export interface EncodedSizeContext<TOptions> extends Context<TOptions> {
	/** The current size variable */
	size: string;
	/** Fast function name to calculate byte length of a string */
	textByteLength: string;
};

export interface Decoder<TOptions> {
	/** Buffer to object */
	decoder(writer: CodeBlockWriter, ctx: DecoderContext<TOptions>): void;
};

export interface Encoder<TOptions> {
	/** Object to buffer */
	encoder(writer: CodeBlockWriter, vars: EncoderContext<TOptions>): void;
};

export interface EncodedSize<TOptions> {
	/** Object to buffer size */
	encodedSize(writer: CodeBlockWriter, ctx: EncodedSizeContext<TOptions>): void;
};

export type Codec<TOptions = void> = Decoder<TOptions> & Encoder<TOptions> & EncodedSize<TOptions>;

