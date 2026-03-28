export interface NamespacedProtocol {
	types?: Record<string, globalThis.ProtoDef.DataType>;
	// Headache. -d
	[namespace: string]: NamespacedProtocol | Record<string, globalThis.ProtoDef.DataType>;
};

declare global {
	namespace ProtoDef {
		export type NativeDataType = DataTypeWithoutArgs<"native">;

		export interface Protocol {
			[id: string]: DataType | NativeDataType;
		}

		export type ICountable = {
			countType: DataType;
		} | {
			count: string | number;
		};

		export type DataTypeWithoutArgs<Id extends string = (string & {})> = Id;
		export type DataTypeWithArgs<Id extends string = (string & {}), Args = any> = [Id, Args];

		export interface IntrinsicDataTypes { }

		export type IntrinsicDataType = IntrinsicDataTypes[keyof IntrinsicDataTypes];
		export type UserDataType = DataTypeWithoutArgs | DataTypeWithArgs;
		export type DataType = IntrinsicDataType | UserDataType;
	}
}
