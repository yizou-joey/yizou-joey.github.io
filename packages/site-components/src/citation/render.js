import { escapeHtml } from "../escape-html.js";

export const renderProjectCitationHtml = (bibtex, { headingLevel = "h2" } = {}) => {
  if (!["h2", "h3"].includes(headingLevel)) {
    throw new Error(`Unsupported project citation heading level: ${headingLevel}`);
  }

  return `<section class="project-section project-citation" aria-labelledby="project-citation-title">
  <${headingLevel} id="project-citation-title" class="type-title-section">BibTeX</${headingLevel}>
  <div class="project-citation-frame">
    <button class="project-citation-copy" type="button" aria-label="Copy BibTeX" hidden>
      <!-- Tabler Outline icons; license: files/icons/tabler-LICENSE.txt -->
      <svg class="project-citation-copy-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666"/><path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1"/></svg>
      <svg class="project-citation-check-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5l10 -10"/></svg>
    </button>
    <pre class="project-citation-code"><code>${escapeHtml(bibtex)}</code></pre>
  </div>
  <span class="project-citation-status" role="status"></span>
</section>`;
};
