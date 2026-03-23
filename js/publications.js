const PUBLICATION_VIEW = {
  LIST: "list",
  CARDS: "cards",
};

const SORT_DIRECTION = {
  ASC: "asc",
  DESC: "desc",
};

const DEFAULT_VIEW = PUBLICATION_VIEW.LIST;
const DEFAULT_FILTER = "ALL";

const DEFAULT_FILTERS = {
  type: DEFAULT_FILTER,
  year: DEFAULT_FILTER,
  venue: DEFAULT_FILTER,
  query: "",
};

const DEFAULT_SORT = {
  key: "date",
  direction: SORT_DIRECTION.DESC,
};

const SORT_LABEL_BY_KEY = {
  publicationId: "ID",
  title: "Title",
  type: "Type",
  venue: "Venue",
  year: "Year",
  date: "Date",
};

const DEFAULT_DIRECTION_BY_KEY = {
  publicationId: SORT_DIRECTION.ASC,
  title: SORT_DIRECTION.ASC,
  type: SORT_DIRECTION.ASC,
  venue: SORT_DIRECTION.ASC,
  year: SORT_DIRECTION.DESC,
  date: SORT_DIRECTION.DESC,
};

const TABLE_COLUMNS = [
  { key: "publicationId", label: "ID", sortable: true },
  { key: "title", label: "Title", sortable: true },
  { key: "type", label: "Type", sortable: true },
  { key: "venue", label: "Venue", sortable: true },
  { key: "year", label: "Year", sortable: true },
];

const compareByDateDesc = (a, b) => {
  const aDate = getDateSortValue(a?.date);
  const bDate = getDateSortValue(b?.date);
  if (aDate === bDate) return 0;
  return bDate - aDate;
};

const getPublicationsState = () => ({
  allItems: [],
  activeView: DEFAULT_VIEW,
  filters: { ...DEFAULT_FILTERS },
  sort: { ...DEFAULT_SORT },
  advancedFiltersOpen: false,
});

const getPublicationYear = (item) => {
  const year = String(item?.date || "").slice(0, 4).trim();
  return year || "Unknown";
};

const getPublicationVenueLabel = (item) =>
  String(item?.venueAcronym || item?.venue || "Unknown Venue").trim();

const normalizeSearchText = (value) => String(value || "").trim().toLowerCase();

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

const matchesFilters = (item, filters) => {
  if ((filters?.type || DEFAULT_FILTER) !== DEFAULT_FILTER) {
    if (normalizePublicationType(item?.type) !== filters.type) return false;
  }

  if ((filters?.year || DEFAULT_FILTER) !== DEFAULT_FILTER) {
    if (getPublicationYear(item) !== filters.year) return false;
  }

  if ((filters?.venue || DEFAULT_FILTER) !== DEFAULT_FILTER) {
    if (getPublicationVenueLabel(item) !== filters.venue) return false;
  }

  const query = normalizeSearchText(filters?.query);
  if (query) {
    const haystack = [
      item?.publicationId,
      item?.title,
      item?.authors,
      item?.venue,
      item?.venueAcronym,
      item?.award,
      getPublicationYear(item),
      PUBLICATION_TYPE_LABEL[normalizePublicationType(item?.type)],
    ]
      .map((value) => normalizeSearchText(value))
      .join(" ");

    if (!haystack.includes(query)) return false;
  }

  return true;
};

const getFilteredItems = (items, filters) =>
  (items || []).filter((item) => matchesFilters(item || {}, filters || DEFAULT_FILTERS));

const compareText = (a, b) => String(a || "").localeCompare(String(b || ""), undefined, { sensitivity: "base" });

const parsePublicationId = (value) => {
  const text = String(value || "").trim().toUpperCase();
  const match = text.match(/^([A-Z]+)(\d+)$/);
  if (!match) return { prefix: text, index: 0 };
  return {
    prefix: match[1],
    index: Number(match[2]) || 0,
  };
};

const comparePublicationIds = (a, b) => {
  const aId = parsePublicationId(a?.publicationId);
  const bId = parsePublicationId(b?.publicationId);

  const prefixCompare = compareText(aId.prefix, bId.prefix);
  if (prefixCompare !== 0) return prefixCompare;
  if (aId.index === bId.index) return 0;
  return aId.index - bId.index;
};

const compareBySortKey = (a, b, key) => {
  if (key === "publicationId") {
    return comparePublicationIds(a, b);
  }

  if (key === "title") {
    return compareText(a?.title, b?.title);
  }

  if (key === "type") {
    return compareText(
      PUBLICATION_TYPE_LABEL[normalizePublicationType(a?.type)] || normalizePublicationType(a?.type),
      PUBLICATION_TYPE_LABEL[normalizePublicationType(b?.type)] || normalizePublicationType(b?.type)
    );
  }

  if (key === "venue") {
    return compareText(getPublicationVenueLabel(a), getPublicationVenueLabel(b));
  }

  if (key === "year") {
    const aYear = Number(getPublicationYear(a)) || 0;
    const bYear = Number(getPublicationYear(b)) || 0;
    if (aYear === bYear) return 0;
    return aYear - bYear;
  }

  const aDate = getDateSortValue(a?.date);
  const bDate = getDateSortValue(b?.date);
  if (aDate === bDate) return 0;
  return aDate - bDate;
};

const getSortedItems = (items, sort) => {
  const sortKey = sort?.key || DEFAULT_SORT.key;
  const direction = sort?.direction || DEFAULT_SORT.direction;
  const multiplier = direction === SORT_DIRECTION.ASC ? 1 : -1;

  return [...(items || [])].sort((a, b) => {
    const primary = compareBySortKey(a, b, sortKey) * multiplier;
    if (primary !== 0) return primary;
    return compareByDateDesc(a, b);
  });
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
  chip.className = "publication-list-chip publication-type-chip";

  const mainText = document.createElement("span");
  mainText.className = "publication-type-chip-label";
  mainText.textContent = typeLabel;
  chip.appendChild(mainText);

  if (type === "W" && workshopLabel) {
    const divider = document.createElement("span");
    divider.className = "publication-type-chip-divider";
    divider.setAttribute("aria-hidden", "true");
    chip.appendChild(divider);

    const note = document.createElement("span");
    note.className = "publication-type-chip-note";
    note.textContent = workshopLabel;
    chip.appendChild(note);
  }

  return chip;
};

const buildTableVenueBadge = (entry) => {
  const badge = document.createElement("span");
  badge.className = "publication-table-venue-badge";
  badge.textContent = getPublicationVenueLabel(entry);
  const venueColor = String(entry?.venueColor || "").trim() || "#262189";
  badge.style.backgroundColor = venueColor;
  return badge;
};

const getSortIndicator = (state, key) => {
  const isActive = state.sort.key === key;
  if (!isActive) return "↕";
  return state.sort.direction === SORT_DIRECTION.ASC ? "↑" : "↓";
};

const buildTableHeaderCell = (state, column) => {
  const th = document.createElement("th");
  th.scope = "col";

  if (!column.sortable) {
    th.className = "publication-table-header-cell";
    th.textContent = column.label;
    return th;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "publication-table-sort-btn";
  button.setAttribute("data-sort-key", column.key);

  const isActive = state.sort.key === column.key;
  button.classList.toggle("is-active", isActive);

  const label = document.createElement("span");
  label.className = "publication-table-sort-label";
  label.textContent = column.label;

  const indicator = document.createElement("span");
  indicator.className = "publication-table-sort-indicator";
  indicator.textContent = getSortIndicator(state, column.key);

  button.appendChild(label);
  button.appendChild(indicator);
  th.appendChild(button);
  return th;
};

const buildTableRow = (item) => {
  const tr = document.createElement("tr");
  tr.className = "publication-table-row";

  const idCell = document.createElement("td");
  idCell.className = "publication-table-cell publication-table-cell-id";
  if (item.publicationId) {
    idCell.appendChild(buildListMetaChip(item.publicationId, "strong"));
  } else {
    idCell.textContent = "-";
  }

  const titleCell = document.createElement("td");
  titleCell.className = "publication-table-cell publication-table-cell-title";

  const title = document.createElement("h3");
  title.className = "publication-title publication-table-title font-inter text-[16px] font-semibold sm:text-[17px]";
  title.innerHTML = renderInlineMarkdown(item.title || "", { preserveLineBreaks: false });

  const authors = document.createElement("p");
  authors.className = "font-inter text-[13px] leading-relaxed text-muted sm:text-[14px]";
  authors.innerHTML = renderAuthors(item.authors || "");

  titleCell.appendChild(title);
  titleCell.appendChild(authors);

  const typeCell = document.createElement("td");
  typeCell.className = "publication-table-cell";
  typeCell.appendChild(buildPublicationTypeChip(item));

  const venueCell = document.createElement("td");
  venueCell.className = "publication-table-cell";
  venueCell.appendChild(buildTableVenueBadge(item));

  const yearCell = document.createElement("td");
  yearCell.className = "publication-table-cell publication-table-cell-year";
  yearCell.appendChild(buildListMetaChip(getPublicationYear(item)));

  tr.appendChild(idCell);
  tr.appendChild(titleCell);
  tr.appendChild(typeCell);
  tr.appendChild(venueCell);
  tr.appendChild(yearCell);
  return tr;
};

const renderPublicationTable = (container, items, state) => {
  if (!container) return;
  container.innerHTML = "";

  if (!items.length) {
    renderEmpty(
      container,
      '<p class="font-inter text-[14px] text-muted">No publications in this filter.</p>'
    );
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "publication-table-wrap card-surface w-full rounded-xl";

  const table = document.createElement("table");
  table.className = "publication-table";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  headRow.className = "publication-table-head-row";
  TABLE_COLUMNS.forEach((column) => headRow.appendChild(buildTableHeaderCell(state, column)));

  const tbody = document.createElement("tbody");
  items.forEach((item) => tbody.appendChild(buildTableRow(item)));

  thead.appendChild(headRow);
  table.appendChild(thead);
  table.appendChild(tbody);
  wrapper.appendChild(table);
  container.appendChild(wrapper);
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
    const year = getPublicationYear(item);
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

const getSortSummaryText = (sort) => {
  const label = SORT_LABEL_BY_KEY[sort.key] || "Date";
  const directionText = sort.direction === SORT_DIRECTION.ASC ? "A → Z" : "Z → A";
  if (sort.key === "year" || sort.key === "date") {
    return `${label} (${sort.direction === SORT_DIRECTION.ASC ? "oldest first" : "newest first"})`;
  }
  return `${label} (${directionText})`;
};

const hasAdvancedFiltersActive = (state) =>
  state.filters.year !== DEFAULT_FILTER || state.filters.venue !== DEFAULT_FILTER;

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

  document.querySelectorAll(".publication-filter-btn[data-type]").forEach((button) => {
    const isActive = button.getAttribute("data-type") === state.filters.type;
    button.classList.toggle("is-active", isActive);
  });

  const searchInput = document.getElementById("publication-search-input");
  if (searchInput && searchInput.value !== state.filters.query) {
    searchInput.value = state.filters.query;
  }

  const yearFilter = document.getElementById("publication-year-filter");
  if (yearFilter) yearFilter.value = state.filters.year;

  const venueFilter = document.getElementById("publication-venue-filter");
  if (venueFilter) venueFilter.value = state.filters.venue;

  const advancedWrap = document.getElementById("publication-advanced-filters");
  const moreFiltersButton = document.getElementById("publication-more-filters");
  const showAdvanced = state.advancedFiltersOpen || hasAdvancedFiltersActive(state);
  if (advancedWrap) {
    advancedWrap.classList.toggle("is-collapsed", !showAdvanced);
  }
  if (moreFiltersButton) {
    const activeCount =
      Number(state.filters.year !== DEFAULT_FILTER) + Number(state.filters.venue !== DEFAULT_FILTER);
    moreFiltersButton.textContent = activeCount ? `Filters (${activeCount})` : "Filters";
    moreFiltersButton.classList.toggle("is-active", showAdvanced);
    moreFiltersButton.setAttribute("aria-expanded", showAdvanced ? "true" : "false");
  }
};

const refreshAttributeFilterOptions = (state) => {
  const yearFilter = document.getElementById("publication-year-filter");
  const venueFilter = document.getElementById("publication-venue-filter");

  if (yearFilter) {
    const previous = state.filters.year || DEFAULT_FILTER;
    const years = Array.from(new Set(state.allItems.map((item) => getPublicationYear(item))))
      .sort((a, b) => b.localeCompare(a));

    yearFilter.innerHTML = `<option value="${DEFAULT_FILTER}">All years</option>`;
    years.forEach((year) => {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearFilter.appendChild(option);
    });

    state.filters.year = years.includes(previous) ? previous : DEFAULT_FILTER;
  }

  if (venueFilter) {
    const previous = state.filters.venue || DEFAULT_FILTER;
    const venues = Array.from(new Set(state.allItems.map((item) => getPublicationVenueLabel(item))))
      .sort((a, b) => a.localeCompare(b));

    venueFilter.innerHTML = `<option value="${DEFAULT_FILTER}">All venues</option>`;
    venues.forEach((venue) => {
      const option = document.createElement("option");
      option.value = venue;
      option.textContent = venue;
      venueFilter.appendChild(option);
    });

    state.filters.venue = venues.includes(previous) ? previous : DEFAULT_FILTER;
  }
};

const renderPublications = (state) => {
  const summary = document.getElementById("publications-summary");
  const listContainer = document.getElementById("publications-structured-list");
  const cardsContainer = document.getElementById("publications-by-year");

  const filteredItems = getFilteredItems(state.allItems, state.filters);
  const sortedListItems = getSortedItems(filteredItems, state.sort);
  const sortedCardItems = [...filteredItems].sort(compareByDateDesc);

  if (summary) {
    const total = state.allItems.length;
    const visible = filteredItems.length;
    const head = `${total} total publication${total === 1 ? "" : "s"}`;
    const body = buildTypeSummaryText(state.allItems);
    const focus = `${visible} shown`;
    summary.textContent = `${head}  ·  ${body}  ·  ${focus}`;
  }

  renderPublicationTable(listContainer, sortedListItems, state);
  renderPublicationYearGroups(cardsContainer, sortedCardItems);
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
    state.filters.type = target.getAttribute("data-type") || DEFAULT_FILTER;
    renderPublications(state);
  });

  document.getElementById("publication-search-input")?.addEventListener("input", (event) => {
    state.filters.query = String(event.target.value || "").trimStart();
    renderPublications(state);
  });

  document.getElementById("publication-year-filter")?.addEventListener("change", (event) => {
    state.filters.year = String(event.target.value || DEFAULT_FILTER);
    renderPublications(state);
  });

  document.getElementById("publication-venue-filter")?.addEventListener("change", (event) => {
    state.filters.venue = String(event.target.value || DEFAULT_FILTER);
    renderPublications(state);
  });

  document.getElementById("publication-clear-filters")?.addEventListener("click", () => {
    state.filters = { ...DEFAULT_FILTERS };
    state.sort = { ...DEFAULT_SORT };
    state.advancedFiltersOpen = false;
    renderPublications(state);
  });

  document.getElementById("publication-more-filters")?.addEventListener("click", () => {
    state.advancedFiltersOpen = !state.advancedFiltersOpen;
    renderPublications(state);
  });

  document.getElementById("publications-structured-list")?.addEventListener("click", (event) => {
    const target = event.target.closest("button[data-sort-key]");
    if (!target) return;

    const key = target.getAttribute("data-sort-key");
    if (!key) return;

    if (state.sort.key === key) {
      state.sort.direction =
        state.sort.direction === SORT_DIRECTION.ASC ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC;
    } else {
      state.sort.key = key;
      state.sort.direction = DEFAULT_DIRECTION_BY_KEY[key] || SORT_DIRECTION.ASC;
    }

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

    refreshAttributeFilterOptions(state);
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
