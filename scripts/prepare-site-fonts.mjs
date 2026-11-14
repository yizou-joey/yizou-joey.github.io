// Explicit regeneration only; production builds use the checked-in WOFF2 files.
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const output = new URL("public/files/fonts/site/", root);
const files = [
  ...(await readdir(new URL("contents/", root))).filter((name) => name.endsWith(".js")).map((name) => `contents/${name}`),
  ...(await readdir(new URL("js/", root))).filter((name) => name.endsWith(".js")).map((name) => `js/${name}`),
  ...(await readdir(root)).filter((name) => name.endsWith(".html")),
  "css/styles.css", "build/site-shell.js", "templates/site-header.html", "templates/site-footer.html",
];
const corpus = (await Promise.all(files.map((file) => readFile(new URL(file, root), "utf8")))).join("");
// Keep the full Latin/extended Latin repertoire for future English copy.
const text = [...new Set([...corpus, ...Array.from({ length: 0x250 - 0x20 }, (_, i) => String.fromCodePoint(i + 0x20))])]
  .filter((char) => char.codePointAt(0) >= 0x20).sort().join("");
const headers = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36" };
const get = async (url) => {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  return response;
};

await mkdir(output, { recursive: true });
for (const [family, slug, weights, repository] of [
  ["Noto Serif SC", "noto-serif-sc", "400..600", "notoserifsc"],
  ["Shantell Sans", "shantell-sans", "400", "shantellsans"],
]) {
  const url = new URL("https://fonts.googleapis.com/css2");
  url.searchParams.set("family", `${family}:wght@${weights}`);
  url.searchParams.set("display", "swap");
  url.searchParams.set("text", text);
  const css = await (await get(url)).text();
  const urls = [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map((match) => match[1]))];
  if (urls.length !== 1 || !css.includes("woff2")) throw new Error(`Expected one WOFF2 for ${family}: ${css}`);
  const bytes = Buffer.from(await (await get(urls[0])).arrayBuffer());
  await writeFile(new URL(`${slug}.woff2`, output), bytes);
  await writeFile(new URL(`${slug}-OFL.txt`, output), await (await get(`https://raw.githubusercontent.com/google/fonts/main/ofl/${repository}/OFL.txt`)).text());
  console.log(`${slug}.woff2: ${bytes.length} bytes`);
}
