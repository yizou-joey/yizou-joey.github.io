const VENUE_REGISTRY = Object.freeze({
  "ieee-vr": Object.freeze({
    className: "venue-ieee-vr",
  }),
  mmsys: Object.freeze({
    className: "venue-mmsys",
  }),
  ismar: Object.freeze({
    className: "venue-ismar",
  }),
});

const getVenueConfig = (venueKey) => {
  const normalizedKey = String(venueKey || "").trim().toLowerCase();
  return VENUE_REGISTRY[normalizedKey] || null;
};

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const linkMarkdownPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
const boldMarkdownPattern = /\*\*([^*]+)\*\*/g;
const italicMarkdownPattern = /\*([^*]+)\*/g;

const applyInlineLinks = (html) =>
  html.replace(linkMarkdownPattern, (_, text, url) => {
    if (/^javascript:/i.test(url.trim())) return text;
    const isExternal = /^https?:\/\//i.test(url.trim());
    const targetAttr = isExternal ? ` target="_blank" rel="noopener noreferrer"` : "";
    const personNameClass = /^Prof\.\s+\S/.test(text) ? " inline-link--person-name" : "";
    return `<a href="${url}" class="inline-link${personNameClass}"${targetAttr}>${text}</a>`;
  });

const applyInlineBold = (html) => html.replace(boldMarkdownPattern, "<strong>$1</strong>");

const applyInlineItalic = (html) => html.replace(italicMarkdownPattern, "<em>$1</em>");

const applyInlineBreaks = (html, { breakClass = "" } = {}) => {
  const classAttr = breakClass ? ` class="${breakClass}"` : "";
  return html
    .replace(/\n/g, `<br${classAttr} />`)
    .replace(/\\n/g, `<br${classAttr} />`);
};

const renderInlineMarkdown = (
  value,
  { preserveLineBreaks = true, breakClass = "" } = {}
) => {
  if (!value) return "";
  const escaped = escapeHtml(String(value));
  const withLinks = applyInlineLinks(escaped);
  const withBold = applyInlineBold(withLinks);
  const withItalic = applyInlineItalic(withBold);
  if (!preserveLineBreaks) return withItalic;
  return applyInlineBreaks(withItalic, { breakClass });
};

const escapeRegExp = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeVenueKey = (entry) => {
  const explicit = String(entry?.venueKey || "")
    .trim()
    .toLowerCase();
  if (explicit) return explicit;

  const venue = String(entry?.venue || "")
    .trim()
    .toLowerCase();
  if (venue.includes("ieee vr")) return "ieee-vr";
  return "";
};

const renderNewsInline = (entry) => {
  const sourceText = String(entry?.text || "");
  let html = renderInlineMarkdown(sourceText);

  const awardText = String(entry?.award || entry?.awardText || "").trim();
  if (awardText) {
    const awardPattern = new RegExp(escapeRegExp(awardText), "g");
    html = html.replace(
      awardPattern,
      `<span class="news-award-token">${escapeHtml(awardText)}</span>`
    );
  }

  const venueKey = normalizeVenueKey(entry);
  const venueText = String(entry?.venueText || entry?.venue || "").trim();
  const venueUrl = String(entry?.venueUrl || "").trim();
  const venueConfig = getVenueConfig(venueKey);
  const venueClass = venueConfig ? ` ${venueConfig.className}` : "";

  if (!venueKey || !venueText) return html;

  const venuePattern = new RegExp(escapeRegExp(venueText), "g");

  if (venueUrl) {
    return html.replace(
      venuePattern,
      `<a href="${escapeHtml(venueUrl)}" class="inline-link news-venue-link news-venue-token${venueClass}" data-venue="${escapeHtml(venueKey)}" target="_blank" rel="noopener noreferrer">${escapeHtml(venueText)}</a>`
    );
  }

  return html.replace(
    venuePattern,
    `<span class="news-venue-token${venueClass}" data-venue="${escapeHtml(venueKey)}">${escapeHtml(venueText)}</span>`
  );
};

const renderAuthors = (value) => {
  if (!value) return "";
  const token = "__CORR_STAR__";
  const escaped = value
    .replace(/\\\*/g, token)
    .replace(/\*+/g, (stars) => (stars === "**" ? stars : token.repeat(stars.length)));
  let html = renderInlineMarkdown(escaped);
  html = html.replace(new RegExp(token, "g"), "<sup>*</sup>");
  return html;
};

const normalizeInlineText = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const MONTH_NUMBER_BY_NAME = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

const getDateSortValue = (value) => {
  const text = (value || "").trim();
  if (!text) return 0;

  const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDate) {
    const [, year, month, day] = isoDate;
    return Date.UTC(Number(year), Number(month) - 1, Number(day));
  }

  const isoYearMonth = text.match(/^(\d{4})-(\d{2})$/);
  if (isoYearMonth) {
    const [, year, month] = isoYearMonth;
    return Date.UTC(Number(year), Number(month) - 1, 1);
  }

  const isoYear = text.match(/^(\d{4})$/);
  if (isoYear) {
    return Date.UTC(Number(isoYear[1]), 0, 1);
  }

  const monthYear = text.match(/^([A-Za-z]{3,9})\.?,?\s+(\d{4})$/);
  if (monthYear) {
    const [, monthName, year] = monthYear;
    const monthIndex = MONTH_NUMBER_BY_NAME[monthName.slice(0, 3).toLowerCase()];
    if (typeof monthIndex === "number") {
      return Date.UTC(Number(year), monthIndex, 1);
    }
  }

  const fallback = Date.parse(text);
  return Number.isFinite(fallback) ? fallback : 0;
};

const PUBLICATION_TYPE_ORDER = ["C", "J", "W", "P"];
const PUBLICATION_TYPE_LABEL = {
  C: "Conference",
  J: "Journal",
  W: "Workshop",
  P: "Poster",
};

const normalizePublicationType = (value) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();
  return PUBLICATION_TYPE_ORDER.includes(normalized) ? normalized : "W";
};

const PUBLICATION_SUPPLEMENT_FIELDS = [
  {
    key: "paperUrl",
    label: "Paper",
  },
  {
    key: "youtubeUrl",
    label: "Video",
    customLabelKey: "youtubeLabel",
  },
  {
    key: "videoUrl",
    label: "Video",
  },
  {
    key: "demoUrl",
    label: "Demo",
  },
  {
    key: "arxivUrl",
    label: "arXiv",
  },
  {
    key: "pdfUrl",
    label: "PDF",
  },
  {
    key: "slidesUrl",
    label: "Slides",
  },
  {
    key: "posterUrl",
    label: "Poster",
  },
  {
    key: "codeUrl",
    label: "Code",
  },
  {
    key: "doi",
    label: "DOI",
  },
];

const getPublicationSupplementLinks = (entry) =>
  PUBLICATION_SUPPLEMENT_FIELDS.reduce((acc, field) => {
    const href = (entry?.[field.key] || "").trim();
    if (!href) return acc;
    if (acc.some((item) => item.href === href)) return acc;
    const customLabel = field.customLabelKey
      ? String(entry?.[field.customLabelKey] || "").trim()
      : "";
    acc.push({
      href,
      label: customLabel || field.label,
    });
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
  const fallbackStatusLabel = normalizeInlineText(entry.status);
  const statusLabel = awardLabel || fallbackStatusLabel;
  const typeLinkUrl = String(entry.typeLink || "").trim();
  const eyebrowParts = [
    `<span class="publication-eyebrow-venue">${linkMetadata && entry.venueUrl ? renderNewsInline({ ...entry, text: entry.venue, award: "", awardText: "" }) : escapeHtml(entry.venue || "")}</span>`,
  ];

  if (type === "W" && workshopLabel) {
    const workshopHtml = escapeHtml(workshopLabel.toUpperCase());
    if (linkMetadata && typeLinkUrl) {
      eyebrowParts.push(
        `<span>${escapeHtml(typeLabel)}<span class="publication-eyebrow-dash">·</span><a href="${escapeHtml(typeLinkUrl)}" target="_blank" rel="noopener noreferrer" class="inline-link news-venue-link${venueClass}">${workshopHtml}</a></span>`
      );
    } else {
      eyebrowParts.push(
        `<span>${escapeHtml(typeLabel)}<span class="publication-eyebrow-dash">·</span>${workshopHtml}</span>`
      );
    }
  } else {
    eyebrowParts.push(`<span>${escapeHtml(typeLabel)}</span>`);
  }

  if (statusLabel) {
    const statusClass = awardLabel
      ? "publication-eyebrow-status publication-eyebrow-award"
      : "publication-eyebrow-status";
    eyebrowParts.push(
      `<span class="${statusClass}">${escapeHtml(statusLabel.toUpperCase())}</span>`
    );
  }

  const eyebrowHtml = eyebrowParts
    .map((part, index) => index === 0
      ? part
      : `<span class="publication-eyebrow-group"><span class="publication-eyebrow-separator" aria-hidden="true"></span>${part}</span>`)
    .join("");
  return `<div class="publication-eyebrow${venueClass}">${eyebrowHtml}</div>`;
};

const renderPublicationTitleHtml = (entry) => renderInlineMarkdown(
  String(entry.title || "").replace(/\s+/g, " ").trim(),
  { preserveLineBreaks: false },
);

const renderPublicationAuthorsHtml = (entry) =>
  `<p class="publication-authors-serif">${renderAuthors(entry.authors || "")}</p>`;

const renderPublicationLinksHtml = (entry, { excludeYoutube = false } = {}) => {
  const links = getPublicationSupplementLinks(entry)
    .filter((link) => !excludeYoutube || link.href !== entry.youtubeUrl?.trim())
    .map((supplement) =>
    `<a href="${escapeHtml(supplement.href)}" target="_blank" rel="noopener noreferrer">[<span class="bracket-text">${escapeHtml(supplement.label)}</span>]</a>`
  ).join("");
  return links ? `<div class="publication-bracket-links">${links}</div>` : "";
};

const renderProjectHeadingHtml = (entry) =>
  `<div class="project-heading-copy"><div class="project-labels">${renderPublicationEyebrowHtml(entry, { linkMetadata: true })}</div><h1 class="project-title">${renderPublicationTitleHtml(entry)}</h1>${renderPublicationAuthorsHtml(entry)}</div>${renderProjectResourcesHtml(entry)}`;

const renderProjectResourcesHtml = (entry) => {
  const links = renderPublicationLinksHtml(entry, { excludeYoutube: true });
  return links ? `<nav class="project-resources" aria-label="Project resources">${links}</nav>` : "";
};

const renderProjectVideoHtml = (entry) => {
  if (!entry.youtubeUrl?.trim()) return "";
  const url = new URL(entry.youtubeUrl);
  const host = url.hostname.replace(/^www\./, "");
  const videoId = host === "youtu.be" ? url.pathname.slice(1)
    : host === "youtube.com" ? (url.pathname === "/watch" ? url.searchParams.get("v") : url.pathname.match(/^\/embed\/([^/]+)$/)?.[1]) : "";
  if (url.protocol !== "https:" || !/^[A-Za-z0-9_-]{11}$/.test(videoId || "")) {
    throw new Error("Project youtubeUrl must identify an HTTPS YouTube video.");
  }
  const embed = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
  embed.searchParams.set("playsinline", "1");
  embed.searchParams.set("rel", "0");
  const timestamp = url.searchParams.get("start") || url.searchParams.get("t");
  if (timestamp) {
    const parts = timestamp.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
    const seconds = /^\d+$/.test(timestamp) ? Number(timestamp)
      : parts ? Number(parts[1] || 0) * 3600 + Number(parts[2] || 0) * 60 + Number(parts[3] || 0) : 0;
    if (Number.isSafeInteger(seconds) && seconds > 0) embed.searchParams.set("start", String(seconds));
  }
  const label = entry.youtubeLabel?.trim() || "Video";
  const title = `${entry.project.name} — ${label}`;
  return `<section class="project-section project-video-section" aria-labelledby="project-video-title"><h2 id="project-video-title" class="type-title-section">${escapeHtml(label)}</h2><div class="project-video project-section-content"><iframe src="${escapeHtml(embed.href)}" title="${escapeHtml(title)}" width="770" height="433" loading="eager" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div></section>`;
};

const renderPublicationItemHtml = (item) => {
  const entry = item || {};
  const normalizedTitle = String(entry.title || "").replace(/\s+/g, " ").trim();
  const renderedTitle = renderPublicationTitleHtml(entry);
  const titleHtml = entry.projectUrl
    ? `<a class="publication-project-link" href="${escapeHtml(entry.projectUrl)}">${renderedTitle}</a>`
    : renderedTitle;
  const authorsHtml = renderPublicationAuthorsHtml(entry);
  const linksHtml = renderPublicationLinksHtml(entry);

  const previewHtml = entry.preview?.src
    ? `<template class="publication-preview-source"><img${entry.preview.fit === "contain" ? ' class="publication-preview-image--contain"' : ""} src="${escapeHtml(entry.preview.src)}" alt="${escapeHtml(entry.preview.alt || normalizedTitle)}" decoding="async" /></template>`
    : "";

  return `<article class="editorial-publication-item"><div class="publication-summary">${renderPublicationEyebrowHtml(entry)}<h3 class="publication-title-serif"><span class="publication-title-highlight">${titleHtml}</span></h3>${authorsHtml}</div>${linksHtml}${previewHtml}</article>`;
};

export {
  escapeHtml,
  getVenueConfig,
  getDateSortValue,
  normalizeInlineText,
  renderInlineMarkdown,
  renderNewsInline,
  renderPublicationItemHtml,
  renderProjectHeadingHtml,
  renderProjectResourcesHtml,
  renderProjectVideoHtml,
};
