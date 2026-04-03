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
    '<a href="$2" class="underline underline-offset-2 decoration-muted/40 hover:decoration-ink/60">$1</a>'
  );

const applyInlineBold = (html) => html.replace(boldMarkdownPattern, "<strong>$1</strong>");

const applyInlineItalic = (html) => html.replace(italicMarkdownPattern, "<em>$1</em>");

const applyInlineBreaks = (html) => html.replace(/\n/g, "<br />").replace(/\\n/g, "<br />");

const renderInlineMarkdown = (value, { preserveLineBreaks = true } = {}) => {
  if (!value) return "";
  const escaped = escapeHtml(String(value));
  const withLinks = applyInlineLinks(escaped);
  const withBold = applyInlineBold(withLinks);
  const withItalic = applyInlineItalic(withBold);
  if (!preserveLineBreaks) return withItalic;
  return applyInlineBreaks(withItalic);
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
    iconPath: "files/icons/pdf.svg",
  },
  {
    key: "youtubeUrl",
    label: "Video",
    customLabelKey: "youtubeLabel",
    iconPath: "files/icons/youtube.svg",
  },
  {
    key: "videoUrl",
    label: "Video",
    iconPath: "files/icons/youtube.svg",
  },
  {
    key: "demoUrl",
    label: "Demo",
    iconPath: "files/icons/youtube.svg",
  },
  {
    key: "arxivUrl",
    label: "arXiv",
    iconPath: "files/icons/arxiv.svg",
  },
  {
    key: "pdfUrl",
    label: "PDF",
    iconPath: "files/icons/pdf.svg",
  },
  {
    key: "slidesUrl",
    label: "Slides",
    iconPath: "files/icons/slides.svg",
  },
  {
    key: "posterUrl",
    label: "Poster",
    iconPath: "files/icons/poster.svg",
  },
  {
    key: "codeUrl",
    label: "Code",
    iconPath: "files/icons/github.svg",
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
      iconPath: field.iconPath,
    });
    return acc;
  }, []);

const buildSupplementChip = ({ href, label, iconPath }) => {
  const link = document.createElement("a");
  link.className = "publication-resource-chip";
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  const icon = document.createElement("img");
  icon.src = iconPath;
  icon.alt = "";
  icon.loading = "lazy";
  icon.decoding = "async";
  icon.width = iconPath.includes("youtube.svg") ? 16 : 14;
  icon.height = iconPath.includes("youtube.svg") ? 16 : 14;
  icon.setAttribute("aria-hidden", "true");
  const isYouTube = iconPath.includes("youtube.svg");
  icon.className = isYouTube
    ? "publication-resource-icon is-youtube"
    : "publication-resource-icon";

  const text = document.createElement("span");
  text.textContent = label;

  link.appendChild(icon);
  link.appendChild(text);
  return link;
};

const buildPublicationTypeLabelNode = ({ label, href }) => {
  if (!href) {
    const text = document.createElement("span");
    text.className = "publication-type-note";
    text.textContent = label;
    return text;
  }

  const link = document.createElement("a");
  link.className = "publication-type-note publication-type-note-link";
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = label;
  return link;
};

const buildPublicationCard = (item) => {
  const entry = item || {};
  const type = normalizePublicationType(entry.type);
  const typeLabel = PUBLICATION_TYPE_LABEL[type] || "Workshop";
  const workshopLabel = String(entry.workshopLabel || "").trim();
  const publicationTypeLink = String(entry.typeLink || entry.workshopUrl || "").trim();
  const article = document.createElement("article");
  article.className = "card-surface radius-card publication-ticket section-aligned-card";

  const main = document.createElement("div");
  main.className = "publication-ticket-main";

  const container = document.createElement("div");
  container.className = "publication-ticket-content";

  const identityStrip = document.createElement("div");
  identityStrip.className = "publication-identity-strip";

  const identityBadges = document.createElement("div");
  identityBadges.className = "publication-identity-badges";

  const typeChip = document.createElement("span");
  typeChip.className = "publication-meta-chip publication-type-chip";

  const typeText = document.createElement("span");
  typeText.textContent = typeLabel;
  typeChip.appendChild(typeText);

  if (type === "W" && workshopLabel) {
    const divider = document.createElement("span");
    divider.className = "publication-type-divider";
    divider.setAttribute("aria-hidden", "true");
    typeChip.appendChild(divider);

    const note = buildPublicationTypeLabelNode({
      label: workshopLabel,
      href: publicationTypeLink,
    });
    typeChip.appendChild(note);
  } else {
    const typeTextNode = document.createElement(publicationTypeLink ? "a" : "span");
    typeTextNode.textContent = typeLabel;
    if (publicationTypeLink) {
      typeTextNode.className = "publication-type-note publication-type-note-link";
      typeTextNode.href = publicationTypeLink;
      typeTextNode.target = "_blank";
      typeTextNode.rel = "noopener noreferrer";
    }

    typeChip.replaceChildren(typeTextNode);
  }

  const venue = document.createElement("div");
  venue.className = "publication-meta-chip publication-venue-chip";
  const venueColor = entry.venueColor || "#262189";
  venue.style.backgroundColor = venueColor;
  venue.style.borderColor = venueColor;

  const venueText = document.createElement("span");
  venueText.className = "publication-venue-chip-text";
  venueText.textContent = entry.venue || "";
  venue.appendChild(venueText);

  identityBadges.appendChild(venue);

  const awardLabel = normalizeInlineText(entry.award);
  const fallbackStatusLabel = normalizeInlineText(entry.status);
  const statusLabel = awardLabel || fallbackStatusLabel;
  identityStrip.appendChild(identityBadges);

  identityBadges.appendChild(typeChip);

  if (statusLabel) {
    const statusChip = document.createElement("span");
    statusChip.className = "publication-meta-chip publication-status-chip";

    const statusText = document.createElement("span");
    statusText.className = "publication-status-chip-text";
    statusText.textContent = statusLabel;

    statusChip.appendChild(statusText);
    identityBadges.appendChild(statusChip);
  }

  const title = document.createElement("h3");
  const normalizedTitle = String(entry.title || "").replace(/\s+/g, " ").trim();
  title.className = "publication-title";
  title.innerHTML = renderInlineMarkdown(normalizedTitle, {
    preserveLineBreaks: false,
  });

  const authors = document.createElement("p");
  authors.className = "publication-authors";
  authors.innerHTML = renderAuthors(entry.authors || "");

  const supplements = getPublicationSupplementLinks(entry);

  container.appendChild(identityStrip);
  container.appendChild(title);
  container.appendChild(authors);

  main.appendChild(container);
  article.appendChild(main);

  if (supplements.length) {
    const stub = document.createElement("aside");
    stub.className = "publication-ticket-stub";

    const stack = document.createElement("div");
    const stackStateClass =
      supplements.length === 1
        ? " is-single"
        : supplements.length === 2
          ? " is-pair"
          : "";
    stack.className = `publication-ticket-stub-stack${stackStateClass}`;
    supplements.forEach((supplement) => stack.appendChild(buildSupplementChip(supplement)));

    stub.appendChild(stack);
    article.appendChild(stub);
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
  const footerText = document.createElement("span");
  footerText.textContent = `© ${year} Yi ZOU. Powered by GitHub Pages.`;

  inner.appendChild(footerText);
  footer.appendChild(inner);
  document.body.appendChild(footer);
};

ensureSiteFooter();
