# Component Contracts

This is a lightweight map of the site's existing component boundaries, not a
new component framework. The source of truth remains the files listed below.
Markup and content are rendered into HTML at build time wherever possible;
browser JavaScript enhances only behaviors that need interaction.

## Component map

| Example / pages | Source and renderer | Styling, browser script/loading | Checks |
| --- | --- | --- | --- |
| Shared header/footer — published `index.html`, `404.html`, `design.html`, and project pages | `templates/site-header.html`, `templates/site-footer.html`; `build/site-shell.js` fills the `site:*` slots | Header/footer families in `css/styles.css` (`.site-header`, `.site-theme-toggle`, `.page-colophon`). The toggle behavior is inline theme bootstrap from `js/theme.js` source, injected in `vite.config.js`; it is not a page module `<script src>`. | `scripts/check-site-shell.mjs`: shell variants, slots, script/module inventory and footer placement. |
| Publication rows — homepage (`index.html`) and specimen (`design.html`) | `contents/publications.js`; `js/utils.js` (`renderPublicationItemHtml`), called through `js/renderers.js` and injected in `vite.config.js` | Publication styles in `css/styles.css` (`.editorial-publication-item`, `.publication-*`). Homepage declares `js/publication-preview.js` in `index.html`; Design declares it in `design.html`. Those page-level module declarations enhance preview behavior, not static row content. | `scripts/check-dist.mjs`, `scripts/check-publication-preview.mjs`; rendering is also exercised by `scripts/check-project-pages.mjs`. |
| Service rows — homepage and Design specimen | `contents/services.js`; `js/renderers.js` (`renderServicesItemHtml`), injected in `vite.config.js` | Service rules in `css/styles.css` (`.service-list`, `.service-event`). `index.html` and `design.html` each declare `<script type="module" src=".../js/service-tooltip.js">`; the component does not insert its own script tag. | `scripts/check-service-tooltip.mjs` checks output, interaction states and relevant CSS. |
| Project citation (BibTeX) — each generated project page and one Design specimen | `contents/publications.js`; `build/project-pages.js` and `vite.config.js` directly import the private workspace package's public entry point `@site/components/citation/render` | `.project-citation*` rules in `css/styles.css`. `templates/project.html` declares thin `js/project-citation.js`, which imports `@site/components/citation/behavior`; `design.html` declares the same module. The renderer emits static selectable text; the behavior module adds copy behavior. **Fixed IDs and first-instance query limit each page to one citation. Multiple-instance support is not implemented.** | `scripts/check-project-pages.mjs` checks package exports, both callers, escaping, heading levels and the package behavior's copy fallback states; `scripts/check-site-shell.mjs` verifies page module declarations. |
| Project page — `dodgeui.html` and `contextual-recovery.html` | `templates/project.html`; `build/project-pages.js` validates data and assembles the page; `build/site-shell.js` adds the shell | Project/page families in `css/styles.css` (`.project-*`). The template declares `js/favicon.js` and `js/project-citation.js`; `vite.config.js` expands the shell's theme bootstrap placeholder. Video is static iframe markup, not a project-specific JS module. | `scripts/check-project-pages.mjs`, `scripts/check-site-shell.mjs`, and production `scripts/check-dist.mjs`. |

Module loading follows the owning page: the shared shell adds HTML and the theme bootstrap placeholder, which Vite expands inline, but does not globally load page modules. Each source page or template declares its own module scripts (`index.html`, `design.html`, `404.html`, `templates/project.html`, etc.); Vite preserves and bundles those declarations. Checks of the module inventory live in `scripts/check-site-shell.mjs`.

These examples do not imply that every CSS family or interactive behavior has a
standalone component module. Styles remain in `css/styles.css`; for example,
service annotation behavior lives in `js/service-tooltip.js` while its CSS stays
with the `.service-event` family.

## Three responsibilities

1. **Content** — plain data belongs in the relevant `contents/*.js` module.
   Renderers consume that data and escape values according to their context.
   Repository-authored rich HTML, such as optional project details, is an
   explicit exception rather than a general content convention.
2. **Static structure and rendering** — templates describe page structure;
   build modules validate data, render reusable fragments, and inject them into
   named slots/containers. Shared fragments should have one build-time renderer
   and be called by each consumer, instead of extracting markup from a rendered
   full page.
3. **Browser enhancement** — JavaScript may add interaction to already useful
   HTML. It must not be required to reveal authored content. Copy controls start
   hidden until initialized; their fallback retains selection and the
   `execCommand` path for remote HTTP contexts where Clipboard API access is
   unavailable.

## Page integration

- Published page templates expose explicit slots or target containers. Use
  `build/static-content.js` for content-container injection, and
  `build/site-shell.js` for the shared shell slots.
- Put reusable build-time markup in a focused module. Components with an
  established package contract use a public `@site/components` entry; other
  site-specific rendering may remain under `build/` or `js/`. Export a renderer
  that accepts the data and only the deliberate variants needed by its consumers.
  Escape text at the HTML boundary; do not serialize user-facing content into
  executable scripts.
- Each page should call the renderer directly. Do not render an unrelated full
  page and then scrape a fragment from its HTML.
- Preserve page semantics at the call site, including heading level, landmark
  context, and unique IDs. Keep CSS and interaction behavior in their existing
  implementation files unless a separate change explicitly calls for moving it.
- Without JavaScript, content remains readable and selectable. Interactive
  controls should be hidden or inert until their enhancement is ready.

### Minimum component contract

Before treating markup as a reusable component, document and preserve:

- **Input:** the data and supported options accepted by the renderer, including
  which fields are required and how text/HTML is handled.
- **Semantic state:** the HTML structure, heading/landmark context, IDs, and
  states represented in the markup (for example, a hidden copy button until its
  handler is ready).
- **Accessibility:** accessible names, relationships such as
  `aria-labelledby`/`aria-describedby`, status announcements, keyboard access,
  and useful content without JavaScript, as applicable.
- **Verification:** focused assertions for output and escaping, variants and
  existing behavior, plus final rendered-page checks. Include representative
  page consumers; do not rely only on testing a helper in isolation.

Do not extract a component just to wrap a single static element, to share markup
that has no independent contract, or to accommodate hypothetical reuse. Keep
page-specific markup local until a second real consumer or a meaningful
independent behavior/validation boundary justifies shared code. If consumers
need different semantics, make the variation explicit and narrow rather than
silently scraping or rewriting generated markup.

### BibTeX citation call

The project and Design page use the same small build-time renderer through the
private workspace package's public entry point:

```js
import { renderProjectCitationHtml } from "@site/components/citation/render";

renderProjectCitationHtml(entry.citation.bibtex); // h2 in a project page
renderProjectCitationHtml(entry.citation.bibtex, { headingLevel: "h3" }); // Design specimen
```

`headingLevel` is deliberately limited to `h2`/`h3`; the renderer escapes the
BibTeX text. The current fixed IDs and first-instance-only browser initializer
mean one citation per page; do not add another instance without first changing
that contract and its tests.

## Validation

Add targeted checks alongside the existing script checks and include them in
`npm run check`. For a shared renderer, verify both page callers, the intentional
variant (such as heading level), escaped special characters, exact static text,
accessible names/status, and relevant existing validation behavior. Also keep
the rendered output checks in `scripts/check-dist.mjs` effective. Run
`npm run check` before delivery; it includes the production build and generated
page/asset verification.
