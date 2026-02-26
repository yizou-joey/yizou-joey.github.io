const buildNewsItem = (item) => {
  const row = document.createElement("div");
  row.className = "flex w-full max-w-[900px] items-start gap-[17px]";

  const dateWrap = document.createElement("div");
  dateWrap.className = "flex h-full items-center";

  const dateChip = document.createElement("div");
  dateChip.className = "rounded-[6px] bg-[#f1f1ef] px-[9px] py-[2px] whitespace-nowrap";

  const dateText = document.createElement("span");
  dateText.className = "font-inter text-[13px] font-medium leading-[16.8px] text-muted";
  dateText.textContent = item.date || "";

  dateChip.appendChild(dateText);
  dateWrap.appendChild(dateChip);

  const content = document.createElement("p");
  content.className = "font-inter text-[16px] leading-relaxed text-ink sm:text-[18px] md:text-[20px]";
  content.innerHTML = renderInlineMarkdown(item.text || "");

  row.appendChild(dateWrap);
  row.appendChild(content);
  return row;
};

const buildTeachingItem = (item) => {
  const card = document.createElement("div");
  card.className = "w-full max-w-[833px] rounded-xl border border-line bg-white p-[24px] sm:p-[20px] md:p-[15px]";

  const grid = document.createElement("div");
  grid.className =
    "grid w-full grid-cols-1 items-center gap-2 sm:grid-cols-[170px_1fr] sm:gap-3";

  const role = document.createElement("span");
  role.className = "font-inter text-[18px] font-semibold sm:text-[16px]";
  role.textContent = item.role || "";

  const detail = document.createElement("span");
  detail.className =
    "font-inter text-[14px] leading-relaxed text-muted sm:text-[16px] sm:justify-self-end sm:text-right";
  detail.innerHTML = renderInlineMarkdown(item.detail || "");

  grid.appendChild(role);
  grid.appendChild(detail);
  card.appendChild(grid);
  return card;
};

const renderList = ({
  url,
  container,
  buildItem,
  emptyMessage,
  errorMessage,
  sort,
}) => {
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status}`);
      }
      return response.text();
    })
    .then((markdown) => {
      const items = parseListData(markdown);
      if (!items.length) {
        container.innerHTML = emptyMessage;
        return;
      }
      const sortedItems = sort ? [...items].sort(sort) : items;
      sortedItems.forEach((item) => {
        container.appendChild(buildItem(item));
      });
    })
    .catch(() => {
      container.innerHTML = errorMessage;
    });
};

const publicationsList = document.getElementById("publications-list");
const newsList = document.getElementById("news-list");
const teachingList = document.getElementById("teaching-list");
const bioIntro = document.getElementById("bio-intro");

if (publicationsList) {
  renderList({
    url: "contents/publications.md",
    container: publicationsList,
    buildItem: buildPublicationCard,
    emptyMessage:
      '<p class="font-inter text-[14px] text-muted">No publications yet.</p>',
    errorMessage:
      '<p class="font-inter text-[14px] text-muted">Publications unavailable.</p>',
  });
}

if (newsList) {
  renderList({
    url: "contents/news.md",
    container: newsList,
    buildItem: buildNewsItem,
    emptyMessage:
      '<p class="font-inter text-[14px] text-muted">No news yet.</p>',
    errorMessage:
      '<p class="font-inter text-[14px] text-muted">News unavailable.</p>',
    sort: (a, b) => {
      const aTime = getDateSortValue(a.date);
      const bTime = getDateSortValue(b.date);
      if (aTime === bTime) return 0;
      return bTime - aTime;
    },
  });
}

if (teachingList) {
  renderList({
    url: "contents/teaching.md",
    container: teachingList,
    buildItem: buildTeachingItem,
    emptyMessage:
      '<p class="font-inter text-[14px] text-muted">No teaching entries yet.</p>',
    errorMessage:
      '<p class="font-inter text-[14px] text-muted">Teaching unavailable.</p>',
  });
}

if (bioIntro) {
  fetch("contents/bio.md")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch bio: ${response.status}`);
      }
      return response.text();
    })
    .then((markdown) => {
      if (!bioIntro) return;
      const text = (markdown || "").trim();
      if (!text) {
        bioIntro.textContent = "";
        return;
      }
      bioIntro.innerHTML = renderInlineMarkdown(text);
    })
    .catch(() => {
      if (!bioIntro) return;
      bioIntro.textContent = "Bio unavailable.";
    });
}
