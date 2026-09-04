# Content Guide

Content lives in `contents/*.js`. Each section is one ES module that exports its
content as the default value. There is no field whitelist: renderers use the
fields they recognize and ignore the rest.

## Lists

News, publications, education, services, and teaching export arrays of plain
objects:

```js
export default [
  {
    date: "2026-03-25",
    text: "Natural-language copy with **bold** and [links](https://example.com/).",
  },
];
```

Biography content exports an array of paragraph strings. Supported inline
formatting remains intentionally small: `**bold**`, `*italic*`, and
`[label](url)`.

News entries may add a plain-text `note`, rendered as a quiet handwritten line
below the main copy.

Teaching entries may add an `instructors` array. Each instructor has a required
`name` and an optional `url`; the renderer labels one entry as `Instructor` and
multiple entries as `Instructors`:

```js
instructors: [
  {
    name: "Prof. Margaret MINSKY",
    url: "https://example.com/faculty/margaret-minsky/",
  },
],
```

## Dates

Machine-readable dates use the available ISO precision: `YYYY`, `YYYY-MM`, or
`YYYY-MM-DD`.

- Publications, news, services, and teaching use `date`.
- Education uses `startDate` and an optional `endDate`. Omit `endDate` for an
  ongoing entry.
- Use `dateLabel` or `periodLabel` only when the displayed wording should differ
  from the automatically formatted ISO value.

List order is preserved except for news and the full publications page, which
are sorted newest first by `date`. Homepage publications set `selected: true`
with a boolean value.

## Assets and venues

Local assets use public-relative paths such as
`files/materials/paper.pdf`. A production build fails if a rendered local
reference is missing.

Venue accents use `venueKey`. Their small display registry lives beside the
rendering helpers in `js/utils.js`; unregistered venues simply render without a
special accent.

Run `npm run build` or `npm run check` after editing content. Both commands build
the complete static site and verify its rendered local references.
