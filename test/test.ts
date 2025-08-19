import { importNativeTypes } from "../src/native/index.js";
import { Protocol } from "../src/proto/Protocol.js";
import type { ProtoDef } from "../src/types.js";

const protocol = {
    types: {
        ...importNativeTypes,

        string: ["pstring", { countType: "i8" }],
        testContainer: ["container", [
            { name: "cute", type: "bool" },
            { name: "num", type: "i32" },
            { name: "username", type: "string" },
            { name: "hasFunnies", type: "bool" },
            { name: "funnies", type: [
                "switch",
                {
                    compareTo: "hasFunnies",
                    fields: {
                        true: ["array", {
                            countType: "i8",
                            type: "string"
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
    cute: true, // 1b
    num: 1, // i32, 4b
    username: "mrrp", // 4+1 b
    hasFunnies: false, // 1b
    funnies: [ // compareTo:hasFunnies ; 1b count
        "" // 1b count, 0b len
    ],
}; // TOTAL 13 if hasFunnies, 11 otherwise






const rwTest = <T>(type: ProtoDef.DataType, value: T) => {
    console.log("Calculating packet size");
    const size = proto.sizeDataType(type, value, value, "", []);
    console.log("Packet size:", size);
    console.log("Writing packet");
    const buffer = new ArrayBuffer(size);
    proto.writeDataType({ offset: 0, buffer, view: new DataView(buffer) }, type, value, value, "", []);
    console.log("Written packet");
    console.log("Packet buffer:", buffer);
    console.log("Reading packet");
    const read = proto.readDataType({ offset: 0, buffer, view: new DataView(buffer) }, type, {}, "", []);
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
