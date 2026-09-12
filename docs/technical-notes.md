# Technical Notes

This document describes the stable architecture and build pipeline. Visual
implementation belongs in `css/styles.css`; design intent belongs in
`DESIGN.md`; content conventions belong in `docs/content-schema.md`.

## Architecture

The site is a Vite multi-page application with two production entry pages:

- `index.html`: homepage and selected research.
- `404.html`: not-found page.

`publications.html` remains a development-only archive shell; it is not built
or populated with publication content. Theme support includes this retained
page. Experimental pages are outside the theme bootstrap whitelist.

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

Content is therefore present in the deployed HTML before browser JavaScript
runs. Crawlers and readers do not need to fetch or interpret source content.
The content modules remain outside `public/` and are not deployed separately.

## Build and Verification

- `npm run dev` optimizes source images and starts Vite.
- `npm run build` optimizes images, builds all entry pages, and verifies the
  generated output.
- `npm run check` runs the lightweight theme state checks and then the complete
  production build. `npm run check:theme` runs those state checks separately.
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
  `localStorage["site-theme"]` stores the user's explicit `light` or `dark`
  choice. Missing, invalid, or legacy `system` values read the browser's
  preference on entry. There is no live system-theme listener or third mode
  in the UI. Other tabs synchronize through storage events; blocked storage
  does not prevent local changes. Without JavaScript the page stays light
  and the button stays hidden.
- `js/favicon.js` swaps active/idle favicon assets and follows the browser color
  scheme independently of the website appearance preference.
- `js/news-scroll.js` and `js/news-sticker.js` progressively enhance the news
  list. Theme changes do not replace images or reset the current news position.
- `js/404.js` provides the 404-page interaction.

GoatCounter is loaded asynchronously for visitor analytics. None of these
scripts is required for reading the page content.

## Theme Materials

Theme colors and material adjustments live in `css/styles.css`. The same
sticker files and paper colors are used in both themes; only CSS shadows
change. Contact SVGs inherit text color. The colophon remains the original
colored image: multiply on light paper and normal blending on the dark page.
It is not recolored or used as a mask.

The theme button uses Tabler Outline `sun` and `moon`, matching the existing
contact icons' 24px grid, 2px stroke, and rounded caps and joins. It shows the
destination theme: moon on a light page, sun on a dark page. The accessible
name and tooltip describe that action. The paths are inlined without a runtime
icon dependency; their MIT notice is in `public/files/icons/tabler-LICENSE.txt`.
Sources: https://github.com/tabler/tabler-icons/tree/main/icons/outline.

Hover changes only the icon color, without a background fill. Fine pointers
with hover support get a 0.97-scale press response (160ms in, 100ms out,
strong ease-out). Keyboard focus and reduced-motion preferences keep instant
feedback. The page colors and theme icon swap remain immediate.

Original venue and award colors remain source tokens. Dark venue text only
raises lightness while retaining hue and saturation. Award text reuses the
existing deep gold on light backgrounds and original gold on dark backgrounds;
resource-link text has a separate color role.

Education logos keep their original colors on hover. Only the resting
grayscale layer becomes pale in dark mode; no light backing or alternate
artwork is added. The original navy can consequently remain subdued on dark
backgrounds. Reduced-motion mode disables the logo crossfade.
