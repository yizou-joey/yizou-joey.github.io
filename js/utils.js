const getNormalizedLines = (text) => String(text || "").replace(/\r/g, "").split("\n");

const parseKeyValueLine = (line) => {
  const [key, ...rest] = line.split(":");
  if (!key || !rest.length) return null;
  return {
    key: key.trim(),
    value: rest.join(":").trim(),
  };
};

const hasItemContent = (item) =>
  Object.values(item).some((value) => typeof value === "string" && value.trim());

const parseListData = (text) => {
  const lines = getNormalizedLines(text);
  const items = [];
  let current = null;

  const finalizeCurrent = () => {
    if (!current) return;
    if (hasItemContent(current)) items.push(current);
    current = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("- ")) {
      finalizeCurrent();
      current = {};
      const firstEntry = parseKeyValueLine(line.slice(2));
      if (firstEntry) current[firstEntry.key] = firstEntry.value;
      continue;
    }

    if (!current) continue;
    const entry = parseKeyValueLine(line);
    if (!entry) continue;
    current[entry.key] = entry.value;
  }

  finalizeCurrent();
  return items;
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
  html.replace(
    linkMarkdownPattern,
    '<a href="$2" class="inline-link">$1</a>'
  );

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

const CSS_COLOR_TOKEN_PATTERN = /^(#[0-9a-fA-F]{3,8}|(?:rgb|hsl)a?\([^)]+\)|var\(--[a-zA-Z0-9-_]+\)|[a-zA-Z]+)$/;

const normalizeVenueAccent = (entry) => {
  const accent = String(entry?.venueAccent || "").trim();
  if (!accent) return "";
  return CSS_COLOR_TOKEN_PATTERN.test(accent) ? accent : "";
};

const VENUE_KEY_PATTERN = /^[a-z0-9-]+$/;

const getVenueAccentFromKey = (venueKey) => {
  const normalizedKey = String(venueKey || "").trim().toLowerCase();
  if (!VENUE_KEY_PATTERN.test(normalizedKey)) return "";
  return `var(--color-venue-${normalizedKey}, var(--color-news-venue-accent))`;
};

const renderNewsInline = (entry) => {
  const sourceText = String(entry?.text || "");
  let html = renderInlineMarkdown(sourceText);
  const venueKey = normalizeVenueKey(entry);
  const venueText = String(entry?.venueText || entry?.venue || "").trim();
  const venueUrl = String(entry?.venueUrl || "").trim();
  const venueAccent = normalizeVenueAccent(entry) || getVenueAccentFromKey(venueKey);

  if (!venueKey || !venueText) return html;

  const venuePattern = new RegExp(escapeRegExp(venueText), "g");
  const accentAttr = venueAccent
    ? ` style="--news-venue-hover-color: ${escapeHtml(venueAccent)};"`
    : "";

  if (venueUrl) {
    return html.replace(
      venuePattern,
      `<a href="${escapeHtml(venueUrl)}" class="inline-link news-venue-link news-venue-token" data-venue="${escapeHtml(venueKey)}"${accentAttr} target="_blank" rel="noopener noreferrer">${escapeHtml(venueText)}</a>`
    );
  }

  return html.replace(
    venuePattern,
    `<span class="news-venue-token" data-venue="${escapeHtml(venueKey)}"${accentAttr}>${escapeHtml(venueText)}</span>`
  );
};

const renderAuthors = (value) => {
  if (!value) return "";
  const token = "__CORR_STAR__";
  const escaped = value.replace(/\\\*/g, token);
  let html = renderInlineMarkdown(escaped);
  html = html.replace(new RegExp(token, "g"), "<sup>*</sup>");
  html = html.replace(/\*/g, "<sup>*</sup>");
  return html;
};

const normalizeInlineText = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const fetchTextCache = new Map();

const fetchTextOrThrow = async (url) => {
  if (!fetchTextCache.has(url)) {
    fetchTextCache.set(
      url,
      (async () => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${url}: ${response.status}`);
        }
        return response.text();
      })().catch((error) => {
        fetchTextCache.delete(url);
        throw error;
      })
    );
  }

  return fetchTextCache.get(url);
};

const renderEmpty = (container, html) => {
  if (!container) return;
  container.innerHTML = html;
};

const renderError = (container, html) => {
  if (!container) return;
  container.innerHTML = html;
};

const loadList = async ({ url, sortFn }) => {
  const markdown = await fetchTextOrThrow(url);
  const items = parseListData(markdown);
  if (!sortFn) return items;
  return [...items].sort(sortFn);
};

const parseBooleanLike = (value) => {
  if (typeof value === "boolean") return value;
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "n", "off"].includes(normalized)) return false;
  return false;
};

const renderItems = ({ container, items, buildItem }) => {
  if (!container || !Array.isArray(items) || typeof buildItem !== "function") return;
  items.forEach((item) => {
    const node = buildItem(item || {});
    if (node) container.appendChild(node);
  });
};

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

const buildPublicationItem = (item) => {
  const entry = item || {};
  const type = normalizePublicationType(entry.type);
  const typeLabel = PUBLICATION_TYPE_LABEL[type] || "Workshop";
  const workshopLabel = String(entry.workshopLabel || "").trim();
  
  const article = document.createElement("article");
  article.className = "editorial-publication-item";

  const eyebrow = document.createElement("div");
  eyebrow.className = "publication-eyebrow";

  // Venue
  const venueSpan = document.createElement("span");
  venueSpan.className = "publication-eyebrow-venue";
  venueSpan.textContent = entry.venue || "";
  const venueKey = normalizeVenueKey(entry);
  const venueColor = String(entry.venueColor || "").trim();
  const accent = normalizeVenueAccent(entry) || getVenueAccentFromKey(venueKey);
  
  if (accent) {
    venueSpan.style.color = accent;
  } else if (venueColor) {
    venueSpan.style.color = venueColor;
  }
  
  // Status / Award
  const awardLabel = normalizeInlineText(entry.award);
  const fallbackStatusLabel = normalizeInlineText(entry.status);
  const statusLabel = awardLabel || fallbackStatusLabel;

  const eyebrowParts = [];
  eyebrowParts.push(venueSpan.outerHTML);
  
  const typeLinkUrl = String(entry.typeLink || "").trim();
  
  if (type === "W" && workshopLabel) {
    if (typeLinkUrl) {
      const linkColor = accent || venueColor || 'var(--color-ink)';
      eyebrowParts.push(`<span>${escapeHtml(typeLabel.toUpperCase())} <span class="publication-eyebrow-separator" style="margin: 0 4px;">-</span> <a href="${escapeHtml(typeLinkUrl)}" target="_blank" rel="noopener noreferrer" class="publication-eyebrow-workshop-link" style="--hover-color: ${escapeHtml(linkColor)};">${escapeHtml(workshopLabel.toUpperCase())}</a></span>`);
    } else {
      eyebrowParts.push(`<span>${escapeHtml(typeLabel.toUpperCase())} <span class="publication-eyebrow-separator" style="margin: 0 4px;">-</span> ${escapeHtml(workshopLabel.toUpperCase())}</span>`);
    }
  } else {
    eyebrowParts.push(`<span>${escapeHtml(typeLabel.toUpperCase())}</span>`);
  }
  
  if (statusLabel) {
    eyebrowParts.push(`<span style="${awardLabel ? 'color: var(--color-award-badge-text); font-weight: 700;' : ''}">${escapeHtml(statusLabel.toUpperCase())}</span>`);
  }

  eyebrow.innerHTML = eyebrowParts.join('<span class="publication-eyebrow-separator">|</span>');
  article.appendChild(eyebrow);

  const title = document.createElement("h3");
  const normalizedTitle = String(entry.title || "").replace(/\s+/g, " ").trim();
  title.className = "publication-title-serif";
  title.innerHTML = renderInlineMarkdown(normalizedTitle, {
    preserveLineBreaks: false,
  });
  article.appendChild(title);

  const authors = document.createElement("p");
  authors.className = "publication-authors-serif";
  authors.innerHTML = renderAuthors(entry.authors || "");
  article.appendChild(authors);

  const supplements = getPublicationSupplementLinks(entry);
  if (supplements.length) {
    const linksDiv = document.createElement("div");
    linksDiv.className = "publication-bracket-links";
    supplements.forEach((supplement) => {
      const link = document.createElement("a");
      link.href = supplement.href;
      link.textContent = `[${supplement.label} ↗]`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      linksDiv.appendChild(link);
    });
    article.appendChild(linksDiv);
  }

  return article;
};

const ensureSiteFooter = () => {
  if (!document.body || document.querySelector('[data-site-footer="true"]')) return;

  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.setAttribute("data-site-footer", "true");

  const inner = document.createElement("div");
  inner.className = "site-footer-inner";

  const year = new Date().getFullYear();
  const footerText = document.createElement("p");
  footerText.className = "site-footer-note";
  footerText.textContent = `© ${year} Yi ZOU. Powered by GitHub Pages.`;

  inner.appendChild(footerText);
  footer.appendChild(inner);
  document.body.appendChild(footer);
};

ensureSiteFooter();
