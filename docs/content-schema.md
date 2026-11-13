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

## Project pages

A publication with `projectUrl` has a same-tab title link and a project page.
Keep its page content in the same `contents/publications.js` entry:

```js
projectUrl: "dodgeui.html",
project: {
  name: "DodgeUI", // Short name for the browser title and social metadata.
  description: "A short plain-text page description.",
  abstract: "The verified paper abstract, as plain text.",
  abstractVerifiedOn: "2026-10-20",
},
```

The page reuses the entry's title, authors, venue, resource links, DOI, and
`preview: { src, alt, fit }`. Do not copy these values into page HTML.
`abstractVerifiedOn` records the original verification date; moving content does
not constitute a new verification. The generated HTML preserves the DOI and
verification date in a comment beside the abstract.

`templates/project.html` owns the shared project structure, metadata tags, figure
markup, and site-shell slots. `build/project-pages.js` validates project data and
fills this template; the shared site shell supplies navigation, theme controls,
and the footer afterward. The existing root HTML files are entry markers;
Vite replaces them with the populated template before processing assets. To add
a project, add its publication fields and a root HTML entry file named by
`projectUrl`. Build inputs and output checks derive project pages from that field.
Project URLs are root-level `.html` filenames. Project content, DOI, and preview
image are required; the build rejects missing values or duplicate page entries.

### Project-specific details

The shared template is the page shell, not a fixed outline for every project.
Keep the opening title, resources, abstract, and preview figure shared. Add optional
`project.detailsHtml` for the project's own sections after that opening. Omit it
for a short page; no empty details container is rendered.

For a longer project, put the authored HTML in its own content module, such as
`contents/dodgeui-details.js`, exporting a string. Import that string in
`contents/publications.js` and assign it to `project.detailsHtml`. Each project
can have a different number and order of sections, figures, lists, or videos.
For example, the details module could contain:

```js
export default `
  <section aria-labelledby="project-method">
    <h2 id="project-method" class="type-title-section">Method</h2>
    <p>Describe this project's method here.</p>
  </section>
  <section aria-labelledby="project-results">
    <h2 id="project-results" class="type-title-section">Results</h2>
    <p>Report the evidence and its limitations here.</p>
  </section>
`;
```

The shared `.project-details` container provides reading width, body typography,
section spacing, and responsive images/video. Use existing semantic classes for
headings and links. Use unique heading IDs, descriptive image alt text, and
public-relative asset paths. Details HTML is trusted repository-authored markup;
do not insert untrusted HTML. Metadata and abstract text remain escaped.

A project-specific diagram or interaction can use its own semantic class and
module inside this slot. Add such behavior only when the actual content needs it.
Keep styles in `css/styles.css` and reuse its tokens. Do not copy the whole page
template or add a layout registry for hypothetical future variants. Keep
`.project-title` and `#project-image` in the shared opening so navigation retains
its stable targets. If a real project later needs a different opening, make that
specific change then instead of forcing every page into a new abstraction.

During development, editing the shared template reloads open pages. Imported
content modules remain dependencies of the Vite configuration and trigger its
normal restart/reload behavior.

### Navigation behavior

A ready preview can become the shared image during navigation. Clicking starts
navigation immediately. Cold images, unavailable placements, keyboard, touch,
and reduced motion use ordinary navigation. Native cross-document transitions
have a compatibility animation when unavailable or unsuccessful.

Home returns to the saved homepage scroll position. Direct visits without saved
context return to the matching paper title. The return transition connects the
project heading to that title. Compatibility title layers crossfade while moving,
and page content fades in concurrently. This path allows homepage layout to
settle for two animation frames; it does not wait for document-wide font loading.
A failed native return keeps the destination visible instead of replaying its fade.
Later returns in that tab use the compatibility path. Reduced motion skips the
animation while preserving scroll restoration and cleanup. Without storage,
the ordinary Home link remains available.

Returned previews and title hover emphasis remain suppressed until pointer
movement or keyboard navigation. CSS owns animation durations and curves;
`js/project-transition.js` reads the same values for compatibility animations.
Keep duration tokens in milliseconds. The implementation is the source of truth
for exact timing; this guide does not duplicate a frame-by-frame timeline.

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
