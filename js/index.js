const MONTH_SHORT_LABEL = {
  january: "Jan",
  february: "Feb",
  march: "Mar",
  april: "Apr",
  may: "May",
  june: "Jun",
  july: "Jul",
  august: "Aug",
  september: "Sep",
  october: "Oct",
  november: "Nov",
  december: "Dec",
  jan: "Jan",
  feb: "Feb",
  mar: "Mar",
  apr: "Apr",
  jun: "Jun",
  jul: "Jul",
  aug: "Aug",
  sep: "Sep",
  sept: "Sep",
  oct: "Oct",
  nov: "Nov",
  dec: "Dec",
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

const buildEducationItem = (item) => {
  const entry = item || {};

  const node = document.createElement("article");
  node.className = "editorial-education-row";

  const splitPeriod = (value) => {
    const text = normalizeInlineText(value || "");
    if (!text) return { start: "", end: "" };
    const parts = text.split(/\s*-\s*/);
    if (parts.length < 2) {
      return { start: "", end: text };
    }
    return {
      start: normalizeInlineText(parts[0]),
      end: normalizeInlineText(parts.slice(1).join(" - ")),
    };
  };

  const periodInfo = splitPeriod(entry.period || "");
  const endLabel = formatEducationPeriodLabel(periodInfo.end || entry.period || "");
  const startLabel = formatEducationPeriodLabel(periodInfo.start || "");

  const dateColumn = document.createElement("div");
  dateColumn.className = "editorial-date-column";
  
  if (startLabel) {
    dateColumn.textContent = `${startLabel} — ${endLabel}`;
  } else {
    dateColumn.textContent = endLabel;
  }

  const detailColumn = document.createElement("div");
  detailColumn.className = "editorial-detail-column";

  const summaryParts = [entry.degree, entry.major].filter(
    (value) => normalizeInlineText(value).length
  );
  const titleText = summaryParts.join(", ");

  const degree = document.createElement("h3");
  degree.className = "editorial-item-title";
  degree.innerHTML = renderInlineMarkdown(titleText || entry.institution || "", {
    preserveLineBreaks: false,
  });

  const instParts = [entry.institution, entry.subAffiliation]
    .filter((value) => normalizeInlineText(value).length)
    .join(" — ");
  
  const institution = document.createElement("p");
  institution.className = "editorial-item-subtitle";
  institution.innerHTML = renderInlineMarkdown(instParts || "", {
    preserveLineBreaks: false,
  });

  const logoSrc = normalizeInlineText(entry.logo || "");
  let logoColumn = null;
  if (logoSrc) {
    logoColumn = document.createElement("div");
    logoColumn.className = "editorial-logo-column";
    const logo = document.createElement("img");
    logo.className = "editorial-education-logo";
    logo.src = encodeURI(logoSrc);
    logo.alt = normalizeInlineText(entry.logoAlt || `${entry.institution || "Institution"} logo`);
    logo.loading = "lazy";
    logo.decoding = "async";
    logoColumn.appendChild(logo);
  }

  detailColumn.appendChild(degree);
  if (instParts) {
    detailColumn.appendChild(institution);
  }

  node.appendChild(dateColumn);
  node.appendChild(detailColumn);
  if (logoColumn) node.appendChild(logoColumn);
  return node;
};

const buildNewsItem = (item) => {
  const entry = item || {};
  const row = document.createElement("li");
  row.className = "editorial-grid-row";

  const date = document.createElement("div");
  date.className = "editorial-date-column";
  date.textContent = entry.date || "";

  const content = document.createElement("div");
  content.className = "editorial-news-content";
  
  const awardLabel = normalizeInlineText(entry.award);
  if (awardLabel) {
    const badge = document.createElement("strong");
    badge.className = "editorial-news-badge";
    badge.textContent = awardLabel;
    badge.style.color = "var(--color-award-badge-text)";
    
    // We append the badge before the inner HTML content.
    // However, the innerHTML could have p tags depending on parsing, 
    // but renderNewsInline returns inline HTML.
    content.appendChild(badge);
    
    // Create a span for the rest of the text so innerHTML doesn't overwrite the badge
    const textSpan = document.createElement("span");
    textSpan.innerHTML = renderNewsInline(entry);
    content.appendChild(textSpan);
  } else {
    content.innerHTML = renderNewsInline(entry);
  }

  row.appendChild(date);
  row.appendChild(content);
  return row;
};

const buildTeachingItem = (item) => {
  const entry = item || {};
  const row = document.createElement("div");
  row.className = "editorial-grid-row";

  const datePeriod = normalizeInlineText(entry.period) || normalizeInlineText(entry.year) || "";

  const date = document.createElement("div");
  date.className = "editorial-date-column";
  date.textContent = datePeriod;

  const content = document.createElement("div");
  content.className = "editorial-detail-column";

  const role = document.createElement("h3");
  role.className = "editorial-item-title";
  role.textContent = entry.role || "";

  const detail = document.createElement("p");
  detail.className = "editorial-item-subtitle";
  detail.innerHTML = renderInlineMarkdown(entry.detail || "");

  content.appendChild(role);
  content.appendChild(detail);

  row.appendChild(date);
  row.appendChild(content);
  return row;
};

const buildServicesItem = (item) => buildTeachingItem(item);

const compareByDateDesc = (a, b) => {
  const aTime = getDateSortValue(a?.date);
  const bTime = getDateSortValue(b?.date);
  if (aTime === bTime) return 0;
  return bTime - aTime;
};

const renderListSection = async ({
  url,
  container,
  buildItem,
  emptyMessage,
  errorMessage,
  sortFn,
}) => {
  if (!container) return;
  try {
    const items = await loadList({ url, sortFn });
    if (!items.length) {
      renderEmpty(container, emptyMessage);
      return;
    }
    renderItems({
      container,
      items,
      buildItem,
    });
  } catch {
    renderError(container, errorMessage);
  }
};

const renderPublicationsSection = async () => {
  const publicationsList = document.getElementById("publications-list");
  if (!publicationsList) return;
  try {
    const allItems = await loadList({
      url: "contents/publications.md",
    });
    const selectedItems = allItems.filter((item) => parseBooleanLike(item?.selected));

    if (!selectedItems.length) {
      renderEmpty(
        publicationsList,
        '<p class="type-body-sm text-muted">No selected publications yet.</p>'
      );
      return;
    }

    renderItems({
      container: publicationsList,
      items: selectedItems,
      buildItem: buildPublicationCard,
    });
  } catch {
    renderError(
      publicationsList,
      '<p class="type-body-sm text-muted">Publications unavailable.</p>'
    );
  }
};

const renderNewsSection = async () => {
  const newsList = document.getElementById("news-list");
  if (!newsList) return;
  await renderListSection({
    url: "contents/news.md",
    container: newsList,
    buildItem: buildNewsItem,
    emptyMessage: '<li class="type-body-sm text-muted">No news yet.</li>',
    errorMessage: '<li class="type-body-sm text-muted">News unavailable.</li>',
    sortFn: compareByDateDesc,
  });
};

const renderTeachingSection = async () => {
  const teachingList = document.getElementById("teaching-list");
  if (!teachingList) return;
  await renderListSection({
    url: "contents/teaching.md",
    container: teachingList,
    buildItem: buildTeachingItem,
    emptyMessage:
      '<p class="type-body-sm text-muted">No teaching entries yet.</p>',
    errorMessage:
      '<p class="type-body-sm text-muted">Teaching unavailable.</p>',
  });
};

const renderServicesSection = async () => {
  const servicesList = document.getElementById("services-list");
  if (!servicesList) return;
  await renderListSection({
    url: "contents/services.md",
    container: servicesList,
    buildItem: buildServicesItem,
    emptyMessage:
      '<p class="type-body-sm text-muted">No services entries yet.</p>',
    errorMessage:
      '<p class="type-body-sm text-muted">Services unavailable.</p>',
  });
};

const renderEducationSection = async () => {
  const educationList = document.getElementById("education-list");
  if (!educationList) return;

  await renderListSection({
    url: "contents/education.md",
    container: educationList,
    buildItem: buildEducationItem,
    emptyMessage:
      '<p class="type-body-sm text-muted">No education entries yet.</p>',
    errorMessage:
      '<p class="type-body-sm text-muted">Education unavailable.</p>',
  });
};

const renderBioSection = async () => {
  const bioIntro = document.getElementById("bio-intro");
  if (!bioIntro) return;

  try {
    const markdown = await fetchTextOrThrow("contents/bio.md");
    const text = (markdown || "").trim();
    if (!text) {
      bioIntro.textContent = "";
      return;
    }
    const paragraphs = text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => renderInlineMarkdown(line, { preserveLineBreaks: false }));

    bioIntro.innerHTML = paragraphs
      .map((paragraph, index) =>
        `<span class="bio-paragraph${index > 0 ? " bio-paragraph--spaced" : ""}">${paragraph}</span>`
      )
      .join("");
  } catch {
    bioIntro.textContent = "Bio unavailable.";
  }
};

renderPublicationsSection();
renderNewsSection();
renderServicesSection();
renderTeachingSection();
renderEducationSection();
renderBioSection();
