import {
  escapeHtml,
  getDateSortValue,
  normalizeInlineText,
  parseBooleanLike,
  renderInlineMarkdown,
  renderNewsInline,
  renderPublicationItemHtml,
} from "./utils.js";

const MONTH_SHORT_LABEL = {
  january: "Jan.",
  february: "Feb.",
  march: "Mar.",
  april: "Apr.",
  may: "May",
  june: "Jun.",
  july: "Jul.",
  august: "Aug.",
  september: "Sep.",
  october: "Oct.",
  november: "Nov.",
  december: "Dec.",
  jan: "Jan.",
  feb: "Feb.",
  mar: "Mar.",
  apr: "Apr.",
  jun: "Jun.",
  jul: "Jul.",
  aug: "Aug.",
  sep: "Sep.",
  sept: "Sep.",
  oct: "Oct.",
  nov: "Nov.",
  dec: "Dec.",
};

const compareByDateDesc = (a, b) => {
  const aTime = getDateSortValue(a?.date);
  const bTime = getDateSortValue(b?.date);
  if (aTime === bTime) return 0;
  return bTime - aTime;
};

const formatEducationPeriodLabel = (value) => {
  const text = normalizeInlineText(value || "");
  if (!text) return "";
  if (/present/i.test(text)) return "Present";

  const yearFirst = text.match(/^(\d{4})\s+([a-zA-Z.]+)$/);
  if (yearFirst) {
    const [, year, monthRaw] = yearFirst;
    const monthKey = monthRaw.replace(/\./g, "").toLowerCase();
    const month = MONTH_SHORT_LABEL[monthKey];
    if (month) return `${month} ${year}`;
  }

  const monthFirst = text.match(/^([a-zA-Z.]+)\s+(\d{4})$/);
  if (monthFirst) {
    const [, monthRaw, year] = monthFirst;
    const monthKey = monthRaw.replace(/\./g, "").toLowerCase();
    const month = MONTH_SHORT_LABEL[monthKey];
    if (month) return `${month} ${year}`;
  }

  return text;
};

const splitEducationPeriod = (value) => {
  const text = normalizeInlineText(value || "");
  if (!text) return { start: "", end: "" };
  const parts = text.split(/\s*[-\u2013\u2014]\s*/);
  if (parts.length < 2) return { start: "", end: text };
  return {
    start: normalizeInlineText(parts[0]),
    end: normalizeInlineText(parts.slice(1).join(" \u2014 ")),
  };
};

const splitNewsDateLabel = (value) => {
  const text = normalizeInlineText(value || "");
  const match = text.match(/^(.*?)(,?)\s+(\d{4})$/);
  if (!match) return { lead: text, separator: "", year: "" };
  return {
    lead: normalizeInlineText(match[1]),
    separator: match[2],
    year: match[3],
  };
};

const renderBioHtml = (markdown) => {
  const text = (markdown || "").trim();
  if (!text) return "";
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => renderInlineMarkdown(line, { preserveLineBreaks: false }))
    .map(
      (paragraph, index) =>
        `<span class="bio-paragraph${index > 0 ? " bio-paragraph--spaced" : ""}">${paragraph}</span>`
    )
    .join("");
};

const renderNewsItemHtml = (item) => {
  const entry = item || {};
  const dateLabel = splitNewsDateLabel(entry.date || "");
  const dateHtml = dateLabel.year
    ? `<div class="editorial-date-start editorial-news-date"><span>${escapeHtml(dateLabel.lead)}${dateLabel.separator ? `<span class="editorial-news-date-separator">${escapeHtml(dateLabel.separator)}</span>` : ""}</span> <span>${escapeHtml(dateLabel.year)}</span></div>`
    : `<div class="editorial-date-start">${escapeHtml(dateLabel.lead)}</div>`;
  const mascotHtml = entry.mascot
    ? `<div class="editorial-media-column news-mascot-column"><img class="news-mascot-sticker" src="${escapeHtml(entry.mascot)}" alt="${escapeHtml(entry.mascotAlt || "Conference mascot")}" loading="lazy" decoding="async" width="80" height="80" /></div>`
    : "";

  return `<li class="editorial-media-row editorial-news-row"><div class="editorial-date-column">${dateHtml}</div><div class="editorial-detail-column editorial-news-content">${renderNewsInline(entry)}</div>${mascotHtml}</li>`;
};

const renderEducationItemHtml = (item) => {
  const entry = item || {};
  const periodInfo = splitEducationPeriod(entry.period || "");
  const endLabel = formatEducationPeriodLabel(periodInfo.end || entry.period || "");
  const startLabel = formatEducationPeriodLabel(periodInfo.start || "");
  const isPresent = /^(present|.*至今.*)$/i.test(endLabel || "");
  const titleText = [entry.degree, entry.major]
    .filter((value) => normalizeInlineText(value).length)
    .join(", ");

  const logoSrc = normalizeInlineText(entry.logo || "");
  const logoHtml = logoSrc
    ? `<div class="editorial-media-column editorial-logo-column"><img class="editorial-education-logo-mono" src="${escapeHtml(encodeURI(logoSrc))}" alt="" loading="lazy" decoding="async" /><img class="editorial-education-logo-color" src="${escapeHtml(encodeURI(logoSrc))}" alt="${escapeHtml(normalizeInlineText(entry.logoAlt || `${entry.institution || "Institution"} logo`))}" loading="lazy" decoding="async" /></div>`
    : "";
  const subAffiliationHtml = entry.subAffiliation
    ? `<div class="editorial-inst-sub">${renderInlineMarkdown(entry.subAffiliation, { preserveLineBreaks: false })}</div>`
    : "";

  return `<article class="editorial-media-row editorial-education-row"><div class="editorial-date-column"><div class="editorial-date-end${isPresent ? " editorial-date-present" : ""}">${escapeHtml(endLabel)}</div>${startLabel ? `<div class="editorial-date-start">${escapeHtml(startLabel)}</div>` : ""}</div><div class="editorial-detail-column"><h3 class="editorial-item-title">${renderInlineMarkdown(titleText || entry.institution || "", { preserveLineBreaks: false })}</h3><div class="editorial-item-subtitle"><div class="editorial-inst-name">${renderInlineMarkdown(entry.institution || "", { preserveLineBreaks: false })}</div>${subAffiliationHtml}</div></div>${logoHtml}</article>`;
};

const renderTeachingItemHtml = (item) => {
  const entry = item || {};
  const datePeriod = normalizeInlineText(entry.period) || normalizeInlineText(entry.year) || "";
  let detailHtml = "";

  if (entry.courseCode || entry.courseName) {
    detailHtml = `<div class="editorial-inst-name">${entry.courseCode ? `<strong>${escapeHtml(entry.courseCode)}</strong>` : ""}${entry.courseCode && entry.courseName ? " &mdash; " : ""}${entry.courseName ? escapeHtml(entry.courseName) : ""}</div>`;
  } else if (entry.detail) {
    detailHtml = `<div class="editorial-inst-name">${renderInlineMarkdown(entry.detail || "")}</div>`;
  }

  const institutionHtml = entry.institution
    ? `<div class="editorial-inst-sub">${renderInlineMarkdown(entry.institution)}</div>`
    : "";
  const subtitleHtml = detailHtml || institutionHtml
    ? `<div class="editorial-item-subtitle">${detailHtml}${institutionHtml}</div>`
    : "";

  return `<div class="editorial-grid-row"><div class="editorial-date-column"><div class="editorial-date-start">${escapeHtml(datePeriod)}</div></div><div class="editorial-detail-column"><h3 class="editorial-item-title">${escapeHtml(entry.role || "")}</h3>${subtitleHtml}</div></div>`;
};

const renderServicesItemHtml = (item) => {
  const entry = item || {};
  const datePeriod = normalizeInlineText(entry.period) || normalizeInlineText(entry.year) || "";
  const eventHtml = entry.event
    ? `<div class="editorial-inst-name">${renderInlineMarkdown(entry.event)}</div>`
    : entry.detail
      ? `<div class="editorial-inst-name">${renderInlineMarkdown(entry.detail || "")}</div>`
      : "";
  const locationHtml = entry.location
    ? `<div class="editorial-inst-sub">${renderInlineMarkdown(entry.location)}</div>`
    : "";
  const detailHtml = eventHtml || locationHtml
    ? `<div class="editorial-item-subtitle">${eventHtml}${locationHtml}</div>`
    : "";
  const logoHtml = entry.logo
    ? `<div class="editorial-media-column service-mascot-column"><img class="service-mascot-sticker" src="${escapeHtml(entry.logo)}" alt="${escapeHtml(entry.logoAlt || "Conference mascot")}" loading="lazy" decoding="async" width="80" height="80" /></div>`
    : "";

  return `<div class="editorial-media-row editorial-service-row"><div class="editorial-date-column"><div class="editorial-date-start">${escapeHtml(datePeriod)}</div></div><div class="editorial-detail-column"><h3 class="editorial-item-title">${escapeHtml(entry.role || "")}</h3>${detailHtml}</div>${logoHtml}</div>`;
};

const renderListHtml = (items, renderItemHtml) =>
  (items || []).map((item) => renderItemHtml(item || {})).join("");

const renderSelectedPublicationsHtml = (items) =>
  renderListHtml(
    (items || []).filter((item) => parseBooleanLike(item?.selected)),
    renderPublicationItemHtml
  );

const groupPublicationsByYear = (items) => {
  const groups = new Map();
  (items || []).forEach((item) => {
    const year = (item?.date || "").slice(0, 4) || "Unknown";
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year).push(item);
  });
  return groups;
};

const renderPublicationYearSectionHtml = (year, items) =>
  `<section class="publication-year-section"><div class="section-heading-row"><h2 class="type-title-subsection">${escapeHtml(year)}</h2></div><div class="publication-year-items">${renderListHtml(items, renderPublicationItemHtml)}</div></section>`;

const renderPublicationsByYearHtml = (items) =>
  Array.from(groupPublicationsByYear(items).entries())
    .sort(([yearA], [yearB]) => yearB.localeCompare(yearA))
    .map(([year, yearItems]) => renderPublicationYearSectionHtml(year, yearItems))
    .join("");

export {
  compareByDateDesc,
  renderBioHtml,
  renderEducationItemHtml,
  renderListHtml,
  renderNewsItemHtml,
  renderPublicationsByYearHtml,
  renderSelectedPublicationsHtml,
  renderServicesItemHtml,
  renderTeachingItemHtml,
};
