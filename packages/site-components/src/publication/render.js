import { escapeHtml } from "../escape-html.js";
import { renderInlineMarkdown } from "../shared/inline-markdown.js";
import { renderNewsInline } from "../shared/news-inline.js";
import { getVenueConfig, normalizeVenueKey } from "../shared/venue.js";
import { normalizeInlineText } from "../shared/text.js";

const renderAuthors = (value) => {
  if (!value) return "";
  const token = "__CORR_STAR__";
  const escaped = value.replace(/\\\*/g, token)
    .replace(/\*+/g, (stars) => (stars === "**" ? stars : token.repeat(stars.length)));
  return renderInlineMarkdown(escaped).replace(new RegExp(token, "g"), "<sup>*</sup>");
};

const PUBLICATION_TYPE_ORDER = ["C", "J", "W", "P"];
const PUBLICATION_TYPE_LABEL = { C: "Conference", J: "Journal", W: "Workshop", P: "Poster" };
const normalizePublicationType = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  return PUBLICATION_TYPE_ORDER.includes(normalized) ? normalized : "W";
};
const PUBLICATION_SUPPLEMENT_FIELDS = [
  { key: "paperUrl", label: "Paper" },
  { key: "youtubeUrl", label: "Video", customLabelKey: "youtubeLabel" },
  { key: "videoUrl", label: "Video" }, { key: "demoUrl", label: "Demo" },
  { key: "arxivUrl", label: "arXiv" }, { key: "pdfUrl", label: "PDF" },
  { key: "slidesUrl", label: "Slides" }, { key: "posterUrl", label: "Poster" },
  { key: "codeUrl", label: "Code" }, { key: "doi", label: "DOI" },
];
const getPublicationSupplementLinks = (entry) => PUBLICATION_SUPPLEMENT_FIELDS.reduce((acc, field) => {
  const href = (entry?.[field.key] || "").trim();
  if (!href || acc.some((item) => item.href === href)) return acc;
  const customLabel = field.customLabelKey ? String(entry?.[field.customLabelKey] || "").trim() : "";
  acc.push({ href, label: customLabel || field.label });
  return acc;
}, []);

const renderPublicationEyebrowHtml = (entry, { linkMetadata = false } = {}) => {
  const type = normalizePublicationType(entry.type);
  const typeLabel = PUBLICATION_TYPE_LABEL[type] || "Workshop";
  const workshopLabel = String(entry.workshopLabel || "").trim();
  const venueKey = normalizeVenueKey(entry);
  const venueConfig = getVenueConfig(venueKey);
  const venueClass = venueConfig ? ` ${venueConfig.className}` : "";
  const awardLabel = normalizeInlineText(entry.award);
  const statusLabel = awardLabel || normalizeInlineText(entry.status);
  const typeLinkUrl = String(entry.typeLink || "").trim();
  const eyebrowParts = [
    `<span class="publication-eyebrow-venue">${linkMetadata && entry.venueUrl ? renderNewsInline({ ...entry, text: entry.venue, award: "", awardText: "" }) : escapeHtml(entry.venue || "")}</span>`,
  ];
  if (type === "W" && workshopLabel) {
    const workshopHtml = escapeHtml(workshopLabel.toUpperCase());
    eyebrowParts.push(linkMetadata && typeLinkUrl
      ? `<span>${escapeHtml(typeLabel)}<span class="publication-eyebrow-dash">·</span><a href="${escapeHtml(typeLinkUrl)}" target="_blank" rel="noopener noreferrer" class="inline-link news-venue-link${venueClass}">${workshopHtml}</a></span>`
      : `<span>${escapeHtml(typeLabel)}<span class="publication-eyebrow-dash">·</span>${workshopHtml}</span>`);
  } else eyebrowParts.push(`<span>${escapeHtml(typeLabel)}</span>`);
  if (statusLabel) {
    const statusClass = awardLabel ? "publication-eyebrow-status publication-eyebrow-award" : "publication-eyebrow-status";
    eyebrowParts.push(`<span class="${statusClass}">${escapeHtml(statusLabel.toUpperCase())}</span>`);
  }
  const eyebrowHtml = eyebrowParts.map((part, index) => index === 0 ? part
    : `<span class="publication-eyebrow-group"><span class="publication-eyebrow-separator" aria-hidden="true"></span>${part}</span>`).join("");
  return `<div class="publication-eyebrow${venueClass}">${eyebrowHtml}</div>`;
};

export const renderPublicationTitleHtml = (entry) => renderInlineMarkdown(
  String(entry.title || "").replace(/\s+/g, " ").trim(), { preserveLineBreaks: false });
const renderPublicationAuthorsHtml = (entry) =>
  `<p class="publication-authors-serif">${renderAuthors(entry.authors || "")}</p>`;
const renderPublicationLinksHtml = (entry, { excludeYoutube = false } = {}) => {
  const links = getPublicationSupplementLinks(entry)
    .filter((link) => !excludeYoutube || link.href !== entry.youtubeUrl?.trim())
    .map((supplement) => `<a href="${escapeHtml(supplement.href)}" target="_blank" rel="noopener noreferrer">[<span class="bracket-text">${escapeHtml(supplement.label)}</span>]</a>`).join("");
  return links ? `<div class="publication-bracket-links">${links}</div>` : "";
};
export const renderProjectResourcesHtml = (entry) => {
  const links = renderPublicationLinksHtml(entry, { excludeYoutube: true });
  return links ? `<nav class="project-resources" aria-label="Project resources">${links}</nav>` : "";
};
export const renderProjectHeadingHtml = (entry) =>
  `<div class="project-heading-copy"><div class="project-labels">${renderPublicationEyebrowHtml(entry, { linkMetadata: true })}</div><h1 class="project-title">${renderPublicationTitleHtml(entry)}</h1>${renderPublicationAuthorsHtml(entry)}</div>${renderProjectResourcesHtml(entry)}`;

export const renderPublicationItemHtml = (item) => {
  const entry = item || {};
  const normalizedTitle = String(entry.title || "").replace(/\s+/g, " ").trim();
  const renderedTitle = renderPublicationTitleHtml(entry);
  const titleHtml = entry.projectUrl
    ? `<a class="publication-project-link" href="${escapeHtml(entry.projectUrl)}">${renderedTitle}</a>` : renderedTitle;
  const linksHtml = renderPublicationLinksHtml(entry);
  const previewHtml = entry.preview?.src
    ? `<template class="publication-preview-source"><img${entry.preview.fit === "contain" ? ' class="publication-preview-image--contain"' : ""} src="${escapeHtml(entry.preview.src)}" alt="${escapeHtml(entry.preview.alt || normalizedTitle)}" decoding="async" /></template>` : "";
  return `<article class="editorial-publication-item"><div class="publication-summary">${renderPublicationEyebrowHtml(entry)}<h3 class="publication-title-serif"><span class="publication-title-highlight">${titleHtml}</span></h3>${renderPublicationAuthorsHtml(entry)}</div>${linksHtml}${previewHtml}</article>`;
};

export const renderPublicationListHtml = (items) => (items || []).map(renderPublicationItemHtml).join("");
export const renderSelectedPublicationsHtml = (items) =>
  renderPublicationListHtml((items || []).filter((item) => item?.selected === true));
