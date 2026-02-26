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

const compareByDateDesc = (a, b) => {
  const aDate = getDateSortValue(a?.date);
  const bDate = getDateSortValue(b?.date);
  if (aDate === bDate) return 0;
  return bDate - aDate;
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

const renderPublicationYearGroups = (container, groups) => {
  Array.from(groups.entries())
    .sort(([yearA], [yearB]) => yearB.localeCompare(yearA))
    .forEach(([year, items]) => {
      container.appendChild(buildYearSection(year, items));
    });
};

const renderPublicationsByYear = async () => {
  const publicationsByYear = document.getElementById("publications-by-year");
  if (!publicationsByYear) return;

  try {
    const items = await loadList({
      url: "contents/publications.md",
      sortFn: compareByDateDesc,
    });
    if (!items.length) {
      renderEmpty(
        publicationsByYear,
        '<p class="font-inter text-[14px] text-muted">No publications yet.</p>'
      );
      return;
    }

    const groups = groupPublicationsByYear(items);
    renderPublicationYearGroups(publicationsByYear, groups);
  } catch {
    renderError(
      publicationsByYear,
      '<p class="font-inter text-[14px] text-muted">Publications unavailable.</p>'
    );
  }
};

renderPublicationsByYear();
