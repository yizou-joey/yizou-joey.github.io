# Technical Notes

This document describes the stable architecture and build pipeline. Visual
implementation belongs in `css/styles.css`; the shared design guide belongs in
`DESIGN.md`; content conventions belong in `docs/content-schema.md`.

## Architecture

The site is a Vite multi-page application with these production entry pages:

- `index.html`: homepage and selected research.
- `404.html`: not-found page.
- `design.html`: design guide and live specimens, not linked from navigation.
- `design-color.html`: the Colour page of the design guide, with live token values and copyable names.
- Project URLs declared in `contents/publications.js`: currently `dodgeui.html`
  and `contextual-recovery.html`, rendered from `templates/project.html`.

`publications.html` remains a development-only archive shell; it is not built
or populated with publication content. `cv.html` is also a development-only
archive: it renders the Education section moved off the homepage, using
`contents/education.js`. Neither archive is linked from the production navigation.
Theme support includes both retained pages. Experimental pages are outside the
theme bootstrap whitelist.

Section content is stored in single-purpose ES modules under `contents/*.js`.
Shared renderers in `js/renderers.js` and formatting helpers in `js/utils.js`
turn those values into HTML. The content modules have no runtime schema or
field whitelist; renderers consume the fields they recognize.

`src/styles.css` is the Vite stylesheet entry. It loads Tailwind and then the
shared visual implementation in `css/styles.css`.

## Static Content Pipeline

The source HTML files contain lightweight target containers. The custom Vite
HTML transform imports content modules, renders each section, injects the
result, and marks the target with `data-content-rendered="static"`.

`build/project-pages.js` selects project entries, validates their unique root-level
URLs and required metadata, and fills `templates/project.html`, including the
optional details and video slots. `build/static-content.js` provides the container
injection helper shared by homepage, project, and retained CV rendering. The Vite
configuration coordinates these renderers, the shared shell, and script injection;
it also uses the exported project template path for development reloads.

Content is therefore present in the deployed HTML before browser JavaScript
runs. Crawlers and readers do not need to fetch or interpret source content.
The content modules remain outside `public/` and are not deployed separately.

`design.html` is the independently authored visual atlas. Its academic examples
use the same content and renderers as the homepage. `DESIGN.md` is the companion
implementation guide, emitted as `/DESIGN.md` for download; development serves
it directly and reloads pages when it changes. CSS remains the implementation
source of truth.

## Shared Site Shell

Production pages use `<!-- site:bootstrap -->`, `<!-- site:head -->`,
`<!-- site:header -->`, and `<!-- site:footer -->` slots. The Vite transform
expands project content first, then calls `build/site-shell.js` to fill each
slot, and finally inlines the theme and transition scripts. Missing or duplicate
slots fail the build. The retained Publications and CV archives keep their
existing markup and are outside this shared shell.

Edit `templates/site-header.html` for navigation and the theme button,
`templates/site-footer.html` for the footer, and `templates/site-head.html`
for favicon and shared resource links. Site labels, copyright, the explicit
content update date, and page-type options live in `build/site-shell.js`.
Template data is escaped; only markup authored by that module is inserted raw.
Shared template edits trigger a full page reload during development.

The homepage marks Home as current. Project, document and error pages link to Home.
Home and error footers include the illustration; project and document footers use the
text-only class. Slots stay in their original layout parents, including the
404 screen-height stack. The error page retains its smaller font request;
only project pages preconnect to YouTube. Page metadata, analytics, transition
hints, and page-specific scripts remain in their original page templates.
The bootstrap stays before stylesheets to preserve initial theme selection.

## Build and Verification

Responsive design and viewport verification rules are in [DESIGN.md](../DESIGN.md).

- `npm run dev` optimizes source images and starts Vite.
- `npm run build` optimizes images, builds all entry pages, and verifies the
  generated output.
- `npm run check` runs theme, interaction, project-page, and shared-shell checks,
  then the complete production build. `npm run check:theme` runs theme state
  checks separately. `scripts/check-site-shell.mjs` checks shared structure,
  page variants, resource scope, footer ancestry, and required slots.
- `npm run check:dist` verifies expected pages, static injection markers,
  rendered local HTML/CSS references, and the synchronous theme bootstrap and
  toggle in each production page.
- `npm run preview` rebuilds before serving `dist/`.

Build output is written to ignored `dist/`. The deployment workflow runs the
same production build used locally.

## Assets

Deployable files live under `public/files/` and use public-relative references
such as `files/materials/paper.pdf`. Editable image sources live under
`assets/original-images/`.

`scripts/optimize-images.mjs` generates web-ready variants under the ignored
`public/files/generated/` directory before development and production builds.
The distribution check catches rendered references whose target files are
missing from the final output.

## Browser Runtime

Content rendering has no browser-side runtime. The remaining JavaScript is for
small presentation behavior:

- `js/theme.js` is a classic script inlined by the Vite HTML transform after
  charset/viewport and before stylesheets. It sets `html[data-theme]` before
  the first paint, then binds a native icon button at DOM ready.
  `localStorage["site-theme"]` stores `{ theme, expiresAt }` for the user's
  explicit `light` or `dark` choice, valid for two hours after the last manual
  toggle. Navigation and reloads do not extend the expiry. Missing, expired,
  invalid, or legacy plain-string values read the browser's preference on entry.
  Expiry is checked on page initialization and incoming storage events; an open
  page does not change merely because two hours pass. There is no live
  system-theme listener or third mode in the UI. Other tabs synchronize through
  storage events; blocked storage
  does not prevent local changes. Without JavaScript the page stays light
  and the button stays hidden.
- `js/favicon.js` swaps active/idle favicon assets and follows the browser color
  scheme independently of the website appearance preference.
- `js/news-scroll.js` and `js/news-sticker.js` progressively enhance the news
  list. Theme changes do not replace images or reset the current news position.
- `js/404.js` provides the 404-page interaction.

GoatCounter is loaded asynchronously for visitor analytics. None of these
scripts is required for reading the page content.

## Navigation transitions

Same-site navigation between published pages uses a 200ms root fade. The site
shell injects `js/project-transition.js` and its critical opt-in CSS into every
published page, so native `@view-transition` applies to all of them. Without
cross-document view transitions, a click on a same-origin link schedules a
`navigation-veil` state on the outgoing page: after 150ms a fixed `::after`
layer filled with `--color-page-bg` fades in. Fast navigations finish before
that and never flash it. After 1s the layer fades out and `navigation-progress`
draws a 2px ink hairline, so a slow load keeps the old page visible instead of
a blank surface. The next page starts covered and fades the layer out after its
first frames. The stored handoff and all timers stop after 10 seconds, and a
restored page from the back-forward cache clears the state. Reduced motion
never adds either layer.

Same-site published pages are listed in a `speculationrules` prerender
(`eagerness: "moderate"`) in the shared head, so supporting browsers usually
start the next page on hover. Design guide pages mark `#design-content` with
`<link rel="expect">` and `blocking="render"`, so native transitions capture
rendered content rather than a blank page. The `@view-transition` opt-in is
disabled under reduced motion.

## Theme implementation

The theme button uses Tabler Outline `sun` and `moon`, matching the existing
contact icons' 24px grid, 2px stroke, and rounded caps and joins. It shows the
destination theme: moon on a light page, sun on a dark page. The accessible
name and tooltip describe that action. The paths are inlined without a runtime
icon dependency; their MIT notice is in `public/files/icons/tabler-LICENSE.txt`.
Sources: https://github.com/tabler/tabler-icons/tree/main/icons/outline.

Hover changes only the icon color, without a background fill. Fine pointers
with hover support get a 0.97-scale press response (160ms in, 100ms out,
strong ease-out). Keyboard focus and reduced-motion preferences keep instant
feedback. On a pointer click, browsers with the View Transition API crossfade
the whole page to the new theme over 280ms, without a directional wipe. Matching
cubic segments derived from the Tabler circle and crescent interpolate over
240ms, while the sun rays contract/expand over 180ms and fade over 120ms.
A named button's live snapshot shows this SVG morph independently of the page
crossfade. Browsers without CSS path interpolation use the original icons with a
160ms fade/scale fallback. Only the 20px path repaints during interpolation;
no SVG runtime or animation library is used. Text and
artwork stay sharp and stationary; neither content nor assets are duplicated in
the DOM. The temporary `data-theme-transition` attribute scopes this motion.

Initial paint, storage synchronization, keyboard activation, reduced motion,
and unsupported browsers switch immediately. A second click during capture or
playback skips the transition and applies the latest preference. Deferred
capture callbacks read the current preference so they cannot restore stale
state. While captured elements are excluded from native hit testing, clicks
within the visible button's bounds route to the same toggle handler. Snapshot
failures fall back to the normal theme update.

Education logos keep their original colors on hover. Only the resting
grayscale layer becomes pale in dark mode; no light backing or alternate
artwork is added. The original navy can consequently remain subdued on dark
backgrounds. Reduced-motion mode disables the logo crossfade.
