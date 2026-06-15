import {
  loadList,
  renderEmpty,
  renderError,
} from "./utils.js";
import {
  compareByDateDesc,
  renderPublicationsByYearHtml,
} from "./renderers.js";

const isStaticRendered = (container) =>
  container?.dataset?.contentRendered === "static";

const renderPublicationsByYear = async () => {
  const publicationsByYear = document.getElementById("publications-by-year");
  if (!publicationsByYear || isStaticRendered(publicationsByYear)) return;

  try {
    const items = await loadList({
      url: "contents/publications.md",
      sortFn: compareByDateDesc,
    });
    const html = renderPublicationsByYearHtml(items);
    if (!html) {
      renderEmpty(
        publicationsByYear,
        '<p class="type-body-sm text-muted">No publications yet.</p>'
      );
      return;
    }

    publicationsByYear.innerHTML = html;
  } catch {
    renderError(
      publicationsByYear,
      '<p class="type-body-sm text-muted">Publications unavailable.</p>'
    );
  }
};

renderPublicationsByYear();
