import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import config from "../vite.config.js";
import publications from "../contents/publications.js";

const plugin = config.plugins.find((item) => item.name === "static-content-html");
const projects = publications.filter((entry) => entry.projectUrl);
const pages = ["index.html", "404.html", ...projects.map((entry) => entry.projectUrl)];
const readPage = (fileName) => readFile(new URL(`../${fileName}`, import.meta.url), "utf8");
const render = (html, fileName) => plugin.transformIndexHtml.handler(html, { filename: fileName });
const normalize = (html) => html.replace(/\s+/g, " ").trim();

// Only div ancestry is needed to guard the existing footer layout boundary.
const footerDivAncestors = (html) => {
  const markup = html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  const ancestors = [];
  for (const [tag] of markup.matchAll(/<\/?div\b[^>]*>|<footer\b[^>]*>/gi)) {
    if (tag.startsWith("<footer")) return [...ancestors];
    if (tag.startsWith("</")) ancestors.pop();
    else ancestors.push(tag.match(/\bclass="([^"]*)"/)?.[1] || "");
  }
  assert.fail("Missing footer");
};

let sharedToggle;
let sharedFavicon;
for (const fileName of pages) {
  const isHome = fileName === "index.html";
  const isError = fileName === "404.html";
  const isProject = !isHome && !isError;
  const html = await render(await readPage(fileName), fileName);
  const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1];
  assert(head, `${fileName}: head exists`);
  assert(!/<!--\s*site:|\{\{\w+\}\}/.test(html), `${fileName}: placeholders are resolved`);
  const headers = [...html.matchAll(/<header\b[^>]*\bclass="site-header"[^>]*>[\s\S]*?<\/header>/g)];
  const footers = [...html.matchAll(/<footer\b[^>]*>[\s\S]*?<\/footer>/g)];
  assert.equal(headers.length, 1, `${fileName}: exactly one site header`);
  assert.equal(footers.length, 1, `${fileName}: exactly one footer`);
  const header = headers[0][0];
  const footer = footers[0][0];
  if (isHome) {
    assert.match(header, /<span\b[^>]*aria-current="page"[^>]*>Home<\/span>/);
  } else {
    assert.match(header, /<a\b[^>]*href="\/"[^>]*>Home<\/a>/);
    assert(!header.includes("aria-current="), `${fileName}: Home is not marked current`);
  }
  const toggles = [...header.matchAll(/<button\b[^>]*\bdata-theme-toggle\b[^>]*>[\s\S]*?<\/button>/g)];
  assert.equal(toggles.length, 1, `${fileName}: exactly one theme control`);
  sharedToggle ??= normalize(toggles[0][0]);
  assert.equal(normalize(toggles[0][0]), sharedToggle, `${fileName}: shared theme control markup`);
  assert.equal(footer.includes("halftone-colophon"), !isProject, `${fileName}: footer illustration variant`);
  assert.equal(footer.includes("page-colophon-inner--text-only"), isProject, `${fileName}: text-only footer variant`);
  assert.match(footer, /© 2026 Yi Zou/);
  assert.match(footer, /<time datetime="2026-09">Sep 2026<\/time>/);
  assert.deepEqual(footerDivAncestors(html), isError
    ? ["site-shell", "site-page-stack site-page-stack--screen"] : [],
  `${fileName}: footer retains its original layout parent`);

  const favicon = head.match(/<link\b[^>]*\bdata-dynamic-favicon\b[^>]*>/g) || [];
  assert.equal(favicon.length, 1, `${fileName}: exactly one dynamic favicon`);
  sharedFavicon ??= normalize(favicon[0]);
  assert.equal(normalize(favicon[0]), sharedFavicon, `${fileName}: shared favicon configuration`);
  const fontStyles = head.match(/<link\b[^>]*href="https:\/\/fonts\.googleapis\.com\/css2\?[^>]*>/g) || [];
  assert.equal(fontStyles.length, 1, `${fileName}: one font request`);
  const fontHref = fontStyles[0].match(/href="([^"]*)"/)[1].replaceAll("&amp;", "&");
  assert.equal(fontHref, isError
    ? "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400&display=swap"
    : "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Noto+Serif+SC:wght@400;500;600&family=Shantell+Sans:wght@400&display=swap",
  `${fileName}: font selection remains unchanged`);
  assert.equal(head.includes('href="https://www.youtube-nocookie.com"'), isProject,
    `${fileName}: YouTube preconnection is project-only`);
  assert.equal((head.match(/href="\/src\/styles\.css"/g) || []).length, 1);
  const bootstrap = [...head.matchAll(/<script\b([^>]*\bdata-theme-bootstrap\b[^>]*)>([\s\S]*?)<\/script>/g)];
  assert.equal(bootstrap.length, 1, `${fileName}: one theme bootstrap`);
  assert(!/\b(?:src|type|async|defer)\b/.test(bootstrap[0][1]), `${fileName}: synchronous theme bootstrap`);
  assert(bootstrap[0][2].trim(), `${fileName}: theme bootstrap is populated`);
  assert(head.indexOf('charset="UTF-8"') < bootstrap[0].index);
  assert(bootstrap[0].index < head.search(/<link\b[^>]*rel="stylesheet"/));

  const moduleSources = [...html.matchAll(/<script\b[^>]*type="module"[^>]*src="([^"]+)"[^>]*>/g)]
    .map((match) => match[1].replace(/^\//, "")).sort();
  assert.deepEqual(moduleSources, (isHome
    ? ["js/favicon.js", "js/publication-preview.js", "js/news-scroll.js", "js/service-tooltip.js"]
    : isError ? ["js/404.js", "js/favicon.js"] : ["js/favicon.js"]).sort(),
  `${fileName}: page-specific modules are preserved`);
  assert.equal(html.includes('data-goatcounter="https://joeyzou.goatcounter.com/count"'), !isProject,
    `${fileName}: analytics policy remains unchanged`);
  assert.equal(head.includes('rel="expect"'), !isError, `${fileName}: transition rendering hint remains scoped`);
}

const homeSource = await readPage("index.html");
for (const slot of ["bootstrap", "head", "header", "footer"]) {
  const marker = `<!-- site:${slot} -->`;
  assert(homeSource.includes(marker), `Homepage declares the ${slot} slot`);
  await assert.rejects(render(homeSource.replace(marker, ""), "index.html"),
    `Missing ${slot} slot must fail instead of silently dropping shared content`);
  await assert.rejects(render(homeSource.replace(marker, `${marker}${marker}`), "index.html"),
    `Duplicate ${slot} slot must fail instead of duplicating shared content`);
}

for (const name of ["head", "header", "footer"]) {
  const messages = [];
  const server = { ws: { send: (message) => messages.push(message) } };
  const file = fileURLToPath(new URL(`../templates/site-${name}.html`, import.meta.url));
  assert.deepEqual(plugin.handleHotUpdate({ file, server }), []);
  assert.deepEqual(messages, [{ type: "full-reload", path: "*" }],
    `Editing the shared ${name} template reloads every page`);
}

console.log("Site shell checks passed: shared markup, page variants, resource scope, layout parents and required slots.");
