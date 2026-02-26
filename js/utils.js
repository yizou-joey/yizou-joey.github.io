const parseListData = (text) => {
  const lines = text.replace(/\r/g, "").split("\n");
  const items = [];
  let current = null;

  const pushCurrent = () => {
    if (!current) return;
    const hasContent = Object.values(current).some((value) => value && value.trim());
    if (hasContent) items.push(current);
    current = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) continue;

    if (line.startsWith("- ")) {
      pushCurrent();
      current = {};
      const content = line.slice(2);
      const [key, ...rest] = content.split(":");
      if (key && rest.length) {
        current[key.trim()] = rest.join(":").trim();
      }
      continue;
    }

    if (!current) continue;

    const [key, ...rest] = line.split(":");
    if (!key || !rest.length) continue;
    current[key.trim()] = rest.join(":").trim();
  }

  pushCurrent();
  return items;
};

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const renderInlineMarkdown = (value) => {
  if (!value) return "";
  let html = escapeHtml(value);
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="underline underline-offset-2 decoration-muted/40 hover:decoration-ink/60">$1</a>'
  );
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/\n/g, "<br />");
  html = html.replace(/\\n/g, "<br />");
  return html;
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

const buildPublicationCard = (item) => {
  const article = document.createElement("article");
  article.className =
    "w-full max-w-[833px] rounded-xl border border-line bg-white p-[24px] sm:p-[28px] md:p-[40px]";

  const container = document.createElement("div");
  container.className = "flex flex-col items-start gap-[14px]";

  const venue = document.createElement("div");
  venue.className = "w-fit rounded-[6px] px-3 py-1 text-center";
  const venueColor = item.venueColor || "#262189";
  venue.style.backgroundColor = venueColor;

  const venueText = document.createElement("span");
  venueText.className = "font-inter text-[14px] font-semibold text-paper";
  venueText.textContent = item.venue || "";
  venue.appendChild(venueText);

  const title = document.createElement("h3");
  title.className = "font-inter text-[18px] font-semibold sm:text-[20px] md:text-[24px]";
  title.innerHTML = renderInlineMarkdown(item.title || "");

  const authors = document.createElement("p");
  authors.className = "font-inter text-[14px] leading-relaxed sm:text-[15px] md:text-[16px]";
  authors.innerHTML = renderAuthors(item.authors || "");

  const description = document.createElement("p");
  description.className = "font-inter text-[14px] leading-relaxed sm:text-[15px] md:text-[16px]";
  description.innerHTML = renderInlineMarkdown(item.description || "");

  container.appendChild(venue);
  container.appendChild(title);
  container.appendChild(authors);
  container.appendChild(description);
  article.appendChild(container);
  return article;
};
