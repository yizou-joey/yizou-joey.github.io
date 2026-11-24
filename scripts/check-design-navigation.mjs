import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import config from "../vite.config.js";
import navigation from "../contents/design-navigation.js";
import { renderDesignNavigationHtml } from "../build/design-navigation.js";

const plugin = config.plugins.find((item) => item.name === "static-content-html");
const source = await readFile(new URL("../design.html", import.meta.url), "utf8");
const html = await plugin.transformIndexHtml.handler(source, { filename: "design.html" });
const nav = html.match(/<nav class="design-doc-nav[^"]*"[\s\S]*?<\/nav>/)?.[0];

assert(nav, "design.html renders the design guide navigation");
assert.equal((nav.match(/aria-current="page"/g) || []).length, 1, "exactly one current page item");
assert(nav.includes('<a href="/design.html" aria-current="page">Overview</a>'), "overview is the current page on design.html");
assert.doesNotMatch(nav, /<a[^>]*href="[^"]*"[^>]*>\s*(Foundations|Guide|Start)\s*<\/a>/, "group titles are not links");

for (const group of navigation) {
  assert(new RegExp(`<p class="design-doc-nav-title[^"]*">${group.title}</p>`).test(nav), `group ${group.title} is rendered as a title`);
  for (const item of group.items) {
    assert(nav.includes(`href="${item.href}"`), `${item.title} links to ${item.href}`);
    assert(/^\/design(?:-[a-z]+)?\.html(?:#[a-z-]+)?$/.test(item.href), `${item.title} uses a site-local design path`);
  }
}

const currentColor = renderDesignNavigationHtml({ currentId: "color" });
assert.equal((currentColor.match(/aria-current="page"/g) || []).length, 1, "a page-level current item is marked");
assert(currentColor.includes('<a href="/design-color.html" aria-current="page">Colour</a>'), "colour is current when requested");
assert.doesNotMatch(renderDesignNavigationHtml(), /aria-current/, "no current item without currentId");

console.log("Design navigation checks passed: groups, current page, titles and local paths.");
