import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { escapeHtml, renderProjectHeadingHtml, renderProjectVideoHtml } from "../js/utils.js";
import { injectStaticContent } from "./static-content.js";
import { renderProjectCitationHtml } from "@site/components/citation/render";

export const projectTemplateFile = fileURLToPath(new URL("../templates/project.html", import.meta.url));

const fail = (message) => {
  throw new Error(message);
};

export const getProjectEntries = (publications) => {
  const entries = publications.filter((entry) => entry.projectUrl);
  const pages = entries.map((entry) => entry.projectUrl);
  if (pages.some((fileName) => !/^[a-z0-9-]+\.html$/.test(fileName))
    || new Set(pages).size !== pages.length) {
    fail("Project URLs must be unique root-level .html filenames.");
  }
  return entries;
};

// Return project HTML before the shared shell and synchronous scripts are expanded.
export const renderProjectPage = async (entry) => {
  const fileName = entry.projectUrl;
  const { project, preview } = entry;
  if (!project?.name || !project.description || !project.abstract
    || !project.abstractVerifiedOn || !entry.doi || !preview?.src || !preview.alt) {
    fail(`${fileName} requires project metadata, an abstract with verification date, DOI, and preview image.`);
  }
  if (project.detailsHtml !== undefined && typeof project.detailsHtml !== "string") {
    fail(`${fileName}: project.detailsHtml must be an authored HTML string.`);
  }
  const { citation } = entry;
  const doi = entry.doi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "");
  const citationDoi = typeof citation?.bibtex === "string"
    ? citation.bibtex.match(/\bdoi\s*=\s*\{([^}]+)\}/i)?.[1] : undefined;
  if (typeof citation?.bibtex !== "string" || !citation.bibtex.trim() || !citation.source
    || !/^\d{4}-\d{2}-\d{2}$/.test(citation.confirmedOn || "")
    || !citationDoi || citationDoi.toLowerCase() !== doi.toLowerCase()) {
    fail(`${fileName} requires a BibTeX citation with source, confirmation date, and matching DOI.`);
  }
  const values = {
    pageTitle: `${project.name} — Yi Zou`,
    description: project.description,
    canonicalUrl: `https://yizou-joey.github.io/${entry.projectUrl}`,
    doi: entry.doi,
    abstractVerifiedOn: project.abstractVerifiedOn,
    abstract: project.abstract,
    imageSrc: preview.src,
    imageAlt: preview.alt,
    citationHtml: renderProjectCitationHtml(citation.bibtex),
  };
  let html = await readFile(projectTemplateFile, "utf8");
  html = html.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    // Renderer-owned fragments are markup; metadata stays escaped. Authored details are the only raw content field.
    if (key === "videoHtml") return renderProjectVideoHtml(entry);
    if (key === "citationHtml") return values.citationHtml;
    if (key === "detailsHtml") return project.detailsHtml?.trim()
      ? `<div class="project-details type-body-bio">${project.detailsHtml}</div>` : "";
    if (key === "imageClass") return preview.fit === "contain" ? ' class="project-image--contain"' : "";
    if (!(key in values)) fail(`Unknown project template field: ${key}`);
    return escapeHtml(values[key]);
  });
  return injectStaticContent({ html, fileName, id: "project-heading", content: renderProjectHeadingHtml(entry) });
};
