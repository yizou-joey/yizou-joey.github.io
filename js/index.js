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
  node.className = "education-timeline-vertical-item";

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
  const isCurrent = /present/i.test(endLabel);

  const period = document.createElement("div");
  period.className = "education-timeline-vertical-period";

  const periodEnd = document.createElement("span");
  periodEnd.className = "education-timeline-vertical-date";
  periodEnd.textContent = endLabel;
  if (isCurrent) {
    periodEnd.classList.add("is-current");
    node.classList.add("is-current");
  }

  period.appendChild(periodEnd);

  if (startLabel) {
    const periodStart = document.createElement("span");
    periodStart.className = "education-timeline-vertical-date-secondary";
    periodStart.textContent = startLabel;
    period.appendChild(periodStart);
  }

  const track = document.createElement("div");
  track.className = "education-timeline-vertical-track";
  track.setAttribute("aria-hidden", "true");

  const nodeDot = document.createElement("div");
  nodeDot.className = `education-timeline-vertical-node${isCurrent ? " is-active" : ""}`;

  const line = document.createElement("div");
  line.className = "education-timeline-vertical-line";

  track.appendChild(nodeDot);
  track.appendChild(line);

  const summaryParts = [entry.degree, entry.major].filter(
    (value) => normalizeInlineText(value).length
  );

  const titleText = summaryParts.join(", ");

  const center = document.createElement("div");
  center.className = "education-timeline-vertical-content";

  const title = document.createElement("h3");
  title.className = "education-timeline-vertical-title";
  title.innerHTML = renderInlineMarkdown(titleText || entry.institution || "", {
    preserveLineBreaks: false,
  });

  const subAffiliation = document.createElement("p");
  subAffiliation.className = "education-timeline-vertical-sub";
  subAffiliation.innerHTML = renderInlineMarkdown(entry.subAffiliation || "", {
    preserveLineBreaks: false,
  });

  const affiliation = document.createElement("p");
  affiliation.className = "education-timeline-vertical-affiliation";
  affiliation.innerHTML = renderInlineMarkdown(entry.institution || "", {
    preserveLineBreaks: false,
  });

  center.appendChild(title);
  if (affiliation.textContent) {
    center.appendChild(affiliation);
  }
  if (subAffiliation.textContent) {
    center.appendChild(subAffiliation);
  }

  const logoSrc = normalizeInlineText(entry.logo || "");
  const logoWrap = document.createElement("div");
  logoWrap.className = "education-timeline-vertical-logo-wrap";

  if (logoSrc) {
    const logo = document.createElement("img");
    logo.className = "education-timeline-vertical-logo";
    logo.src = encodeURI(logoSrc);
    logo.alt = normalizeInlineText(entry.logoAlt || `${entry.institution || "Institution"} logo`);
    logo.loading = "lazy";
    logo.decoding = "async";
    logoWrap.appendChild(logo);
  }

  node.appendChild(period);
  node.appendChild(track);
  node.appendChild(center);
  node.appendChild(logoWrap);
  return node;
};

const buildNewsItem = (item) => {
  const entry = item || {};
  const row = document.createElement("li");
  row.className = "news-bullet-item";

  const date = document.createElement("p");
  date.className = "news-bullet-date publication-meta-chip publication-type-chip type-label";
  date.textContent = entry.date || "";

  const content = document.createElement("p");
  content.className = "news-bullet-text type-body";
  content.innerHTML = renderNewsInline(entry);

  row.appendChild(date);
  row.appendChild(content);
  return row;
};

const buildTeachingItem = (item) => {
  const entry = item || {};
  const card = document.createElement("div");
  card.className = "teaching-card teaching-services-card card-surface radius-teaching section-aligned-card";

  const grid = document.createElement("div");
  grid.className =
    "grid w-full grid-cols-1 items-center gap-2 sm:grid-cols-[170px_1fr] sm:gap-3";

  const role = document.createElement("span");
  role.className = "type-title-minor";
  role.textContent = entry.role || "";

  const detail = document.createElement("span");
  detail.className =
    "teaching-item-detail text-muted sm:justify-self-end sm:text-right";
  detail.innerHTML = renderInlineMarkdown(entry.detail || "");

  grid.appendChild(role);
  grid.appendChild(detail);
  card.appendChild(grid);
  return card;
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
