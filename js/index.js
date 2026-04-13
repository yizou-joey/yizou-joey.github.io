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
  card.className = "teaching-card card-surface radius-teaching section-aligned-card";

  const grid = document.createElement("div");
  grid.className =
    "grid w-full grid-cols-1 items-center gap-2 sm:grid-cols-[170px_1fr] sm:gap-3";

  const role = document.createElement("span");
  role.className = "type-title-minor";
  role.textContent = entry.role || "";

  const detail = document.createElement("span");
  detail.className =
    "type-body text-muted sm:justify-self-end sm:text-right";
  detail.innerHTML = renderInlineMarkdown(entry.detail || "");

  grid.appendChild(role);
  grid.appendChild(detail);
  card.appendChild(grid);
  return card;
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
    bioIntro.innerHTML = renderInlineMarkdown(text);
  } catch {
    bioIntro.textContent = "Bio unavailable.";
  }
};

renderPublicationsSection();
renderNewsSection();
renderTeachingSection();
renderBioSection();
