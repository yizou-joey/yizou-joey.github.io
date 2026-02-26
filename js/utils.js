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

const renderInlineMarkdown = (value) => {
  if (!value) return "";
  const escaped = escapeHtml(String(value));
  const withLinks = applyInlineLinks(escaped);
  const withBold = applyInlineBold(withLinks);
  const withItalic = applyInlineItalic(withBold);
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

const fetchTextOrThrow = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
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

const PUBLICATION_SUPPLEMENT_FIELDS = [
  {
    key: "youtubeUrl",
    label: "YouTube",
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
];

const getPublicationSupplementLinks = (entry) =>
  PUBLICATION_SUPPLEMENT_FIELDS.map((field) => {
    const href = (entry?.[field.key] || "").trim();
    if (!href) return null;
    return {
      href,
      label: field.label,
      iconPath: field.iconPath,
    };
  }).filter(Boolean);

const buildSupplementChip = ({ href, label, iconPath }) => {
  const link = document.createElement("a");
  link.className =
    "inline-flex h-[30px] w-[110px] items-center justify-center gap-1.5 rounded-[6px] border border-transparent bg-[#f1f1ef] px-[7px] font-inter text-[13px] font-normal leading-none text-muted sm:text-[14px] transition-colors duration-150 hover:border-line hover:bg-[#ecebe8] hover:text-ink";
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  const icon = document.createElement("img");
  icon.src = iconPath;
  icon.alt = "";
  icon.setAttribute("aria-hidden", "true");
  const isYouTube = label === "YouTube";
  icon.className = isYouTube
    ? "block h-[62%] w-auto shrink-0 opacity-95"
    : "block h-[58%] w-auto shrink-0 opacity-90";

  const text = document.createElement("span");
  text.className = "leading-none";
  text.textContent = label;

  link.appendChild(icon);
  link.appendChild(text);
  return link;
};

const buildPublicationCard = (item) => {
  const entry = item || {};
  const article = document.createElement("article");
  article.className =
    "w-full max-w-[833px] rounded-xl border border-line bg-white p-[24px] sm:p-[28px] md:p-[40px]";

  const container = document.createElement("div");
  container.className = "flex flex-col items-start gap-[10px]";

  const venue = document.createElement("div");
  venue.className = "w-fit rounded-[6px] px-3 py-1 text-center";
  const venueColor = entry.venueColor || "#262189";
  venue.style.backgroundColor = venueColor;

  const venueText = document.createElement("span");
  venueText.className = "font-inter text-[14px] font-semibold text-paper";
  venueText.textContent = entry.venue || "";
  venue.appendChild(venueText);

  const title = document.createElement("h3");
  title.className = "font-inter text-[18px] font-semibold sm:text-[20px] md:text-[24px]";
  title.innerHTML = renderInlineMarkdown(entry.title || "");

  const authors = document.createElement("p");
  authors.className = "font-inter text-[14px] leading-relaxed sm:text-[15px] md:text-[16px]";
  authors.innerHTML = renderAuthors(entry.authors || "");

  const description = document.createElement("p");
  description.className = "font-inter text-[14px] leading-relaxed sm:text-[15px] md:text-[16px]";
  description.innerHTML = renderInlineMarkdown(entry.description || "");

  const supplements = getPublicationSupplementLinks(entry);

  container.appendChild(venue);
  container.appendChild(title);
  container.appendChild(authors);
  container.appendChild(description);

  if (supplements.length) {
    const supplementsRow = document.createElement("div");
    supplementsRow.className = "mt-1 flex w-full flex-wrap items-center gap-2";
    supplements.forEach((supplement) =>
      supplementsRow.appendChild(buildSupplementChip(supplement))
    );
    container.appendChild(supplementsRow);
  }

  article.appendChild(container);
  return article;
};
