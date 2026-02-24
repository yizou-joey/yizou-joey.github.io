# Technical Notes

This document describes how this GitHub Pages academic homepage is structured and how content is rendered.

## What we did

- Render Publications, News, and Teaching from markdown lists with inline markdown support.
- Added corresponding author markers: `\*` and `*` in `authors` render as superscript.
- Added a `publications.html` page and updated the homepage nav to point to it.
- Renamed `content` to `contents`.
- **Refactored JS**: Separated shared utilities, page-specific logic, and Tailwind config into separate files.
- **Shared Tailwind config**: Centralized font families, colors, box shadows, and spacing in `js/tailwind-config.js`.

## File Structure

```
js/
├── tailwind-config.js   # Shared Tailwind config (font, colors, spacing)
├── utils.js             # Shared rendering utilities (parseListData, escapeHtml, etc.)
├── index.js             # Index page specific logic
└── publications.js      # Publications page specific logic
```

## Tailwind Config

Shared configuration is in `js/tailwind-config.js`:

```javascript
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        serifSc: ["Noto Serif SC", "serif"],
      },
      colors: {
        ink: "#15120f",
        muted: "#787774",
        paper: "#f7f4ef",
        stone: "#f6f5f4",
        line: "#e9e7e3",
        chip: "#262189",
      },
      spacing: {
        section: "60px",
        "section-md": "80px",
        "section-py": "50px",
      },
    },
  },
};
```

### Using custom spacing

In HTML, use the config keys directly (without brackets):

```html
<div class="gap-section md:gap-section-md">
<section class="py-section-py">
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