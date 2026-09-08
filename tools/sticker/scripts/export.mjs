import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { prepare, finish, recipe } from "./core-adapter.mjs";
const args = process.argv.slice(2);
async function render(input, options, target, format = "png") {
  if ((await fs.stat(input)).size > 20 * 1024 * 1024) throw new Error("图片超过 20MB。");
  const metadata = await sharp(input).metadata();
  if (!["png", "jpeg", "webp"].includes(metadata.format) || metadata.pages > 1) throw new Error("仅支持静态 PNG、JPEG、WebP。");
  const decoded = await sharp(input, { limitInputPixels: 16000000 }).rotate().toColourspace("srgb").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const result = finish(prepare({ data: decoded.data, ...decoded.info }, options), options);
  await fs.mkdir(path.dirname(target), { recursive: true });
  const image = sharp(Buffer.from(result.data), { raw: { width: result.width, height: result.height, channels: 4 } });
  await (format === "webp" ? image.webp({ lossless: true }) : image.png()).toFile(target);
}
if (args.length) {
  const [input, config, target] = args;
  if (args.length !== 3 || !/\.(png|webp)$/i.test(target)) throw new Error("用法：npm run preview:stickers -- input.png recipe.json output.png（或 .webp）");
  const options = recipe(JSON.parse(await fs.readFile(config, "utf8")));
  await render(input, options, target, target.toLowerCase().endsWith(".webp") ? "webp" : "png");
} else {
  console.log("用法：npm run preview:stickers -- input.png recipe.json output.png（或 .webp）；无参数不生成文件。");
}
