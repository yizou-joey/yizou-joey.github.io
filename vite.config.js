import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs/promises";
import path from "node:path";
import { CONTENT_SCHEMAS } from "./js/site-contracts.js";
import { parseListData } from "./js/utils.js";
import {
  compareByDateDesc,
  renderBioHtml,
  renderEducationItemHtml,
  renderListHtml,
  renderNewsItemHtml,
  renderPublicationsByYearHtml,
  renderSelectedPublicationsHtml,
  renderServicesItemHtml,
  renderTeachingItemHtml,
} from "./js/renderers.js";

const root = process.cwd();

const readUtf8 = (filePath) => fs.readFile(path.join(root, filePath), "utf8");

const fail = (message) => {
  throw new Error(message);
};

const readList = async (schemaName, sortFn) => {
  const schema = CONTENT_SCHEMAS[schemaName];
  if (!schema) fail(`Unknown content schema: ${schemaName}`);
  const markdown = await readUtf8(schema.path);
  const items = parseListData(markdown);
  return sortFn ? [...items].sort(sortFn) : items;
};

const injectStaticContent = ({ html, fileName, id, content, sourceHasContent }) => {
  if (sourceHasContent && !String(content || "").trim()) {
    fail(`${fileName} target #${id} would receive empty static content.`);
  }

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

const requireStaticMarker = ({ html, fileName, id }) => {
  const pattern = new RegExp(
    `<[a-z0-9]+\\b(?=[^>]*\\bid="${id}"(?:\\s|>|\\/))(?=[^>]*\\bdata-content-rendered="static"(?:\\s|>|\\/))[^>]*>`,
    "i"
  );
  if (!pattern.test(html)) {
    fail(`${fileName} target #${id} was not marked as statically rendered.`);
  }
};

const assertNoLoadingText = ({ html, fileName }) => {
  if (/Loading bio\.\.\./.test(html)) {
    fail(`${fileName} still contains the old visible loading text.`);
  }
};

const renderIndexHtml = async (html, fileName) => {
  const bioMarkdown = await readUtf8("contents/bio.md");
  const publications = await readList("publications");
  const news = await readList("news", compareByDateDesc);
  const education = await readList("education");
  const services = await readList("services");
  const teaching = await readList("teaching");

  const injections = [
    {
      id: "bio-intro",
      content: renderBioHtml(bioMarkdown),
      sourceHasContent: Boolean(bioMarkdown.trim()),
    },
    {
      id: "news-list",
      content: renderListHtml(news, renderNewsItemHtml),
      sourceHasContent: news.length > 0,
    },
    {
      id: "publications-list",
      content: renderSelectedPublicationsHtml(publications),
      sourceHasContent: publications.some((item) => String(item?.selected || "").trim()),
    },
    {
      id: "education-list",
      content: renderListHtml(education, renderEducationItemHtml),
      sourceHasContent: education.length > 0,
    },
    {
      id: "services-list",
      content: renderListHtml(services, renderServicesItemHtml),
      sourceHasContent: services.length > 0,
    },
    {
      id: "teaching-list",
      content: renderListHtml(teaching, renderTeachingItemHtml),
      sourceHasContent: teaching.length > 0,
    },
  ];

  let renderedHtml = html;
  for (const injection of injections) {
    renderedHtml = injectStaticContent({ html: renderedHtml, fileName, ...injection });
  }

  assertNoLoadingText({ html: renderedHtml, fileName });
  injections.forEach(({ id }) => requireStaticMarker({ html: renderedHtml, fileName, id }));
  return renderedHtml;
};

const renderPublicationsHtml = async (html, fileName) => {
  const publications = await readList("publications", compareByDateDesc);
  const injection = {
    id: "publications-by-year",
    content: renderPublicationsByYearHtml(publications),
    sourceHasContent: publications.length > 0,
  };

  const renderedHtml = injectStaticContent({ html, fileName, ...injection });
  assertNoLoadingText({ html: renderedHtml, fileName });
  requireStaticMarker({ html: renderedHtml, fileName, id: injection.id });
  return renderedHtml;
};

const staticContentHtmlPlugin = () => ({
  name: "static-content-html",
  transformIndexHtml: {
    order: "pre",
    async handler(html, ctx) {
      const fileName = path.basename(ctx.filename || "");
      if (fileName === "index.html") {
        return renderIndexHtml(html, fileName);
      }
      if (fileName === "publications.html") {
        return renderPublicationsHtml(html, fileName);
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
        publications: "publications.html",
        notFound: "404.html",
      },
    },
  },
});
