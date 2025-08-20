import { expect, test } from "vitest";
import type { ProtoDef } from "../types.js";
import { importNativeTypes } from "../native/index.js";
import { fillProtocolVariables } from "./fillProtocolVariables.js";

test("fillProtocolVariables", () => {
    const original = {
        types: {
            ...importNativeTypes,
            test: ["switch", {
                compareTo: "",
                fields: {
                    "/x": "void",
                },
                default: "void",
            }],
        },
    } satisfies ProtoDef.Protocol;

    expect(fillProtocolVariables(original, { x: "2" })).not.deep.eq(original);
});
