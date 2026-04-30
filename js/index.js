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
    // Accept hyphen, en-dash, or em-dash as range separators.
    const parts = text.split(/\s*[-\u2013\u2014]\s*/);
    if (parts.length < 2) {
      return { start: "", end: text };
    }
    return {
      start: normalizeInlineText(parts[0]),
      end: normalizeInlineText(parts.slice(1).join(" \u2014 ")),
    };
  };

  const periodInfo = splitPeriod(entry.period || "");
  const endLabel = formatEducationPeriodLabel(periodInfo.end || entry.period || "");
  const startLabel = formatEducationPeriodLabel(periodInfo.start || "");

  const dateColumn = document.createElement("div");
  dateColumn.className = "editorial-date-column";
  
  const endDiv = document.createElement("div");
  endDiv.className = "editorial-date-end";
  
  const labelLower = (endLabel || "").toLowerCase();
  if (labelLower === "present" || labelLower.includes("至今")) {
    endDiv.classList.add("editorial-date-present");
  }
  
  endDiv.textContent = endLabel;
  dateColumn.appendChild(endDiv);

  if (startLabel) {
    const startDiv = document.createElement("div");
    startDiv.className = "editorial-date-start";
    startDiv.textContent = startLabel;
    dateColumn.appendChild(startDiv);
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

  const institution = document.createElement("div");
  institution.className = "editorial-item-subtitle";

  if (entry.institution) {
    const instName = document.createElement("div");
    instName.className = "editorial-inst-name";
    instName.innerHTML = renderInlineMarkdown(entry.institution, {
      preserveLineBreaks: false,
    });
    institution.appendChild(instName);
  }

  if (entry.subAffiliation) {
    const subName = document.createElement("div");
    subName.className = "editorial-inst-sub";
    subName.innerHTML = renderInlineMarkdown(entry.subAffiliation, {
      preserveLineBreaks: false,
    });
    institution.appendChild(subName);
  }

  const logoSrc = normalizeInlineText(entry.logo || "");
  let logoColumn = null;
  if (logoSrc) {
    logoColumn = document.createElement("div");
    logoColumn.className = "editorial-logo-column";
    
    // Create base monochrome logo
    const logoMono = document.createElement("img");
    logoMono.className = "editorial-education-logo-mono";
    logoMono.src = encodeURI(logoSrc);
    logoMono.alt = "";
    logoMono.loading = "lazy";
    logoMono.decoding = "async";
    logoColumn.appendChild(logoMono);
    
    // Create hover color logo overlay
    const logoColor = document.createElement("img");
    logoColor.className = "editorial-education-logo-color";
    logoColor.src = encodeURI(logoSrc);
    logoColor.alt = normalizeInlineText(entry.logoAlt || `${entry.institution || "Institution"} logo`);
    logoColor.loading = "lazy";
    logoColor.decoding = "async";
    logoColumn.appendChild(logoColor);
  }

  detailColumn.appendChild(degree);
  if (entry.institution || entry.subAffiliation) {
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
  
  const startDiv = document.createElement("div");
  startDiv.className = "editorial-date-start";
  startDiv.textContent = entry.date || "";
  date.appendChild(startDiv);

  const content = document.createElement("div");
  content.className = "editorial-news-content";
  content.innerHTML = renderNewsInline(entry);

  row.appendChild(date);
  row.appendChild(content);

  if (entry.mascot) {
    const mascotCol = document.createElement("div");
    mascotCol.className = "news-mascot-column";

    const img = document.createElement("img");
    img.className = "news-mascot-sticker";
    img.src = entry.mascot;
    img.alt = entry.mascotAlt || "Conference mascot";
    img.loading = "lazy";
    img.decoding = "async";
    img.width = 64;
    img.height = 64;

    mascotCol.appendChild(img);
    row.appendChild(mascotCol);
  }

  return row;
};

const buildTeachingItem = (item) => {
  const entry = item || {};
  const row = document.createElement("div");
  row.className = "editorial-grid-row";

  const datePeriod = normalizeInlineText(entry.period) || normalizeInlineText(entry.year) || "";

  const date = document.createElement("div");
  date.className = "editorial-date-column";
  
  const startDiv = document.createElement("div");
  startDiv.className = "editorial-date-start";
  startDiv.textContent = datePeriod;
  date.appendChild(startDiv);

  const content = document.createElement("div");
  content.className = "editorial-detail-column";

  const role = document.createElement("h3");
  role.className = "editorial-item-title";
  role.textContent = entry.role || "";
  content.appendChild(role);

  const detail = document.createElement("div");
  detail.className = "editorial-item-subtitle";

  if (entry.courseCode || entry.courseName) {
    const courseBlock = document.createElement("div");
    courseBlock.className = "editorial-inst-name";
    
    if (entry.courseCode) {
        courseBlock.innerHTML += `<strong>${escapeHtml(entry.courseCode)}</strong>`;
        if (entry.courseName) courseBlock.innerHTML += ` &mdash; `;
    }
    if (entry.courseName) courseBlock.innerHTML += `${escapeHtml(entry.courseName)}`;
    
    detail.appendChild(courseBlock);
  } else if (entry.detail) {
    const fallbackBlock = document.createElement("div");
    fallbackBlock.className = "editorial-inst-name";
    fallbackBlock.innerHTML = renderInlineMarkdown(entry.detail || "");
    detail.appendChild(fallbackBlock);
  }

  if (entry.institution) {
    const instBlock = document.createElement("div");
    instBlock.className = "editorial-inst-sub";
    instBlock.innerHTML = renderInlineMarkdown(entry.institution);
    detail.appendChild(instBlock);
  }
  
  if (detail.childNodes.length > 0) {
    content.appendChild(detail);
  }

  row.appendChild(date);
  row.appendChild(content);
  return row;
};

const buildServicesItem = (item) => {
  const entry = item || {};
  const row = document.createElement("div");
  row.className = "editorial-grid-row";

  const datePeriod = normalizeInlineText(entry.period) || normalizeInlineText(entry.year) || "";

  const date = document.createElement("div");
  date.className = "editorial-date-column";
  
  const startDiv = document.createElement("div");
  startDiv.className = "editorial-date-start";
  startDiv.textContent = datePeriod;
  date.appendChild(startDiv);

  const content = document.createElement("div");
  content.className = "editorial-detail-column";

  const role = document.createElement("h3");
  role.className = "editorial-item-title";
  role.textContent = entry.role || "";
  content.appendChild(role);

  const detail = document.createElement("div");
  detail.className = "editorial-item-subtitle";

  if (entry.event) {
    const eventBlock = document.createElement("div");
    eventBlock.className = "editorial-inst-name";
    eventBlock.innerHTML = renderInlineMarkdown(entry.event);
    detail.appendChild(eventBlock);
  } else if (entry.detail) {
    const fallbackBlock = document.createElement("div");
    fallbackBlock.className = "editorial-inst-name";
    fallbackBlock.innerHTML = renderInlineMarkdown(entry.detail || "");
    detail.appendChild(fallbackBlock);
  }

  if (entry.location) {
    const locationBlock = document.createElement("div");
    locationBlock.className = "editorial-inst-sub";
    locationBlock.innerHTML = renderInlineMarkdown(entry.location);
    detail.appendChild(locationBlock);
  }
  
  if (detail.childNodes.length > 0) {
    content.appendChild(detail);
  }

  row.appendChild(date);
  row.appendChild(content);
  return row;
};

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
      buildItem: buildPublicationItem,
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
