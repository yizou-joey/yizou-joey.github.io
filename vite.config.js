import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
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
  renderPublicationsByYearHtml,
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
      id: "education-list",
      content: renderListHtml(education, renderEducationItemHtml),
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

const renderPublicationsHtml = (html, fileName) => {
  const injection = {
    id: "publications-by-year",
    content: renderPublicationsByYearHtml([...publications].sort(compareByDateDesc)),
  };

  return injectStaticContent({ html, fileName, ...injection });
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
