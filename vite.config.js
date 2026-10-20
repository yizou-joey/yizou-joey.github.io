import { defineConfig } from "vite";
import { renderProjectHeadingHtml } from "./js/utils.js";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { readFile } from "node:fs/promises";
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

const injectStaticContent = ({ html, fileName, id, content }) => {
  const pattern = new RegExp(
    `(<([a-z0-9]+)\\b(?=[^>]*\\bid="${id}"(?:\\s|>|\\/))[^>]*)(>)([\\s\\S]*?)(<\\/\\2>)`,
    "i"
  );
  const match = html.match(pattern);
  if (!match) fail(`${fileName} is missing target container #${id}.`);

  const openTag = match[1].includes("data-content-rendered=")
    ? match[1]
    : `${match[1]} data-content-rendered="static"`;

  return html.replace(pattern, `${openTag}>${content}${match[5]}`);
};

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
  transformIndexHtml: {
    order: "pre",
    async handler(html, ctx) {
      const fileName = path.basename(ctx.filename || "");
      if (fileName === "index.html") {
        html = renderIndexHtml(html, fileName);
      }
      if (fileName === "dodgeui.html") {
        const entries = publications.filter((entry) => entry.projectUrl === fileName);
        if (entries.length !== 1) fail(`${fileName} requires exactly one matching publication.`);
        html = injectStaticContent({ html, fileName, id: "project-heading", content: renderProjectHeadingHtml(entries[0]) });
      }
      if (fileName === "cv.html") {
        html = injectStaticContent({
          html,
          fileName,
          id: "education-list",
          content: renderListHtml(education, renderEducationItemHtml),
        });
      }
      if (["index.html", "404.html", "publications.html", "cv.html", "dodgeui.html"].includes(fileName)) {
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
        dodgeui: "dodgeui.html",
      },
    },
  },
});
