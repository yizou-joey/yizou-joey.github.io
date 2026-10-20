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
    name: "Prof. Margaret Minsky",
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

Services keep `event` as the short conference link, for example
`**[ISMAR 2026](https://www.ieeeismar.net/2026/)**`. Optional plain-text
`eventFullName` and `eventEdition` (for example `25th`) provide the complete
conference identity in a right-hand note below an extended underline on link
hover or keyboard focus. The note does not reserve layout space. The edition
precedes the full name; omit it when unknown. Descriptions remain in static HTML
and are associated with the link for assistive technology. Touch devices and
viewports below 1024px hide the visual description, without adding a button or
changing the conference link. Without JavaScript, the short link and location
remain available and no visual note opens.

Publications can optionally include `preview: { src, alt }`. Use a public-relative
image path and a short description of the research scene. Previews appear on
paper hover or keyboard focus on an existing resource link, without adding images
or extra resource buttons to the static list. A subtle, line-wrapping title tint
identifies the paper whose image is displayed, with a tiny upward-right lift for
fine-pointer interaction only. The shared window crossfades images and moves for
250 ms between four positions adjacent to the active paper. Side positions take
priority; above/below positions prefer fewer overlaps with other paper titles,
resource links, and section headings. Its settled position avoids the entire active
entry, including resource links. Nonactive content may be partially covered, and
movement may briefly cross the new active entry. Keyboard and reduced-motion
interactions update position immediately, retaining source emphasis without lift.

The window uses `clamp(200px, 25vw, 320px)` width and an 8:5 aspect ratio, with no
size animation. Both figures share these dimensions. Below 480 px viewport width,
floating previews and their title emphasis are disabled for the entire list.
Otherwise the window must fit below the navigation and inside the viewport with
12 px horizontal margins. Each hovered or focused entry then needs a valid adjacent
position, separated from the complete entry by at least 12 px. If none fits, both
the preview and its title emphasis are hidden, including any previous entry's image.
Availability can differ between entries and scroll positions; a tall unrelated entry
does not disable other previews. Initialization, font loading, viewport resizing, and
observed layout size changes refresh the layout. Scrolling hides the preview; the
next pointer movement or new focus event checks placement again. Original resource
links and focus styles remain available; there is no additional touch interaction.
Entries without a preview remain plain text.

The DodgeUI prototype adds `projectUrl: "dodgeui.html"` to make its title a
normal same-tab link. On supported desktop browsers, clicking a ready preview
uses a native cross-document view transition to the same-size project figure.
Browsers without native navigation events, or whose native transition fails or
is cancelled, use a 300 ms arrival animation from the saved preview position.
The retained image appears before destination layout is ready; page content
fades in over 200 ms. Critical opt-in and image styles load in the head before
the transition bootstrap. Transfer data is saved before navigation and
consumed in the destination head.
A fast click reveals a ready image for 110 ms before navigation; cold images,
unavailable placements, keyboard, touch and reduced motion use direct navigation.
The title keeps its gray highlight without an underline; pointer presses add
a slight downward compression and a darker highlight. The Home link returns
using the full paper title as the shared element (250 ms), with other content
fading. It restores the scroll position saved when the project link was clicked;
a direct visit without saved context positions the title below the site header.
A return without native event support uses a 200 ms page fade prepared before paint.
If a native return fails or is cancelled, the destination stays visible: it is
never hidden again to replay a fade. Later returns in that tab session select
the compatibility title animation before navigation and skip the outgoing native
capture. Two title layers retain the source and destination line wrapping and
move on the same 250 ms timeline with uniform scaling. The old title fades out
in the first 100 ms, and the new title fades in over the next 100 ms. Homepage
content appears only after movement ends, over a final 100 ms (350 ms total).
The real title stays hidden until the matching destination layer is removed.
The native path uses the same fade sequence.
Scroll restoration runs once before movement, after fonts and homepage layout
settle on the compatibility path. Return navigation omits the fragment to avoid
the browser's competing anchor scroll, then restores it with `replaceState`.
Title snapshots retain their proportions and align top-left.
Reduced motion skips the
movement. Returned previews and hover highlights stay hidden until deliberate
pointer movement or keyboard navigation. Return navigation does not depend on
browser history; storage-unavailable visits retain the ordinary Home link.

Keep source images in `assets/original-images/files/projects/` and add their
optimized outputs to `scripts/optimize-images.mjs`. Images use bottom-centered
cover framing without stretching. Keep the subject in that crop. Set
`preview.fit: "contain"` for diagrams or multi-panel figures that must remain fully
visible; the outer window keeps the same dimensions.

Local assets use public-relative paths such as
`files/materials/paper.pdf`. A production build fails if a rendered local
reference is missing.

Venue accents use `venueKey`. Their small display registry lives beside the
rendering helpers in `js/utils.js`; unregistered venues simply render without a
special accent.

Run `npm run build` or `npm run check` after editing content. Both commands build
the complete static site and verify its rendered local references.
