import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import config from "../vite.config.js";
import publications from "../contents/publications.js";
import { getProjectEntries, renderProjectPage } from "../build/project-pages.js";
import { renderProjectCitationHtml } from "@site/components/citation/render";
import { initializeProjectCitationBehavior } from "@site/components/citation/behavior";
import { renderPublicationItemHtml, renderProjectVideoHtml } from "../js/utils.js";
import {
  renderProjectHeadingHtml as renderPackageProjectHeadingHtml,
  renderPublicationItemHtml as renderPackagePublicationItemHtml,
  renderSelectedPublicationsHtml as renderPackageSelectedPublicationsHtml,
} from "@site/components/publication/render";
import { renderNewsInline as renderPackageNewsInline } from "@site/components/shared/render";
import { renderNewsItemHtml, renderSelectedPublicationsHtml, renderServicesItemHtml } from "../js/renderers.js";
import { renderServiceItemHtml as renderPackageServiceItemHtml } from "@site/components/service/render";

const plugin = config.plugins.find((item) => item.name === "static-content-html");
const projects = publications.filter((entry) => entry.projectUrl);
const render = (entry) => plugin.transformIndexHtml.handler("", { filename: entry.projectUrl });
const entry = projects[0];
const headingFixture = {
  venue: "IEEE VR",
  venueKey: "ieee-vr",
  venueUrl: "https://example.test/venue?a=1&b=2",
  type: "W",
  workshopLabel: "VR & UX",
  typeLink: "https://example.test/type?a=1&b=2",
  award: "Best <Paper> & Demo",
  title: 'A **bold** <title> & [link](https://example.test/?a=1&b=2)',
  authors: "A. Author\\*",
  projectUrl: "sample.html",
  paperUrl: "https://example.test/paper?a=1&b=2",
};
assert.equal(renderPackageProjectHeadingHtml(headingFixture),
  '<div class="project-heading-copy"><div class="project-labels"><div class="publication-eyebrow venue-ieee-vr"><span class="publication-eyebrow-venue"><a href="https://example.test/venue?a=1&amp;b=2" class="inline-link news-venue-link news-venue-token venue-ieee-vr" data-venue="ieee-vr" target="_blank" rel="noopener noreferrer">IEEE VR</a></span><span class="publication-eyebrow-group"><span class="publication-eyebrow-separator" aria-hidden="true"></span><span>Workshop<span class="publication-eyebrow-dash">·</span><a href="https://example.test/type?a=1&amp;b=2" target="_blank" rel="noopener noreferrer" class="inline-link news-venue-link venue-ieee-vr">VR &amp; UX</a></span></span><span class="publication-eyebrow-group"><span class="publication-eyebrow-separator" aria-hidden="true"></span><span class="publication-eyebrow-status publication-eyebrow-award">BEST &lt;PAPER&gt; &amp; DEMO</span></span></div></div><h1 class="project-title">A <strong>bold</strong> &lt;title&gt; &amp; <a href="https://example.test/?a=1&amp;b=2" class="inline-link" target="_blank" rel="noopener noreferrer">link</a></h1><p class="publication-authors-serif">A. Author<sup>*</sup></p></div><nav class="project-resources" aria-label="Project resources"><div class="publication-bracket-links"><a href="https://example.test/paper?a=1&amp;b=2" target="_blank" rel="noopener noreferrer">[<span class="bracket-text">Paper</span>]</a></div></nav>',
  "Migrated project-heading renderer preserves the approved legacy reference fixture exactly");
assert.equal(renderPackageNewsInline({
  text: 'Award & **MMSys** <tag>', venue: "MMSys", venueKey: "mmsys",
  venueUrl: "https://example.test/?a=1&b=2", award: "Not present",
}), 'Award &amp; <strong><a href="https://example.test/?a=1&amp;b=2" class="inline-link news-venue-link news-venue-token venue-mmsys" data-venue="mmsys" target="_blank" rel="noopener noreferrer">MMSys</a></strong> &lt;tag&gt;',
"Migrated shared news-inline renderer preserves escaping and venue-link output");
assert.equal(renderNewsItemHtml({ date: "2026-11-16", text: "MMSys & news", venue: "MMSys", venueKey: "mmsys", venueUrl: "https://example.test/news" }),
  '<li class="news-entry"><article class="editorial-news-row"><div class="editorial-date-column"><div class="editorial-date-start editorial-news-date"><span>Nov. 16<span class="editorial-news-date-separator">,</span></span> <span>2026</span></div></div><div class="editorial-news-content"><div class="news-copy"><a href="https://example.test/news" class="inline-link news-venue-link news-venue-token venue-mmsys" data-venue="mmsys" target="_blank" rel="noopener noreferrer">MMSys</a> &amp; news</div></div></article></li>',
  "News caller retains the exact legacy static output through the package shared rules");
const serviceFixture = {
  date: "2026-11-16", role: "Program Chair", event: "[MMSys](https://example.test)",
  eventEdition: "2026", eventFullName: "ACM Multimedia Systems", location: "Somewhere",
  venueKey: "mmsys",
};
assert.equal(renderServicesItemHtml(serviceFixture), renderPackageServiceItemHtml(serviceFixture),
  "Service list caller and package public service renderer produce identical rows");
for (const callerPath of ["../build/project-pages.js", "../vite.config.js"]) {
  const caller = await readFile(new URL(callerPath, import.meta.url), "utf8");
  assert(caller.includes('from "@site/components/citation/render"'), `${callerPath} imports the package public render entry directly`);
  assert(!caller.includes("build/project-citation.js"), `${callerPath} does not route through an intermediate re-export`);
}
const citationHtml = renderProjectCitationHtml(entry.citation.bibtex);
assert(citationHtml.includes(`<pre class="project-citation-code"><code>${entry.citation.bibtex}</code></pre>`),
  "Shared citation output preserves the canonical BibTeX text exactly");
assert(citationHtml.includes('aria-label="Copy BibTeX" hidden') && citationHtml.includes('role="status"'),
  "Shared citation retains progressive enhancement and accessible status markup");
assert(renderProjectCitationHtml('<&"').includes("&lt;&amp;&quot;"),
  "Shared citation escapes special characters");
assert.throws(() => renderProjectCitationHtml("text", { headingLevel: "h1" }), /Unsupported project citation heading level/);
assert.doesNotThrow(() => initializeProjectCitationBehavior(), "Package behavior import and no-DOM call are SSR-safe");
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
  assert.equal(renderPublicationItemHtml(project), renderPackagePublicationItemHtml(project),
    "js/utils.js compatibility export delegates to the public package publication renderer");
  assert(renderPublicationItemHtml(project).includes(project.youtubeUrl.replaceAll('&', '&amp;')), "Homepage retains its original video link");
}
assert((await render(projects[1])).includes('start=1'), "Existing video timestamp survives embedding");
assert.equal(renderProjectVideoHtml({}), "", "Missing video produces no empty section");
assert.throws(() => renderProjectVideoHtml({ youtubeUrl: "https://example.com/watch?v=6GY7u8pQ9s8" }), /YouTube video/);

const designSource = await readFile(new URL("../design-components.html", import.meta.url), "utf8");
const design = await plugin.transformIndexHtml.handler(designSource, { filename: "design-components.html" });
const indexSource = await readFile(new URL("../index.html", import.meta.url), "utf8");
const homepage = await plugin.transformIndexHtml.handler(indexSource, { filename: "index.html" });
const selectedRows = publications.filter((item) => item.selected);
assert.equal(renderSelectedPublicationsHtml(selectedRows), renderPackageSelectedPublicationsHtml(selectedRows),
  "js/renderers.js forwards homepage/Design publication output to the same package API");
assert(homepage.includes(renderPackageSelectedPublicationsHtml(selectedRows)),
  "Homepage output contains the package-rendered selected publication rows");
assert(design.includes(renderPackageSelectedPublicationsHtml(selectedRows.slice(0, 1))),
  "Design output contains its package-rendered publication specimen");
const publicationPackageSource = await readFile(new URL("../packages/site-components/src/publication/render.js", import.meta.url), "utf8");
assert(!/from\s+["'](?:\.\.\/\.\.\/|\.\.\/\.\.\/\.\.\/)?(?:js|contents|build)\//.test(publicationPackageSource),
  "Publication package renderer must not import site modules");
assert(publicationPackageSource.includes('../shared/inline-markdown.js')
  && publicationPackageSource.includes('../shared/news-inline.js')
  && publicationPackageSource.includes('../shared/venue.js'),
"Publication renderer consumes shared rules from responsibility-specific modules");
const siteRenderersSource = await readFile(new URL("../js/renderers.js", import.meta.url), "utf8");
assert(siteRenderersSource.includes('from "@site/components/shared/date"'),
  "Site renderers consume date formatting from its shared package entry");
const siteUtilsSource = await readFile(new URL("../js/utils.js", import.meta.url), "utf8");
assert(siteUtilsSource.includes('from "@site/components/shared/render"'),
  "Site utility compatibility exports consume shared rendering from its shared package entry");
const citationSection = (html) => html.match(/<section class="project-section project-citation"[\s\S]*?<\/section>/)?.[0];
const designCitation = citationSection(design);
assert(designCitation, "Design guide renders the project citation specimen");
assert.equal(designCitation, renderProjectCitationHtml(projects[0].citation.bibtex, { headingLevel: "h3" }),
  "Guide calls the shared renderer directly at its required heading level");
assert.equal(citationSection(await render(projects[0])), citationHtml,
  "Project template calls the shared renderer at its required heading level");
assert(design.includes('src="/js/project-citation.js"'), "Guide citation uses the project copy control");

const citationScript = `${(await readFile(new URL("../packages/site-components/src/citation/behavior.js", import.meta.url), "utf8")).replace("export const", "const")}\ninitializeProjectCitationBehavior();`;
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
