# Technical Notes

This document describes how this GitHub Pages academic homepage is structured and how content is rendered.

## Current Structure

- `DESIGN.md`: canonical visual design steering for AI agents and maintainers.
- `docs/content-schema.md`: lightweight content authoring guide.
- `css/styles.css`: shared design tokens, semantic utility classes, and component styles.
- `js/renderers.js`: shared HTML renderers used by Vite's HTML transform.
- `js/utils.js`: escaping, inline formatting, venue, date, and publication rendering utilities.
- `vite.config.js`: Vite configuration plus the HTML transform that injects content.

### Shared rendering pipeline

Each file in `contents/*.js` is a directly imported ES module. There is no
custom content parser or field whitelist. Shared helpers still provide compact
inline Markdown rendering and publication markup. The browser-facing pages do
not fetch content at runtime; HTML remains the content delivery surface.

### HTML-first rendering pipeline

The source HTML files keep lightweight empty containers. Vite injects content
into those containers during both local development and production builds:

1. `npm run optimize:images` regenerates optimized static assets.
2. `vite build` imports `contents/*.js`, renders HTML through `js/renderers.js`,
   and writes complete `dist/index.html` and `dist/publications.html`.
3. `npm run check:dist` verifies the generated pages, static content markers,
   and rendered local references.

Injected containers receive `data-content-rendered="static"`. The deployed
HTML itself contains the biography, news, publication, education, service, and
teaching text, so crawlers and AI assistants do not need to execute JavaScript
to read the page.

Content sources live outside `public/` and are not deployed as standalone
files. Inspect `dist/*.html` or the deployed GitHub Pages artifact when you need
to verify the full static HTML. `npm run check` aliases the complete production
build, and `npm run preview` builds first through the `prepreview` hook.

## Shared CSS Tokens

Shared styling tokens and semantic utility classes are in `css/styles.css`.
Design rationale, token permissions, and UI guardrails are documented in the
root `DESIGN.md`.

```css
:root {
  --color-page-bg: #fdfdfc;
  --color-ink: #15120f;
  --color-muted: #787774;
  --color-line: #f2f1ee;
  --color-border-warm: #dfdcd4;
  --color-venue-ieee-vr: #262189;
  --color-venue-mmsys: rgb(24, 86, 105);
  --space-section-py: 32px;
  --space-gutter-fluid: clamp(16px, 3vw, 32px);
  --space-col-gap-fluid: clamp(20px, 4vw, 56px);
}
```

### Using semantic layout classes

In HTML, use shared semantic layout classes instead of Tailwind layout
utilities or arbitrary values:

```html
<section class="page-section page-gutter">
<div class="section-rail-l1 section-stack section-stack--center">
```

Page-specific exceptions should also be semantic classes. Avoid inline `style`
attributes, arbitrary bracket classes, and raw layout utilities in HTML.

## Interaction and motion guidelines

- Use motion only where it clarifies interactivity or feedback. Static display
  assets, such as bio keyword stickers, should stay visually stable unless they
  are part of an explicit interactive control.
- Hover motion should have a clear ownership model: direct hover on an
  interactive visual may use a small response; hover on a related link may use a
  stronger paired response when it helps connect the link and visual object.
- `prefers-reduced-motion: reduce` should remove transition/animation timing,
  but should not use `transform: ... !important` to suppress the final hover or
  focus state. Users who reduce motion should still receive state feedback,
  just without animated interpolation.
- Always verify interaction states under reduced-motion settings when adding or
  refactoring hover effects. Otherwise accessibility overrides can silently
  flatten the intended design in local previews.

### Dynamic favicon

The site uses a small favicon microinteraction implemented in `js/favicon.js`.
The active tab uses an open-folder SVG, while a hidden/background tab uses a
closed-folder SVG. This is a decorative browser-chrome detail that reinforces
the site's research archive feel without changing page content or navigation.

The favicon also follows browser color-scheme context:

- Light context: `public/files/favicon.svg` and
  `public/files/favicon-idle.svg` use dark ink lines.
- Dark context: `public/files/favicon-light.svg` and
  `public/files/favicon-idle-light.svg` use warm-paper lines.

HTML pages expose the icon paths through `data-active-light-icon`,
`data-idle-light-icon`, `data-active-dark-icon`, and `data-idle-dark-icon` on
the single `link[rel="icon"]`. The script listens to `visibilitychange` and
`prefers-color-scheme: dark`, then updates that same link's `href`; it should
not append additional favicon links.

When changing this interaction, keep each icon legible at 16px and 32px on both
light and dark browser chrome. Prefer simple SVG paths, no external fonts, no
filters, no embedded bitmaps, and no information that depends on the favicon
state for accessibility.

## Pages

- `index.html`: main homepage
- `publications.html`: publications grouped by year (newest first)

## Content files

- Biography: `contents/bio.js`
- Publications: `contents/publications.js`
- News: `contents/news.js`
- Teaching: `contents/teaching.js`
- Education: `contents/education.js`
- Services: `contents/services.js`

List-driven files export arrays of plain objects:

```js
export default [
  {
    date: "2026-03-25",
    text: "Natural-language content",
  },
];
```

Authoring conventions are documented in `docs/content-schema.md`. Renderers
ignore fields they do not use. Venue accents use `venueKey` and the compact
registry in `js/utils.js`.

If any supplemental URL fields are present, publication cards render compact bracket links below
the authors. Supplemental links open in a new tab.

## Next steps

- Add per-publication pages and link each entry to its detailed page.
- Add anchors on the homepage so entries can link to their positions.
- Explore a more representative favicon mark for HCI/XR/adaptive interface work
  while preserving the current active/idle and light/dark microinteraction.

## To-do

- Update the publication card design.
- Separate publication project page design.

## Known Issues

- **Bio education timeline period connector is not fully padding-responsive.**
  The diagonal connector in the left time-phase column (`bio.html` education rows) can drift when
  `padding-right`, date label offsets, or column widths are adjusted. It currently relies on runtime
  geometry from rendered text and still needs a more robust anchoring strategy that is independent
  from manual spacing tweaks.

Potential actions:

- Add support to embedded video links.
