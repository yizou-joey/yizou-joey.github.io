const PUBLICATION_VIEW = {
  LIST: "list",
  CARDS: "cards",
};

const DEFAULT_VIEW = PUBLICATION_VIEW.LIST;
const DEFAULT_FILTER = "ALL";

const compareByDateDesc = (a, b) => {
  const aDate = getDateSortValue(a?.date);
  const bDate = getDateSortValue(b?.date);
  if (aDate === bDate) return 0;
  return bDate - aDate;
};

const getPublicationsState = () => ({
  allItems: [],
  activeView: DEFAULT_VIEW,
  activeType: DEFAULT_FILTER,
});

const getFilteredItems = (items, activeType) => {
  const sorted = [...(items || [])].sort(compareByDateDesc);
  if (activeType === DEFAULT_FILTER) return sorted;
  return sorted.filter((item) => normalizePublicationType(item?.type) === activeType);
};

const buildTypeSummaryText = (items) => {
  const countByType = new Map();
  (items || []).forEach((item) => {
    const type = normalizePublicationType(item?.type);
    countByType.set(type, (countByType.get(type) || 0) + 1);
  });

  const pieces = PUBLICATION_TYPE_ORDER.filter((type) => countByType.has(type)).map((type) => {
    const label = PUBLICATION_TYPE_LABEL[type] || type;
    return `${label}: ${countByType.get(type)}`;
  });

  return pieces.length ? pieces.join("  ·  ") : "No publications yet.";
};

const buildListMetaChip = (text, tone = "default") => {
  const chip = document.createElement("span");
  let toneClass = "publication-list-chip";
  if (tone === "strong") toneClass = "publication-list-chip publication-list-chip-strong";
  if (tone === "award") toneClass = "publication-list-chip publication-list-chip-award";
  chip.className = toneClass;
  chip.textContent = text;
  return chip;
};

const buildPublicationTypeChip = (entry) => {
  const type = normalizePublicationType(entry?.type);
  const typeLabel = PUBLICATION_TYPE_LABEL[type] || "Workshop";
  const workshopLabel = String(entry?.workshopLabel || "").trim();

  const chip = document.createElement("span");
  chip.className = "publication-list-chip publication-list-chip-strong publication-type-chip";

  const mainText = document.createElement("span");
  mainText.className = "publication-type-chip-label";
  mainText.textContent = typeLabel;
  chip.appendChild(mainText);

  if (type === "W" && workshopLabel) {
    const nested = document.createElement("span");
    nested.className = "publication-type-chip-nested";
    nested.textContent = workshopLabel;
    chip.appendChild(nested);
  }

  return chip;
};

const buildStructuredPublicationRow = (item) => {
  const entry = item || {};
  const publicationYear = String(entry.date || "").slice(0, 4);
  const publicationType = normalizePublicationType(entry.type);
  const hasWorkshopLabel = publicationType === "W" && String(entry.workshopLabel || "").trim();

  const article = document.createElement("article");
  article.className = "publication-row card-surface w-full rounded-xl";

  const content = document.createElement("div");
  content.className = "publication-row-inner";

  const top = document.createElement("div");
  top.className = "publication-row-top";

  const topLeft = document.createElement("div");
  topLeft.className = "publication-row-top-left";

  const topRight = document.createElement("div");
  topRight.className = "publication-row-top-right";

  const middle = document.createElement("div");
  middle.className = "publication-row-main";

  const title = document.createElement("h3");
  title.className = "publication-title font-inter text-[18px] font-semibold sm:text-[20px]";
  title.innerHTML = renderInlineMarkdown(entry.title || "", { preserveLineBreaks: false });

  const authors = document.createElement("p");
  authors.className = "font-inter text-[14px] leading-relaxed text-ink sm:text-[15px]";
  authors.innerHTML = renderAuthors(entry.authors || "");

  const description = document.createElement("p");
  description.className = "font-inter text-[14px] leading-relaxed text-muted sm:text-[15px]";
  description.innerHTML = renderInlineMarkdown(entry.description || "");

  middle.appendChild(title);
  middle.appendChild(authors);
  if (entry.description && !hasWorkshopLabel) middle.appendChild(description);

  if (publicationYear) {
    topLeft.appendChild(buildListMetaChip(publicationYear));
  }
  topLeft.appendChild(buildPublicationTypeChip(entry));

  if (entry.venueAcronym || entry.venue) {
    topLeft.appendChild(buildListMetaChip(entry.venueAcronym || entry.venue));
  }
  if (entry.award) {
    topLeft.appendChild(buildListMetaChip(entry.award, "award"));
  }

  const supplements = getPublicationSupplementLinks(entry);
  if (supplements.length) {
    const linksWrap = document.createElement("div");
    linksWrap.className = "publication-row-links";
    supplements.forEach((supplement) => linksWrap.appendChild(buildSupplementChip(supplement)));
    topRight.appendChild(linksWrap);
  }

  const idBadge = document.createElement("span");
  idBadge.className = "publication-id-badge";
  idBadge.textContent = entry.publicationId || "--";
  topRight.appendChild(idBadge);

  top.appendChild(topLeft);
  top.appendChild(topRight);

  content.appendChild(top);
  content.appendChild(middle);
  article.appendChild(content);
  return article;
};

const renderStructuredList = (container, items) => {
  if (!container) return;
  container.innerHTML = "";

  if (!items.length) {
    renderEmpty(
      container,
      '<p class="font-inter text-[14px] text-muted">No publications in this filter.</p>'
    );
    return;
  }

  items.forEach((item) => container.appendChild(buildStructuredPublicationRow(item)));
};

const buildYearSection = (year, items) => {
  const section = document.createElement("section");
  section.className = "flex w-full flex-col items-center gap-[20px]";

  const header = document.createElement("div");
  header.className = "flex w-full items-center p-[10px]";

  const title = document.createElement("h2");
  title.className = "font-inter text-[24px] font-semibold leading-[29px] sm:text-[28px]";
  title.textContent = year;
  header.appendChild(title);

  const list = document.createElement("div");
  list.className = "flex w-full flex-col items-center gap-[30px]";
  items.forEach((item) => list.appendChild(buildPublicationCard(item)));

  section.appendChild(header);
  section.appendChild(list);
  return section;
};

const groupPublicationsByYear = (items) => {
  const groups = new Map();
  items.forEach((item) => {
    const year = (item?.date || "").slice(0, 4) || "Unknown";
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year).push(item);
  });
  return groups;
};

const renderPublicationYearGroups = (container, items) => {
  if (!container) return;
  container.innerHTML = "";

  if (!items.length) {
    renderEmpty(
      container,
      '<p class="font-inter text-[14px] text-muted">No publications in this filter.</p>'
    );
    return;
  }

  const groups = groupPublicationsByYear(items);
  Array.from(groups.entries())
    .sort(([yearA], [yearB]) => yearB.localeCompare(yearA))
    .forEach(([year, yearItems]) => {
      container.appendChild(buildYearSection(year, yearItems));
    });
};

const syncViewUI = (state) => {
  const listContainer = document.getElementById("publications-structured-list");
  const cardsContainer = document.getElementById("publications-by-year");

  const listVisible = state.activeView === PUBLICATION_VIEW.LIST;
  if (listContainer) listContainer.classList.toggle("hidden", !listVisible);
  if (cardsContainer) cardsContainer.classList.toggle("hidden", listVisible);

  document.querySelectorAll(".publication-toggle-btn").forEach((button) => {
    const isActive = button.getAttribute("data-view") === state.activeView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  document.querySelectorAll(".publication-filter-btn").forEach((button) => {
    const isActive = button.getAttribute("data-type") === state.activeType;
    button.classList.toggle("is-active", isActive);
  });
};

const renderPublications = (state) => {
  const summary = document.getElementById("publications-summary");
  const listContainer = document.getElementById("publications-structured-list");
  const cardsContainer = document.getElementById("publications-by-year");

  const filteredItems = getFilteredItems(state.allItems, state.activeType);

  if (summary) {
    const head = `${state.allItems.length} total publication${state.allItems.length === 1 ? "" : "s"}`;
    const body = buildTypeSummaryText(state.allItems);
    summary.textContent = `${head}  ·  ${body}`;
  }

  renderStructuredList(listContainer, filteredItems);
  renderPublicationYearGroups(cardsContainer, filteredItems);
  syncViewUI(state);
};

const wirePublicationControls = (state) => {
  document.getElementById("publication-view-toggle")?.addEventListener("click", (event) => {
    const target = event.target.closest("button[data-view]");
    if (!target) return;
    const nextView = target.getAttribute("data-view");
    if (!nextView || !Object.values(PUBLICATION_VIEW).includes(nextView)) return;
    state.activeView = nextView;
    renderPublications(state);
  });

  document.getElementById("publication-type-filters")?.addEventListener("click", (event) => {
    const target = event.target.closest("button[data-type]");
    if (!target) return;
    const nextType = target.getAttribute("data-type") || DEFAULT_FILTER;
    state.activeType = nextType;
    renderPublications(state);
  });
};

const renderPublicationsByYear = async () => {
  const listContainer = document.getElementById("publications-structured-list");
  const cardsContainer = document.getElementById("publications-by-year");
  if (!listContainer || !cardsContainer) return;

  const state = getPublicationsState();

  try {
    const items = await loadList({
      url: "contents/publications.md",
      sortFn: compareByDateDesc,
    });

    state.allItems = assignPublicationIdsByType(items);

    wirePublicationControls(state);
    renderPublications(state);
  } catch {
    renderError(
      listContainer,
      '<p class="font-inter text-[14px] text-muted">Publications unavailable.</p>'
    );
    cardsContainer.innerHTML = "";
  }
};

renderPublicationsByYear();
