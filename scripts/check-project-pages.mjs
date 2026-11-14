import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import config from "../vite.config.js";
import publications from "../contents/publications.js";
import { getProjectEntries, renderProjectPage } from "../build/project-pages.js";
import { renderPublicationItemHtml, renderProjectVideoHtml } from "../js/utils.js";

const plugin = config.plugins.find((item) => item.name === "static-content-html");
const projects = publications.filter((entry) => entry.projectUrl);
const render = (entry) => plugin.transformIndexHtml.handler("", { filename: entry.projectUrl });
const entry = projects[0];
for (const [project, key, pages] of [
  [projects[0], "11489759", "1100--1101"],
  [projects[1], "11489824", "368--372"],
]) {
  assert(project.citation.bibtex.startsWith(`@INPROCEEDINGS{${key},\n`));
  assert(!/^\s*(volume|number|keywords)\s*=/m.test(project.citation.bibtex));
  assert(project.citation.bibtex.includes(`  pages={${pages}},`));
  assert(project.citation.bibtex.endsWith("}\n}"), "Final entry brace has its own line");
  assert.equal(project.citation.source, "edited-user-confirmed-export");
  assert.equal(project.citation.confirmedOn, "2026-11-14");
}
assert.deepEqual(getProjectEntries([...projects, { title: "No project page" }]), projects);
assert.throws(() => getProjectEntries([entry, { ...entry }]), /unique root-level/);
assert.throws(() => getProjectEntries([{ ...entry, projectUrl: "nested/project.html" }]), /unique root-level/);
for (const field of ["name", "description", "abstract", "abstractVerifiedOn"]) {
  await assert.rejects(renderProjectPage({ ...entry, project: { ...entry.project, [field]: "" } }),
    /requires project metadata/, `Missing project.${field} must still fail`);
}
for (const incomplete of [
  { ...entry, doi: "" },
  { ...entry, preview: { ...entry.preview, src: "" } },
  { ...entry, preview: { ...entry.preview, alt: "" } },
]) {
  await assert.rejects(renderProjectPage(incomplete), /requires project metadata/);
}
for (const citation of [undefined, { ...entry.citation, bibtex: "" },
  { ...entry.citation, bibtex: entry.citation.bibtex.replace(".00233", ".00072") },
  { ...entry.citation, source: "" },
  { ...entry.citation, confirmedOn: "" }]) {
  await assert.rejects(renderProjectPage({ ...entry, citation }), /requires a BibTeX citation/);
}
const escapedCitation = { ...entry.citation, bibtex: entry.citation.bibtex.replace("DodgeUI:", "DodgeUI: <tag> & text") };
assert((await renderProjectPage({ ...entry, citation: escapedCitation })).includes("&lt;tag&gt; &amp; text"), "Citation text must be HTML escaped");
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

for (const project of projects) {
  const html = await render(project);
  const heading = html.slice(html.indexOf('id="project-heading"'), html.indexOf('<section class="project-intro"'));
  assert(heading.includes('aria-label="Project resources"'), "Paper resources belong to the project heading");
  const resourcesStart = html.indexOf('aria-label="Project resources"');
  const videoStart = html.indexOf('aria-labelledby="project-video-title"');
  const citationStart = html.indexOf('aria-labelledby="project-citation-title"');
  const resources = html.slice(resourcesStart, html.indexOf('</nav>', resourcesStart));
  assert(html.indexOf('class="project-copy"') < html.indexOf('class="project-media"'), "Reading order matches the narrow layout: abstract before figure");
  assert(resourcesStart < heading.length + html.indexOf('id="project-heading"'), "Resources remain within the project heading");
  assert(resourcesStart < videoStart, "Resources precede the video");
  assert(citationStart > videoStart && citationStart < html.indexOf("</main>"), "Citation follows video inside main");
  assert(html.includes(`<code>${project.citation.bibtex}</code>`), "Static citation preserves canonical text");
  assert(html.includes('<pre class="project-citation-code"><code>') && html.includes('aria-label="Copy BibTeX" hidden'), "Wrapped citation needs no scroll tab stop and copy is progressively enhanced");
  assert(resources.includes(project.posterUrl || project.slidesUrl));
  assert(resources.includes(project.doi));
  assert(!resources.includes(project.youtubeUrl), "Video link belongs to its own section");
  assert(html.includes(`>${project.youtubeLabel}</h2>`));
  assert(html.includes('loading="eager"') && html.includes('allowfullscreen'));
  assert(html.includes('<link rel="preconnect" href="https://www.youtube-nocookie.com" />'));
  assert(html.includes('referrerpolicy="strict-origin-when-cross-origin"'));
  assert(html.includes('youtube-nocookie.com/embed/') && !html.includes('autoplay=1'));
  assert(!html.includes('Watch on YouTube'), "No standalone link below the player");
  assert(renderPublicationItemHtml(project).includes(project.youtubeUrl.replaceAll('&', '&amp;')), "Homepage retains its original video link");
}
assert((await render(projects[1])).includes('start=1'), "Existing video timestamp survives embedding");
assert.equal(renderProjectVideoHtml({}), "", "Missing video produces no empty section");
assert.throws(() => renderProjectVideoHtml({ youtubeUrl: "https://example.com/watch?v=6GY7u8pQ9s8" }), /YouTube video/);

const citationScript = await readFile(new URL("../js/project-citation.js", import.meta.url), "utf8");
for (const mode of ["success", "insecure", "rejected", "failure", "throws"]) {
  let handler;
  let copied;
  let removed = false;
  let restoredFocus = false;
  let restoredRange = false;
  let timerId = 0;
  const timers = new Map();
  const range = { cloneRange: () => "saved range" };
  const selection = { rangeCount: 1, getRangeAt: () => range, removeAllRanges: () => {}, addRange: (value) => { restoredRange = value === "saved range"; } };
  const field = { setAttribute: () => {}, select: () => {}, remove: () => { removed = true; } };
  const code = { textContent: entry.citation.bibtex };
  const button = { hidden: true, attributes: new Set(), addEventListener: (_event, callback) => { handler = callback; },
    toggleAttribute(name, enabled) { if (enabled) this.attributes.add(name); else this.attributes.delete(name); },
    removeAttribute(name) { this.attributes.delete(name); } };
  const status = { textContent: "", attributes: new Set(),
    toggleAttribute(name, enabled) { if (enabled) this.attributes.add(name); else this.attributes.delete(name); },
    removeAttribute(name) { this.attributes.delete(name); } };
  const elements = { code, ".project-citation-copy": button, ".project-citation-status": status };
  runInNewContext(citationScript, {
    document: { querySelector: () => ({ querySelector: (selector) => elements[selector] }),
      activeElement: { focus: () => { restoredFocus = true; } }, createElement: () => field,
      body: { append: () => {} }, execCommand: () => {
        if (mode === "throws") throw new Error("Denied");
        if (mode === "failure") return false;
        copied = field.value;
        return true;
      } },
    window: { isSecureContext: !["insecure", "failure", "throws"].includes(mode), getSelection: () => selection },
    navigator: { clipboard: { writeText: async (text) => {
      if (mode === "rejected") throw new Error("Denied");
      copied = text;
    } } },
    setTimeout: (callback, delay) => { assert.equal(delay, 2000); timers.set(++timerId, callback); return timerId; },
    clearTimeout: (id) => timers.delete(id),
  });
  assert.equal(button.hidden, false);
  await handler();
  const success = !["failure", "throws"].includes(mode);
  assert.equal(status.textContent, success ? "BibTeX copied." : "Copy failed.");
  assert.equal(copied, success ? code.textContent : undefined);
  assert.equal(button.attributes.has("data-copied"), success);
  assert.equal(status.attributes.has("data-failed"), !success);
  assert.equal(removed, mode !== "success");
  assert.equal(restoredFocus, mode !== "success");
  assert.equal(restoredRange, mode !== "success");
  await handler();
  assert.equal(timers.size, 1, "Repeated clicks replace the feedback timer");
  [...timers.values()][0]();
  assert.equal(status.textContent, "");
  assert.equal(button.attributes.has("data-copied"), false);
  assert.equal(status.attributes.has("data-failed"), false);
}

const messages = [];
const server = { ws: { send: (message) => messages.push(message) } };
const template = fileURLToPath(new URL("../templates/project.html", import.meta.url));
assert.deepEqual(plugin.handleHotUpdate({ file: template, server }), []);
assert.deepEqual(messages, [{ type: "full-reload", path: "*" }]);
assert.equal(plugin.handleHotUpdate({ file: fileURLToPath(new URL("../index.html", import.meta.url)), server }), undefined);
assert.equal(messages.length, 1, "Unrelated files retain Vite's normal update behavior");
console.log("Project page checks passed: optional details, shared shell, escaping, isolation and template reload.");
