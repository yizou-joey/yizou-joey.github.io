import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { prepare, finish, recipe } from "../tools/sticker/scripts/core-adapter.mjs";

const root = process.cwd();
const sourceRoot = path.join(root, "assets/original-images/files");
const outputRoot = path.join(root, "public/files/generated");

const source = (...parts) => path.join(sourceRoot, ...parts);
const output = (...parts) => path.join(outputRoot, ...parts);

const ensureParentDir = async (filePath) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
};

const getSize = async (filePath) => {
  const stat = await fs.stat(filePath);
  return stat.size;
};

const writeImage = async ({ input, outputPath, width, format, options = {}, sticker }) => {
  await ensureParentDir(outputPath);
  let image = sharp(input, { animated: false, limitInputPixels: false }).rotate();
  if (sticker) {
    const decoded = await image.toColourspace("srgb").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const parameters = recipe(sticker);
    const result = finish(prepare({ data: decoded.data, ...decoded.info }, parameters), parameters);
    image = sharp(Buffer.from(result.data), { raw: { width: result.width, height: result.height, channels: 4 } });
  }
  if (width) {
    image = image.resize({ width, withoutEnlargement: true });
  }

  if (format === "avif") {
    image = image.avif({ quality: 58, effort: 7, ...options });
  } else if (format === "webp") {
    image = image.webp({ quality: 78, effort: 5, ...options });
  } else if (format === "jpeg") {
    image = image.flatten({ background: "#fdfdfc" }).jpeg({
      quality: 82,
      mozjpeg: true,
      ...options,
    });
  } else if (format === "png") {
    image = image.png({ compressionLevel: 9, effort: 8, ...options });
  } else {
    throw new Error(`Unsupported format: ${format}`);
  }

  await image.toFile(outputPath);
  return {
    outputPath,
    bytes: await getSize(outputPath),
  };
};

const tasks = [
  {
    name: "publications visual",
    input: source("visual.svg"),
    outputs: [
      { path: output("visual-960.avif"), width: 960, format: "avif" },
      { path: output("visual-960.webp"), width: 960, format: "webp" },
      { path: output("visual-960.jpg"), width: 960, format: "jpeg" },
      { path: output("visual-1672.avif"), width: 1672, format: "avif" },
      { path: output("visual-1672.webp"), width: 1672, format: "webp" },
      { path: output("visual-1672.jpg"), width: 1672, format: "jpeg" },
    ],
  },
  {
    name: "profile portrait",
    input: source("about-profile.jpg"),
    outputs: [
      { path: output("about-profile-400.avif"), width: 400, format: "avif" },
      { path: output("about-profile-400.jpg"), width: 400, format: "jpeg" },
    ],
  },
  {
    name: "halftone colophon",
    input: source("halftone_transparent.png"),
    outputs: [
      { path: output("halftone-colophon.webp"), width: 160, format: "webp" },
      { path: output("halftone-colophon.png"), width: 400, format: "png" },
    ],
  },
  {
    name: "IEEE VR mascot sticker",
    input: path.join(root, "tools/sticker/examples/vr-otter.png"),
    sticker: {},
    outputs: [
      { path: output("logos/ieee-vr-26-mascot-sticker.webp"), format: "webp", options: { lossless: true } },
    ],
  },
  {
    name: "IEEE VR logo sticker",
    input: path.join(root, "tools/sticker/examples/vr-logo-transparent.png"),
    sticker: {},
    outputs: [
      { path: output("logos/ieee-vr-26-logo-sticker.webp"), format: "webp", options: { lossless: true } },
    ],
  },
  {
    name: "MMSys logo sticker",
    input: path.join(root, "public/files/logos/MMSys 26 Logo.png"),
    sticker: { recolor: 90 },
    outputs: [
      { path: output("logos/mmsys-2026-logo-sticker.webp"), format: "webp", options: { lossless: true } },
    ],
  },
  {
    name: "SCUT logo",
    input: source("logos", "SCUT Logo Only.png"),
    outputs: [
      { path: output("logos/scut-logo-only.webp"), width: 160, format: "webp" },
    ],
  },
];

await fs.rm(outputRoot, { recursive: true, force: true });
await fs.mkdir(outputRoot, { recursive: true });

const rows = [];
for (const task of tasks) {
  const inputBytes = await getSize(task.input);
  for (const target of task.outputs) {
    const result = await writeImage({
      input: task.input,
      outputPath: target.path,
      width: target.width,
      format: target.format,
      options: target.options,
      sticker: task.sticker,
    });
    rows.push({
      source: task.name,
      input: path.relative(root, task.input),
      inputBytes,
      output: path.relative(root, result.outputPath),
      outputBytes: result.bytes,
      ratio: result.bytes / inputBytes,
    });
  }
}

const formatKb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

console.log("Optimized images:");
for (const row of rows) {
  const percent = `${Math.round((1 - row.ratio) * 100)}% smaller`;
  console.log(
    `- ${row.output}: ${formatKb(row.outputBytes)} (${percent} vs ${formatKb(row.inputBytes)})`
  );
}
