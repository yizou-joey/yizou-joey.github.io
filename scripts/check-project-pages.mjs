import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import config from "../vite.config.js";
import publications from "../contents/publications.js";

const plugin = config.plugins.find((item) => item.name === "static-content-html");
const projects = publications.filter((entry) => entry.projectUrl);
const render = (entry) => plugin.transformIndexHtml.handler("", { filename: entry.projectUrl });
const entry = projects[0];
const original = { ...entry.project };
const baseline = await render(entry);
assert(!baseline.includes('class="project-details'));
try {
  entry.project.detailsHtml = "   ";
  assert.equal(await render(entry), baseline, "Empty details must not change the page");
  const details = '<section aria-labelledby="method"><h2 id="method" class="type-title-section">Method</h2><p>Text with <em>emphasis</em> &amp; a figure.</p></section>';
  entry.project.detailsHtml = details;
  const extended = await render(entry);
  assert(extended.includes(details), "Authored details retain semantic markup");
  assert.equal(extended.replace(`<div class="project-details type-body-bio">${details}</div>`, ""), baseline,
    "Adding details must preserve the shared opening and navigation");
  for (const other of projects.slice(1)) {
    assert(!(await render(other)).includes(details), "Details belong only to their project");
  }
  entry.project.description = 'A "quoted" <description> & metadata';
  assert((await render(entry)).includes("A &quot;quoted&quot; &lt;description&gt; &amp; metadata"));
  entry.project.detailsHtml = {};
  await assert.rejects(render(entry), /detailsHtml must be an authored HTML string/);
} finally {
  entry.project = original;
}

const messages = [];
const server = { ws: { send: (message) => messages.push(message) } };
const template = fileURLToPath(new URL("../templates/project.html", import.meta.url));
assert.deepEqual(plugin.handleHotUpdate({ file: template, server }), []);
assert.deepEqual(messages, [{ type: "full-reload", path: "*" }]);
assert.equal(plugin.handleHotUpdate({ file: fileURLToPath(new URL("../index.html", import.meta.url)), server }), undefined);
assert.equal(messages.length, 1, "Unrelated files retain Vite's normal update behavior");
console.log("Project page checks passed: optional details, shared shell, escaping, isolation and template reload.");
