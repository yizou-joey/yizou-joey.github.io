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

Publications can optionally include `preview: { src, alt }`. Use a public-relative
image path and a short description of the research scene. Previews appear on
paper hover or keyboard focus on an existing resource link, without adding images
or extra resource buttons to the static list. A subtle, line-wrapping title tint
identifies the paper whose image is displayed, with a tiny upward-right lift for
fine-pointer interaction only. The shared window crossfades images and follows
the active paper vertically within one safe side lane; the entire movement path
avoids publication text. Where a side lane does not fit, it keeps a safe fixed
position or stays hidden. Keyboard interactions are immediate; reduced motion
keeps the window stationary. Original resource links remain available on touch
devices and without JavaScript. Entries without a preview remain plain text. Keep source images in
`assets/original-images/files/projects/` and add their optimized outputs to
`scripts/optimize-images.mjs`. Images fill the shared 320 × 200 px window using
bottom-centered cover framing, without stretching. Keep the subject in that crop.
Set `preview.fit: "contain"` for diagrams or multi-panel figures that must remain
fully visible; the outer window keeps the same dimensions.

Local assets use public-relative paths such as
`files/materials/paper.pdf`. A production build fails if a rendered local
reference is missing.

Venue accents use `venueKey`. Their small display registry lives beside the
rendering helpers in `js/utils.js`; unregistered venues simply render without a
special accent.

Run `npm run build` or `npm run check` after editing content. Both commands build
the complete static site and verify its rendered local references.
