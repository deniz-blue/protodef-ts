import { Void, bool, cstring } from "./primitives.js";
import { NativeNumericDataTypeImpls } from "./numeric.js";
import { pstring } from "./util/pstring.js";
import { array } from "./structures/array.js";
import { container } from "./structures/container.js";
import { option } from "./conditional/option.js";
import { bitfield } from "./util/bitfield.js";
import { bitflags } from "./util/bitflags.js";
import { mapper } from "./util/mapper.js";
import { Switch } from "./conditional/switch.js";
import { count } from "./structures/count.js";

export const NativeDataTypes = {
    ...NativeNumericDataTypeImpls,
    cstring,
    bool,
    void: Void,
    pstring,
    array,
    container,
    option,
    bitfield,
    bitflags,
    mapper,
    switch: Switch,
    count,
};
