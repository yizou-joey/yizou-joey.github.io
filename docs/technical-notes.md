# Technical Notes

This document describes how this GitHub Pages academic homepage is structured and how content is rendered.

## Current Structure

- `docs/design-system.md`: visual design source of truth.
- `docs/content-schema.md`: content authoring contract.
- `css/styles.css`: shared design tokens, semantic utility classes, and component styles.
- `js/site-contracts.js`: machine-readable venue registry and content schema fields.
- `js/utils.js`: shared parsing, rendering, data loading, and publication rendering utilities.
- `js/index.js`: homepage section renderers.
- `js/publications.js`: publications page year grouping.
- `scripts/check-site-contracts.mjs`: zero-dependency contract checker used by `npm run check`.

### Shared JS pipeline

Main list-driven sections now use shared helpers in `js/utils.js`:

- `fetchTextOrThrow(url)` for fetch + status checking
- `loadList({ url, sortFn })` for fetch + markdown parse + optional sort
- `renderItems({ container, items, buildItem })` for DOM rendering
- `renderEmpty(container, html)` and `renderError(container, html)` for section fallback states

This refactor is intended to improve robustness/readability without changing user-facing behavior.

## Shared CSS Tokens

Shared styling tokens and semantic utility classes are in `css/styles.css`. The design direction is documented in `docs/design-system.md`.

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

### Using semantic spacing classes

In HTML, use the shared CSS utility classes:

```html
<div class="section-gap">
<section class="section-py">
```

Page-specific exceptions should also be semantic classes. Avoid inline `style`
attributes in HTML.

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
