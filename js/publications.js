const buildYearSection = (year, items) => {
  const section = document.createElement("section");
  section.className = "flex w-full flex-col items-center gap-[20px]";

  const header = document.createElement("div");
  header.className = "flex w-full items-center p-[10px]";

  const title = document.createElement("h2");
  title.className = "font-inter text-[24px] font-semibold leading-[28.8px] sm:text-[28px]";
  title.textContent = year;
  header.appendChild(title);

  const list = document.createElement("div");
  list.className = "flex w-full flex-col items-center gap-[30px]";
  items.forEach((item) => list.appendChild(buildPublicationCard(item)));

  section.appendChild(header);
  section.appendChild(list);
  return section;
};

const publicationsByYear = document.getElementById("publications-by-year");

if (publicationsByYear) {
  fetch("contents/publications.md")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch publications: ${response.status}`);
      }
      return response.text();
    })
    .then((markdown) => {
      const items = parseListData(markdown);
      if (!items.length) {
        publicationsByYear.innerHTML =
          '<p class="font-inter text-[14px] text-muted">No publications yet.</p>';
        return;
      }

      const sortedItems = [...items].sort((a, b) => {
        const aDate = getDateSortValue(a.date);
        const bDate = getDateSortValue(b.date);
        if (aDate === bDate) return 0;
        return bDate - aDate;
      });

      const groups = new Map();
      sortedItems.forEach((item) => {
        const year = (item.date || "").slice(0, 4) || "Unknown";
        if (!groups.has(year)) groups.set(year, []);
        groups.get(year).push(item);
      });

      Array.from(groups.entries())
        .sort(([yearA], [yearB]) => yearB.localeCompare(yearA))
        .forEach(([year, groupItems]) => {
          publicationsByYear.appendChild(buildYearSection(year, groupItems));
        });
    })
    .catch(() => {
      publicationsByYear.innerHTML =
        '<p class="font-inter text-[14px] text-muted">Publications unavailable.</p>';
    });
}
