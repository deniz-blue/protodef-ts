const textEncoder = new TextEncoder();
const textDecoder = new TextEncoder();

// https://stackoverflow.com/a/23329386
export const textByteLength = (str: string) => {
    let s = str.length;
    for (let i = str.length - 1; i >= 0; i--) {
        let code = str.charCodeAt(i);
        if (code > 0x7f && code <= 0x7ff) s++;
        else if (code > 0x7ff && code <= 0xffff) s += 2;
        if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
    }
    return s;
};

export const writeTextToBuffer = (
    buf: Uint8Array,
    text: string,
    offset: number = 0,
) => {
    textEncoder.encodeInto(text, buf.slice(offset));
};

export const readTextFromBuffer = () => {

};


