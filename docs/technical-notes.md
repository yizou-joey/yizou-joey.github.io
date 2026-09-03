# Technical Notes

This document describes the stable architecture and build pipeline. Visual
implementation belongs in `css/styles.css`; design intent belongs in
`DESIGN.md`; content conventions belong in `docs/content-schema.md`.

## Architecture

The site is a Vite multi-page application with three root entry pages:

- `index.html`: homepage and selected research.
- `publications.html`: full publication archive grouped by year.
- `404.html`: not-found page.

Section content is stored in single-purpose ES modules under `contents/*.js`.
Shared renderers in `js/renderers.js` and formatting helpers in `js/utils.js`
turn those values into HTML. The content modules have no runtime schema or
field whitelist; renderers consume the fields they recognize.

`src/styles.css` is the Vite stylesheet entry. It loads Tailwind and then the
shared visual implementation in `css/styles.css`.

## Static Content Pipeline

The source HTML files contain lightweight target containers. The custom Vite
HTML transform imports content modules, renders each section, injects the
result, and marks the target with `data-content-rendered="static"`.

Content is therefore present in the deployed HTML before browser JavaScript
runs. Crawlers and readers do not need to fetch or interpret source content.
The content modules remain outside `public/` and are not deployed separately.

## Build and Verification

- `npm run dev` optimizes source images and starts Vite.
- `npm run build` optimizes images, builds all entry pages, and verifies the
  generated output.
- `npm run check` aliases the complete production build.
- `npm run check:dist` verifies expected pages, static injection markers, and
  rendered local HTML/CSS references.
- `npm run preview` rebuilds before serving `dist/`.

Build output is written to ignored `dist/`. The deployment workflow runs the
same production build used locally.

## Assets

Deployable files live under `public/files/` and use public-relative references
such as `files/materials/paper.pdf`. Editable image sources live under
`assets/original-images/`.

`scripts/optimize-images.mjs` generates web-ready variants under the ignored
`public/files/generated/` directory before development and production builds.
The distribution check catches rendered references whose target files are
missing from the final output.

## Browser Runtime

Content rendering has no browser-side runtime. The remaining JavaScript is for
small presentation behavior:

- `js/favicon.js` swaps active/idle favicon assets and follows the browser color
  scheme.
- `js/404.js` provides the 404-page interaction.

GoatCounter is loaded asynchronously for visitor analytics. None of these
scripts is required for reading the page content.
