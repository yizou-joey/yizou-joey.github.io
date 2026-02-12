# Technical Notes

This document describes how this GitHub Pages academic homepage is structured and how content is rendered.

## What we did

- Render Publications, News, and Teaching from markdown lists with inline markdown support.
- Added corresponding author markers: `\*` and `*` in `authors` render as superscript.
- Added a `publications.html` page and updated the homepage nav to point to it.
- Renamed `content` to `contents`.

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
