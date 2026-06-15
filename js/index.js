import {
  fetchTextOrThrow,
  loadList,
  parseBooleanLike,
  renderEmpty,
  renderError,
} from "./utils.js";
import {
  compareByDateDesc,
  renderBioHtml,
  renderEducationItemHtml,
  renderListHtml,
  renderNewsItemHtml,
  renderSelectedPublicationsHtml,
  renderServicesItemHtml,
  renderTeachingItemHtml,
} from "./renderers.js";

const isStaticRendered = (container) =>
  container?.dataset?.contentRendered === "static";

const renderRuntimeHtml = (container, html) => {
  if (!container) return;
  container.innerHTML = html;
};

const renderListSection = async ({
  url,
  container,
  renderItemsHtml,
  emptyMessage,
  errorMessage,
  sortFn,
}) => {
  if (!container || isStaticRendered(container)) return;
  try {
    const items = await loadList({ url, sortFn });
    const html = renderItemsHtml(items);
    if (!html) {
      renderEmpty(container, emptyMessage);
      return;
    }
    renderRuntimeHtml(container, html);
  } catch {
    renderError(container, errorMessage);
  }
};

const renderPublicationsSection = async () => {
  const publicationsList = document.getElementById("publications-list");
  if (!publicationsList || isStaticRendered(publicationsList)) return;
  try {
    const allItems = await loadList({
      url: "contents/publications.md",
    });
    const html = renderSelectedPublicationsHtml(allItems);

    if (!html) {
      renderEmpty(
        publicationsList,
        '<p class="type-body-sm text-muted">No selected publications yet.</p>'
      );
      return;
    }

    renderRuntimeHtml(publicationsList, html);
  } catch {
    renderError(
      publicationsList,
      '<p class="type-body-sm text-muted">Publications unavailable.</p>'
    );
  }
};

const renderNewsSection = async () => {
  const newsList = document.getElementById("news-list");
  await renderListSection({
    url: "contents/news.md",
    container: newsList,
    renderItemsHtml: (items) => renderListHtml(items, renderNewsItemHtml),
    emptyMessage: '<li class="type-body-sm text-muted">No news yet.</li>',
    errorMessage: '<li class="type-body-sm text-muted">News unavailable.</li>',
    sortFn: compareByDateDesc,
  });
};

const renderTeachingSection = async () => {
  const teachingList = document.getElementById("teaching-list");
  await renderListSection({
    url: "contents/teaching.md",
    container: teachingList,
    renderItemsHtml: (items) => renderListHtml(items, renderTeachingItemHtml),
    emptyMessage:
      '<p class="type-body-sm text-muted">No teaching entries yet.</p>',
    errorMessage:
      '<p class="type-body-sm text-muted">Teaching unavailable.</p>',
  });
};

const renderServicesSection = async () => {
  const servicesList = document.getElementById("services-list");
  await renderListSection({
    url: "contents/services.md",
    container: servicesList,
    renderItemsHtml: (items) => renderListHtml(items, renderServicesItemHtml),
    emptyMessage:
      '<p class="type-body-sm text-muted">No services entries yet.</p>',
    errorMessage:
      '<p class="type-body-sm text-muted">Services unavailable.</p>',
  });
};

const renderEducationSection = async () => {
  const educationList = document.getElementById("education-list");
  await renderListSection({
    url: "contents/education.md",
    container: educationList,
    renderItemsHtml: (items) => renderListHtml(items, renderEducationItemHtml),
    emptyMessage:
      '<p class="type-body-sm text-muted">No education entries yet.</p>',
    errorMessage:
      '<p class="type-body-sm text-muted">Education unavailable.</p>',
  });
};

const renderBioSection = async () => {
  const bioIntro = document.getElementById("bio-intro");
  if (!bioIntro || isStaticRendered(bioIntro)) return;

  try {
    const markdown = await fetchTextOrThrow("contents/bio.md");
    renderRuntimeHtml(bioIntro, renderBioHtml(markdown));
  } catch {
    bioIntro.textContent = "Bio unavailable.";
  }
};

const observeHalftoneColophon = () => {
  const el = document.querySelector(".halftone-colophon");
  if (!el) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.3 }
  );
  observer.observe(el);
};

renderPublicationsSection();
renderNewsSection();
renderServicesSection();
renderTeachingSection();
renderEducationSection();
renderBioSection();
observeHalftoneColophon();
