import { test } from "vitest";
import { roundtrip, testWriteRead } from "./utils.js";
import { Protocol } from "../src/proto/Protocol.js";

const proto = new Protocol({
	types: {
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
	},
});

test("container > switch", ({ annotate }) => {
	roundtrip({
		proto,
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
		proto,
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
	testWriteRead(proto, "testContainer", {
		documentName: "a",
		hasEntries: true,
		detailed: false,
		entries: [
			{ text: "c", detailText: null },
			{ text: "c", detailText: null },
		],
	}, new Uint8Array([1, 97, 1, 0, 2, 1, 99, 1, 99]))

	testWriteRead(proto, "testContainer", {
		documentName: "a",
		hasEntries: true,
		detailed: true,
		entries: [
			{ text: "c", detailText: "b" },
			{ text: "c", detailText: "b" },
		],
	}, new Uint8Array([1, 97, 1, 1, 2, 1, 99, 1, 98, 1, 99, 1, 98]))
})

