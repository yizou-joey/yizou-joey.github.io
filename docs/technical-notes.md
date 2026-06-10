# Technical Notes

This document describes how this GitHub Pages academic homepage is structured and how content is rendered.

## What we did

- Render Publications, News, and Teaching from markdown lists with inline markdown support.
- Added corresponding author markers: `\*` and `*` in `authors` render as superscript.
- Added a `publications.html` page and updated the homepage nav to point to it.
- Renamed `content` to `contents`.
- **Refactored JS**: Separated shared utilities and page-specific logic into separate files.
- **Behavior-preserving cleanup**: Kept rendered output/content rules the same while improving readability and defensive handling in JS.
- **Shared CSS tokens**: Centralized font families, colors, and spacing in `css/styles.css`.

## File Structure

```
css/
└── styles.css           # Shared CSS tokens and semantic utility classes

design-system/
├── design.html          # Visual design language specification page
├── design.md            # Source-of-truth design language document
├── design-spec.css      # Styling for design language visualization
├── design-conventions.md
└── inspirations.md

js/
├── utils.js             # Shared rendering + data loading utilities
├── index.js             # Index page specific logic
└── publications.js      # Publications page specific logic
```

### Shared JS pipeline

Main list-driven sections now use shared helpers in `js/utils.js`:

- `fetchTextOrThrow(url)` for fetch + status checking
- `loadList({ url, sortFn })` for fetch + markdown parse + optional sort
- `renderItems({ container, items, buildItem })` for DOM rendering
- `renderEmpty(container, html)` and `renderError(container, html)` for section fallback states

This refactor is intended to improve robustness/readability without changing user-facing behavior.

## Shared CSS Tokens

Shared styling tokens and semantic utility classes are in `css/styles.css`:

```css
:root {
  --color-ink: #15120f;
  --color-muted: #787774;
  --color-paper: #f7f4ef;
  --color-stone: #f6f5f4;
  --color-line: #e9e7e3;
  --space-section: clamp(24px, 2.4vw, 32px);
  --space-section-md: clamp(28px, 3vw, 36px);
  --space-section-py: clamp(28px, 3.2vw, 40px);
  --space-gutter-fluid: clamp(16px, 3vw, 32px);
  --space-col-gap-fluid: clamp(20px, 4vw, 56px);
  --space-card-inline: clamp(18px, 2vw, 24px);
}
```

### Using semantic spacing classes

In HTML, use the shared CSS utility classes:

```html
<div class="section-gap">
<section class="section-py">
```

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

Each file uses list entries:

```md
- key: value
  key: value
```

### Publications fields

- `date` (required, ISO `YYYY-MM-DD` for sorting and yearly grouping)
- `selected` (optional boolean; when `true`, the item appears in the homepage research/publications section)
- `venue`
- `venueColor` (hex color)
- `title` (supports inline markdown; avoid manual `\n` line breaks so titles wrap naturally)
- `authors` (use `\*` or `*` for corresponding author marker)
- `award` (optional, canonical field for award badge text, e.g. `Best Paper Honorable Mention`)
- `status` (optional legacy fallback; used only when `award` is missing/empty)
- `youtubeUrl` (optional, renders a video supplemental chip with YouTube icon)
- `youtubeLabel` (optional, custom text for the YouTube/video chip, e.g. `presentation video` or `demo video`)
- `arxivUrl` (optional, renders an `arXiv` supplemental chip)
- `pdfUrl` (optional, renders a `PDF` supplemental chip; supports relative paths such as `files/...`)
- `slidesUrl` (optional, renders a `Slides` supplemental chip; supports relative paths such as `files/...`)

If any supplemental URL fields are present, publication cards render a compact chip row below
the authors. Chips use local monochrome SVG icons from `files/icons/`, keep neutral styling,
and open links in a new tab.

### News fields

- `date` (required, ISO `YYYY-MM-DD` for sorting)
- `text` (supports `**bold**`, `*italic*`, and `[link](url)`)

### Teaching fields

- `role`
- `detail` (supports `**bold**`, `*italic*`, and `[link](url)`)

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
