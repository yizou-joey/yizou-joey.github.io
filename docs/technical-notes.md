# Technical Notes

This document describes how this GitHub Pages academic homepage is structured and how content is rendered.

## Current Structure

- `DESIGN.md`: canonical visual design steering for AI agents and maintainers.
- `docs/content-schema.md`: content authoring contract.
- `css/styles.css`: shared design tokens, semantic utility classes, and component styles.
- `js/site-contracts.js`: machine-readable venue registry and content schema fields.
- `js/renderers.js`: shared HTML renderers used by Vite's HTML transform.
- `js/utils.js`: pure parsing, escaping, and publication rendering utilities.
- `scripts/check-site-contracts.mjs`: zero-dependency contract checker used by `npm run check`.
- `vite.config.js`: Vite configuration plus the HTML transform that injects content.

### Shared rendering pipeline

Main list-driven sections use shared helpers in `js/utils.js`:

- `parseListData(markdown)` for content parsing
- `renderInlineMarkdown(value)` for compact inline Markdown rendering
- `renderPublicationItemHtml(item)` for publication card markup

The browser-facing pages no longer fetch Markdown at runtime. HTML is the content delivery surface.

### HTML-first rendering pipeline

The source HTML files keep lightweight empty containers. Vite injects content
into those containers during both local development and production builds:

1. `npm run optimize:images` regenerates optimized static assets.
2. `npm run check` validates content, design contracts, generated assets, and
   public directory hygiene.
3. `vite build` reads `contents/*.md`, renders HTML through `js/renderers.js`,
   and writes complete `dist/index.html` and `dist/publications.html`.

Injected containers receive `data-content-rendered="static"`. The deployed
HTML itself contains the biography, news, publication, education, service, and
teaching text, so crawlers and AI assistants do not need to execute JavaScript
to read the page.

Content sources live outside `public/` and are not deployed as standalone
Markdown files. Inspect `dist/*.html` or the deployed GitHub Pages artifact when
you need to verify the full static HTML. `npm run preview` runs `npm run build`
first through the `prepreview` npm hook so local preview serves a fresh
statically-rendered `dist`.

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

## Pages

- `index.html`: main homepage
- `publications.html`: publications grouped by year (newest first)

## Content files

- Publications: `contents/publications.md`
- News: `contents/news.md`
- Teaching: `contents/teaching.md`
- Education: `contents/education.md`
- Services: `contents/services.md`

Each file uses list entries:

```md
- key: value
  key: value
```

Field rules are documented in `docs/content-schema.md` and enforced by `npm run check`.
Venue accents use `venueKey` and `js/site-contracts.js`; do not add per-entry `venueColor`.

If any supplemental URL fields are present, publication cards render compact bracket links below
the authors. Supplemental links open in a new tab.

## Next steps

- Add per-publication pages and link each entry to its detailed page.
- Add anchors on the homepage so entries can link to their positions.

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
