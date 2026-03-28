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
	withNewPacket(packet: string, lifetime: () => void): void;
	/** Invokes the encoding/decoding logic for a given data type */
	invokeDataType(type: ProtoDef.DataType): void;
};

export interface Decoder<TOptions> {
	/** Buffer to object */
	decoder(writer: CodeBlockWriter, ctx: Context<TOptions> & {
		offset: string;
		buffer: string;
		view: string;
		textDecoder: string;
	}): void;
};

export interface Encoder<TOptions> {
	/** Object to buffer */
	encoder(writer: CodeBlockWriter, vars: Context<TOptions> & {
		offset: string;
		buffer: string;
		view: string;
		textEncoder: string;
	}): void;
};

export type Codec<TOptions = void> = Decoder<TOptions> & Encoder<TOptions>;

