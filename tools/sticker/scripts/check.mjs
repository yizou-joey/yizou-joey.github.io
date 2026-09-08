import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import { inspectInput } from "./core-adapter.mjs";
import { prepare, finish, recipe } from "./core-adapter.mjs";
const sources = "tools/sticker/examples";
for (const [id, file, recolor] of [
  ["otter", `${sources}/vr-otter.png`, null],
  ["vr", `${sources}/vr-logo-transparent.png`, null],
  ["bridge", "public/files/logos/MMSys 26 Logo.png", 90],
]) {
  const decoded = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const input = { data: decoded.data, ...decoded.info }, options = recipe({ recolor });
  const prepared = prepare(input, options), flat = finish(prepared, { ...options, finish: "flat" });
  let partial = 0;
  for (let i = 0; i < flat.data.length; i += 4) {
    assert.ok(flat.data[i + 3] >= prepared.art[i + 3], `${id}: source alpha clipped`);
    if (flat.data[i + 3] > 0 && flat.data[i + 3] < 255) partial++;
    if (prepared.art[i + 3] === 255) assert.deepEqual(flat.data.slice(i, i + 3), prepared.art.slice(i, i + 3), `${id}: opaque original RGB changed`);
  }
  assert.ok(partial > 50, `${id}: missing antialiasing`);
  for (const effect of ["ink", "blind", "pastel"]) {
    const result = finish(prepared, { ...options, finish: effect });
    for (let i = 3; i < result.data.length; i += 4) assert.equal(result.data[i], flat.data[i]);
  }
  assert.deepEqual(finish(prepare(input, JSON.parse(JSON.stringify(options))), options), finish(prepared, options), "recipe replay differs");
  console.log(`${id}: alpha preserved, effects consistent, recipe replay verified`);
}
// Same dimensions, different content must not share results; solid RGB must not gain a paper tint.
const solid = new Uint8ClampedArray(40 * 40 * 4);
for (let i = 0; i < solid.length; i += 4) solid.set([80, 30, 150, 255], i);
const options = recipe(), a = prepare({ data: solid, width: 40, height: 40 }, options);
const center = (Math.floor(a.height / 2) * a.width + Math.floor(a.width / 2)) * 4;
assert.deepEqual(Array.from(finish(a, options).data.slice(center, center + 3)), [80, 30, 150]);
const other = Uint8ClampedArray.from(solid, (v, i) => i % 4 === 0 ? 170 : v);
assert.notDeepEqual(finish(a, options).data, finish(prepare({ data: other, width: 40, height: 40 }, options), options).data);
for (const scale of [1, 2, 4]) {
  const result = finish(a, { ...options, scale });
  assert.equal(result.width, 100 * scale);
  assert.equal(result.data.length, result.width * result.height * 4);
}
assert.throws(() => recipe({ displayWidth: 0 }));
assert.throws(() => recipe({ version: "unknown" }));
assert.throws(() => prepare({ data: new Uint8ClampedArray(4), width: 1, height: 9000 }, options));
const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "sticker-check-"));
try {
  const input = path.join(tmp, "source.png"), config = path.join(tmp, "recipe.json");
  await sharp(solid, { raw: { width: 40, height: 40, channels: 4 } }).png().toFile(input);
  await fs.writeFile(config, JSON.stringify(options));
  for (const extension of ["png", "webp"]) {
    const output = path.join(tmp, `output.${extension}`);
    execFileSync(process.execPath, ["tools/sticker/scripts/export.mjs", input, config, output]);
    const image = sharp(output), metadata = await image.metadata();
    assert.equal(metadata.format, extension); assert.equal(metadata.width, 400); assert.ok(metadata.hasAlpha);
    const decoded = await image.ensureAlpha().raw().toBuffer(), expected = finish(a, options).data;
    let mismatches = 0;
    for (let i = 0; i < decoded.length; i++) if ((i % 4 === 3 || expected[i - i % 4 + 3] > 0) && decoded[i] !== expected[i]) mismatches++;
    assert.equal(mismatches, 0, `${extension}: visible pixels differ`);
  }
} finally { await fs.rm(tmp, { recursive: true, force: true }); }
console.log("Sticker checks passed: pixel invariants, recipe replay and encoders.");

assert.throws(() => inspectInput(new TextEncoder().encode("<svg/>")));
assert.throws(() => inspectInput(new Uint8Array(20 * 1024 * 1024 + 1)));
const animatedPng = new Uint8Array(28);
animatedPng.set([137, 80, 78, 71, 13, 10, 26, 10]);
animatedPng.set(new TextEncoder().encode("acTL"), 12);
assert.throws(() => inspectInput(animatedPng), /动画/);
const animatedWebp = new Uint8Array(24);
animatedWebp.set(new TextEncoder().encode("RIFF"));
animatedWebp.set(new TextEncoder().encode("WEBPANIM"), 8);
assert.throws(() => inspectInput(animatedWebp), /动画/);
assert.equal(inspectInput(new Uint8Array(await fs.readFile(`${sources}/vr-otter.png`))), "image/png");
console.log("Input validation passed: static files, invalid types, size limits, animation rejection and subsequent valid input.");

// The serialized worker factory and the direct compatibility processor share exact pixels.
const { createCore, createProcessor } = await import("./core-adapter.mjs");
const { Worker } = await import("node:worker_threads");
const job = { id: 1, sourceId: 1, source: { data: solid, width: 40, height: 40 }, options };
const direct = createProcessor(createCore())(job);
const thread = new Worker(`const {parentPort}=require('node:worker_threads'); const process=(${createProcessor.toString()})((${createCore.toString()})()); parentPort.on('message',job=>parentPort.postMessage(process(job)));`, { eval: true });
try {
  const result = await new Promise((resolve, reject) => { thread.once("message", resolve); thread.once("error", reject); thread.postMessage(job); });
  for (const name of Object.keys(direct.variants)) assert.equal(Buffer.compare(Buffer.from(result.variants[name].data), Buffer.from(direct.variants[name].data)), 0);
} finally { await thread.terminate(); }
// Every HTML resource resolves inside the standalone directory, without imports or URLs to the main site.
for (const page of ["index.html", "notes.html"]) {
  const html = await fs.readFile(new URL(`../${page}`, import.meta.url), "utf8");
  assert.ok(!html.includes('type="module"'));
  for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert.ok(url.startsWith("./") || url.startsWith("#"), `nonlocal reference ${url}`);
    if (url.startsWith("./")) await fs.access(new URL(`../${url.split("#")[0]}`, import.meta.url));
  }
}
console.log("Serialized worker / compatibility parity and standalone resource checks passed.");

// Embedded originals must remain byte-identical to the source PNGs.
const vm = await import("node:vm");
const examplesContext = vm.createContext({ Sticker: {} });
vm.runInContext(await fs.readFile(new URL("../js/examples.js", import.meta.url), "utf8"), examplesContext);
for (const [id, filename] of [["otter", "vr-otter.png"], ["vr", "vr-logo-transparent.png"]]) {
  const embedded = Buffer.from(examplesContext.Sticker.examples[id], "base64");
  assert.deepEqual(embedded, await fs.readFile(new URL(`../examples/${filename}`, import.meta.url)));
  assert.equal(inspectInput(new Uint8Array(embedded)), "image/png");
}
console.log("Embedded examples match original PNGs exactly.");
