import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { escapeHtml } from "../js/utils.js";

const templates = Object.fromEntries(["head", "header", "footer"].map((name) => [
  name, new URL(`../templates/site-${name}.html`, import.meta.url),
]));

export const siteShellTemplateFiles = Object.values(templates).map(fileURLToPath);

const site = {
  brand: "Yi",
  homeLabel: "Home",
  homeUrl: "/",
  copyright: "© 2026 Yi Zou",
  updated: "2026-09",
  updatedLabel: "Sep 2026",
};

// Only published page types use this shell. Legacy pages keep their own markup.
const profiles = {
  home: { currentHome: true, decoratedFooter: true, fullFonts: true, video: false },
  project: { currentHome: false, decoratedFooter: false, fullFonts: true, video: true },
  notFound: { currentHome: false, decoratedFooter: true, fullFonts: false, video: false },
};

const bootstrap = `<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<script data-theme-bootstrap></script>`;

const renderTemplate = async (name, values, markup = {}) => {
  const source = await readFile(templates[name], "utf8");
  return source.trimEnd().replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    // Markup is authored here; all data values are escaped.
    if (Object.hasOwn(markup, key)) return markup[key];
    if (!Object.hasOwn(values, key)) throw new Error(`Unknown site ${name} field: ${key}`);
    return escapeHtml(values[key]);
  });
};

export const renderSiteShell = async (html, { fileName, pageType }) => {
  const profile = profiles[pageType];
  if (!profile) throw new Error(`Unknown site page type: ${pageType}`);
  const fontFamilies = profile.fullFonts
    ? "JetBrains+Mono:wght@400;500;600&family=Noto+Serif+SC:wght@400;500;600&family=Shantell+Sans:wght@400"
    : "Noto+Serif+SC:wght@400";
  const homeLink = profile.currentHome
    ? `<span class="site-header-link" aria-current="page">${escapeHtml(site.homeLabel)}</span>`
    : `<a class="site-header-link" href="${escapeHtml(site.homeUrl)}">${escapeHtml(site.homeLabel)}</a>`;
  const [head, header, footer] = await Promise.all([
    renderTemplate("head", { fontStylesheet: `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap` }, {
      preconnectHtml: profile.video ? '<link rel="preconnect" href="https://www.youtube-nocookie.com" />' : "",
    }),
    renderTemplate("header", site, { homeLink }),
    renderTemplate("footer", {
      ...site,
      footerInnerClass: `page-colophon-inner${profile.decoratedFooter ? "" : " page-colophon-inner--text-only"}`,
    }, {
      decorationHtml: profile.decoratedFooter ? '<span class="halftone-colophon" aria-hidden="true"></span>' : "",
    }),
  ]);
  for (const [name, content] of Object.entries({ bootstrap, head, header, footer })) {
    const marker = `<!-- site:${name} -->`;
    if (html.split(marker).length !== 2) {
      throw new Error(`${fileName} must contain exactly one ${marker}.`);
    }
    html = html.replace(marker, () => content);
  }
  return html;
};
