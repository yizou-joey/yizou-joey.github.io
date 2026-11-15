import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { renderSiteShell, siteShellTemplateFiles } from "./build/site-shell.js";
import { getProjectEntries, projectTemplateFile, renderProjectPage } from "./build/project-pages.js";
import { injectStaticContent } from "./build/static-content.js";
import { fileURLToPath } from "node:url";
import bio from "./contents/bio.js";
import education from "./contents/education.js";
import news from "./contents/news.js";
import publications from "./contents/publications.js";
import services from "./contents/services.js";
import teaching from "./contents/teaching.js";
import {
  compareByDateDesc,
  renderBioHtml,
  renderEducationItemHtml,
  renderListHtml,
  renderNewsItemHtml,
  renderSelectedPublicationsHtml,
  renderServicesItemHtml,
  renderTeachingItemHtml,
} from "./js/renderers.js";

const fail = (message) => {
  throw new Error(message);
};

const projectEntries = getProjectEntries(publications);
const projectPages = projectEntries.map((entry) => entry.projectUrl);
const designFile = fileURLToPath(new URL("./DESIGN.md", import.meta.url));

const renderIndexHtml = (html, fileName) => {
  const injections = [
    {
      id: "bio-intro",
      content: renderBioHtml(bio),
    },
    {
      id: "news-list",
      content: renderListHtml([...news].sort(compareByDateDesc), renderNewsItemHtml),
    },
    {
      id: "publications-list",
      content: renderSelectedPublicationsHtml(publications),
    },
    {
      id: "services-list",
      content: renderListHtml(services, renderServicesItemHtml),
    },
    {
      id: "teaching-list",
      content: renderListHtml(teaching, renderTeachingItemHtml),
    },
  ];

  let renderedHtml = html;
  for (const injection of injections) {
    renderedHtml = injectStaticContent({ html: renderedHtml, fileName, ...injection });
  }

  return renderedHtml;
};

const staticContentHtmlPlugin = () => ({
  name: "static-content-html",
  configureServer(server) {
    server.watcher.add(designFile);
    server.middlewares.use("/DESIGN.md", async (_req, res, next) => {
      try {
        res.setHeader("Content-Type", "text/markdown; charset=utf-8");
        res.end(await readFile(designFile));
      } catch (error) { next(error); }
    });
  },
  async generateBundle() {
    this.emitFile({ type: "asset", fileName: "DESIGN.md", source: await readFile(designFile) });
  },
  handleHotUpdate({ file, server }) {
    if (file !== designFile && file !== projectTemplateFile && !siteShellTemplateFiles.includes(file)) return;
    server.ws.send({ type: "full-reload", path: "*" });
    return [];
  },
  transformIndexHtml: {
    order: "pre",
    async handler(html, ctx) {
      const fileName = path.basename(ctx.filename || "");
      if (fileName === "index.html") {
        html = renderIndexHtml(html, fileName);
      }
      if (projectPages.includes(fileName)) {
        const entry = projectEntries.find((entry) => entry.projectUrl === fileName);
        html = await renderProjectPage(entry);
      }
      if (fileName === "design.html") {
        html = injectStaticContent({ html, fileName, id: "design-publications", content: renderSelectedPublicationsHtml(publications.filter((item) => item.selected).slice(0, 1)) });
        html = injectStaticContent({ html, fileName, id: "design-news", content: renderListHtml(news.slice(0, 1), renderNewsItemHtml) });
        html = injectStaticContent({ html, fileName, id: "design-services", content: renderListHtml(services, renderServicesItemHtml) });
        const citationPage = await renderProjectPage(projectEntries.find((entry) => entry.projectUrl === "dodgeui.html"));
        const citation = citationPage.match(/<section class="project-section project-citation"[\s\S]*?<\/section>/)?.[0];
        if (!citation) fail("Project citation specimen is missing from the project template.");
        html = injectStaticContent({ html, fileName, id: "design-citation", content: citation.replace(/<\/?h2\b/g, (tag) => tag.replace("h2", "h3")) });
      }
      const pageType = fileName === "index.html" ? "home"
        : fileName === "404.html" ? "notFound"
          : fileName === "design.html" ? "document"
          : projectPages.includes(fileName) ? "project" : null;
      if (pageType) html = await renderSiteShell(html, { fileName, pageType });
      if (fileName === "cv.html") {
        html = injectStaticContent({
          html,
          fileName,
          id: "education-list",
          content: renderListHtml(education, renderEducationItemHtml),
        });
      }
      if (["index.html", "404.html", "design.html", "publications.html", "cv.html", ...projectPages].includes(fileName)) {
        const placeholder = /<script\b[^>]*\bdata-theme-bootstrap\b[^>]*>[\s\S]*?<\/script>/gi;
        const matches = [...html.matchAll(placeholder)];
        if (matches.length !== 1 || !/^<script\s+data-theme-bootstrap\s*>\s*<\/script>$/i.test(matches[0][0])) {
          fail(`${fileName} must contain exactly one empty <script data-theme-bootstrap></script>.`);
        }
        const source = await readFile(new URL("./js/theme.js", import.meta.url), "utf8");
        html = html.replace(placeholder, () => `<script data-theme-bootstrap>${source}</script>`);
      }
      if (html.includes("<script data-project-transition></script>")) {
        const source = await readFile(new URL("./js/project-transition.js", import.meta.url), "utf8");
        const styles = await readFile(new URL("./css/styles.css", import.meta.url), "utf8");
        const critical = styles.match(/\/\* Project transition bootstrap start \*\/([\s\S]*?)\/\* Project transition bootstrap end \*\//)?.[1];
        if (!critical) fail("Missing project transition bootstrap styles.");
        html = html.replace("<script data-project-transition></script>", () => `<style>${critical}</style><script>${source}</script>`);
      }
      return html;
    },
  },
});

export default defineConfig({
  appType: "mpa",
  plugins: [staticContentHtmlPlugin(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        notFound: "404.html",
        design: "design.html",
        ...Object.fromEntries(projectPages.map((fileName) => [fileName.replace(/\.html$/, ""), fileName])),
      },
    },
  },
});
