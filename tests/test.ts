import { importNativeTypes } from "../src/native/index.js";
import { Protocol } from "../src/proto/Protocol.js";
import type { ProtoDef } from "../src/types.js";

const protocol = {
    types: {
        ...importNativeTypes,

        string: ["pstring", { countType: "i8" }],
        testContainer: ["container", [
            { name: "documentName", type: "string" },
            { name: "hasEntries", type: "bool" },
            { name: "detailed", type: "bool" },
            { name: "entries", type: [
                "switch",
                {
                    compareTo: "hasEntries",
                    fields: {
                        true: ["array", {
                            countType: "i8",
                            type: ["container", [
                                { name: "text", type: "cstring" },
                                { name: "detailText", type: [
                                    "switch",
                                    {
                                        compareTo: "../detailed",
                                        fields: {
                                            true: "string",
                                        },
                                        default: "void",
                                    },
                                ] },
                                // { name: "hasAmount", type: "bool" },
                                // { name: "amount", type: [
                                //     "switch",
                                //     {
                                //         compareTo: "hasAmount",
                                //         fields: {
                                //             true: "i8",
                                //         },
                                //         default: "void",
                                //     }
                                // ] }
                            ]]
                        }]
                    },
                    default: "void",
                },
            ] },
        ]]
    },
} satisfies ProtoDef.Protocol;

const proto = new Protocol({
    protocol,
});

const value = {
    documentName: "MeowDoc",
    hasEntries: true,
    detailed: true,
    entries: [
        { text: "entry0", detailText: "details!" }
    ],
};






const rwTest = <T>(type: ProtoDef.DataType, value: T) => {
    console.log("Calculating packet size");
    const size = proto.sizeDataType(type, value, value, "", []);
    console.log("Packet size:", size);
    console.log("Writing packet");
    const buffer = new ArrayBuffer(size);
    proto.writeDataType({ offset: 0, buffer }, type, value, value, "", []);
    console.log("Written packet");
    console.log("Packet buffer:", buffer);
    console.log("Reading packet");
    const read = proto.readDataType({ offset: 0, buffer }, type, {}, "", []);
    console.log("Read packet");
    console.log(typeof read);
    console.log(read);
};

// rwTest([
//     "container",
//     [{ name: "m", type: "cstring" }]
// ], {
//     m: "meow",
// });

rwTest(protocol.types.testContainer, value);



// let size = proto.sizeDataType(
//     protocol.types.testContainer,
//     value,
//     value,
//     "",
//     [],
// );

// console.log("SIZE", size);

// let buffer = new ArrayBuffer(size);
// proto.writeDataType(
//     {
//         buffer,
//         offset: 0,
//         view: new DataView(buffer),
//     },
//     protocol.types.testContainer,
//     value,
//     value,
//     "",
//     []
// );

// console.log("written! output:")
// console.log(buffer)
