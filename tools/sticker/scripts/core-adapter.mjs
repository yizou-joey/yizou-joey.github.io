import fs from "node:fs/promises";
import vm from "node:vm";
const context = vm.createContext({ Math, Uint8ClampedArray, Uint8Array, Float32Array, Float64Array, Int32Array });
for (const file of ["core", "input", "processor"]) {
  vm.runInContext(await fs.readFile(new URL(`../js/${file}.js`, import.meta.url), "utf8"), context, { filename: `${file}.js` });
}
export const { recipe, prepare, finish } = context.Sticker.core;
export const { inspectInput, createCore, createProcessor } = context.Sticker;
