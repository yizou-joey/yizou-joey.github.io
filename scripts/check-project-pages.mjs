import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import config from "../vite.config.js";
import publications from "../contents/publications.js";
import { renderPublicationItemHtml, renderProjectVideoHtml } from "../js/utils.js";

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

for (const project of projects) {
  const html = await render(project);
  const heading = html.slice(html.indexOf('id="project-heading"'), html.indexOf('<section class="project-intro"'));
  assert(heading.includes('aria-label="Project resources"'), "Paper resources belong to the project heading");
  const resourcesStart = html.indexOf('aria-label="Project resources"');
  const videoStart = html.indexOf('aria-labelledby="project-video-title"');
  const resources = html.slice(resourcesStart, html.indexOf('</nav>', resourcesStart));
  assert(html.indexOf('class="project-copy"') < html.indexOf('class="project-media"'), "Reading order matches the narrow layout: abstract before figure");
  assert(resourcesStart < heading.length + html.indexOf('id="project-heading"'), "Resources remain within the project heading");
  assert(resourcesStart < videoStart, "Resources precede the video");
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

const messages = [];
const server = { ws: { send: (message) => messages.push(message) } };
const template = fileURLToPath(new URL("../templates/project.html", import.meta.url));
assert.deepEqual(plugin.handleHotUpdate({ file: template, server }), []);
assert.deepEqual(messages, [{ type: "full-reload", path: "*" }]);
assert.equal(plugin.handleHotUpdate({ file: fileURLToPath(new URL("../index.html", import.meta.url)), server }), undefined);
assert.equal(messages.length, 1, "Unrelated files retain Vite's normal update behavior");
console.log("Project page checks passed: optional details, shared shell, escaping, isolation and template reload.");
