import { test } from "vitest";
import { roundtrip } from "./utils.js";
import type {} from "../src";

const types: Record<string, ProtoDef.DataType> = {
	string: ["pstring", { countType: "u8" }],
	testContainer: ["container", [
		{ name: "documentName", type: "string" },
		{ name: "hasEntries", type: "bool" },
		{ name: "detailed", type: "bool" },
		{
			name: "entries", type: [
				"switch",
				{
					compareTo: "hasEntries",
					fields: {
						true: ["array", {
							countType: "u8",
							type: ["container", [
								{ name: "text", type: "string" },
								{
									name: "detailText", type: [
										"switch",
										{
											compareTo: "../detailed",
											fields: {
												true: "string",
											},
											default: "void",
										},
									]
								},
							]]
						}]
					},
					default: "void",
				},
			]
		},
	]]
};

test("container > switch", ({ annotate }) => {
	roundtrip({
		types,
		type: "testContainer",
		packet: {
			documentName: "a",
			hasEntries: false,
			detailed: false,
			entries: null,
		},
		expectBuffer: new Uint8Array([1, 97, 0, 0]),
		annotate,
	});

	roundtrip({
		types,
		type: "testContainer",
		packet: {
			documentName: "a",
			hasEntries: true,
			detailed: false,
			entries: [],
		},
		expectBuffer: new Uint8Array([1, 97, 1, 0, 0]),
		annotate,
	});
});

test("container > switch > array > switch", ({ annotate }) => {
	roundtrip({
		types,
		type: "testContainer",
		packet: {
			documentName: "a",
			hasEntries: true,
			detailed: true,
			entries: [
				{ text: "c", detailText: "b" },
				{ text: "c", detailText: "b" },
			],
		},
		expectBuffer: new Uint8Array([1, 97, 1, 1, 2, 1, 99, 1, 98, 1, 99, 1, 98]),
		annotate,
	});

	roundtrip({
		types,
		type: "testContainer",
		packet: {
			documentName: "a",
			hasEntries: true,
			detailed: false,
			entries: [
				{ text: "c", detailText: null },
				{ text: "c", detailText: null },
			],
		},
		expectBuffer: new Uint8Array([1, 97, 1, 0, 2, 1, 99, 1, 99]),
		annotate,
	})
})

