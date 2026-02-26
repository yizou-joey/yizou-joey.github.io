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
  --space-section: 60px;
  --space-section-md: 80px;
  --space-section-py: 50px;
}
```

### Using semantic spacing classes

In HTML, use the shared CSS utility classes:

```html
<div class="section-gap">
<section class="section-py">
```

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
- `venue`
- `venueColor` (hex color)
- `title` (supports inline markdown; `\n` for line breaks)
- `authors` (use `\*` or `*` for corresponding author marker)
- `description` (supports inline markdown)

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

Potential actions:

- Add support to embedded video links.
