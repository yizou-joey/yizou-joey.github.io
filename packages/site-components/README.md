# `@site/components`

Private npm workspace for site components with a real independent contract.
The package intentionally has no runtime dependencies.

## Public exports

- `@site/components/citation/render` exports `renderProjectCitationHtml(bibtex,
  { headingLevel })`. It emits selectable static markup, escapes BibTeX, and
  supports only `h2` (project pages) and `h3` (the Design specimen).
- `@site/components/citation/behavior` exports
  `initializeProjectCitationBehavior(root?)`. It enhances one `.project-citation`
  instance when called in a browser; importing or calling it without browser
  globals is safe. Fixed IDs and first-instance behavior are an intentional
  single-instance contract.
- `@site/components/escape-html` exports the shared HTML escaping rule used by
  the package renderer and the site's existing rendering utilities.

CSS remains owned by `css/styles.css`. Static citation text remains useful
without JavaScript, and the existing selection-preserving `execCommand` fallback
is retained for HTTP contexts where the Clipboard API is unavailable.
