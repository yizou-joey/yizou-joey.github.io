# Design Conventions

- Theme tokens are defined in `css/styles.css` via `:root` CSS variables and semantic utility classes.
- Fonts: body/UI uses Inter (`font-inter`); serif brand/CJK uses Noto Serif SC (`font-serifSc`).
- Colors (CSS tokens): `ink #15120f`, `muted #787774`, `page-bg rgb(253, 253, 252)`, `paper #f7f4ef`, `line #f2f1ee`.
- Neutrals used directly: hero gradient `#f7f6f3` → `#e9e7e3` → `#d3d1cb`; date-chip bg `#f1f1ef`.
- Type sizes (reuse these): `12/14/16/18/20/24/28/30/36/40/48/64` (px), with body at `16` and `leading-relaxed`.
- Links are always underlined with subdued decoration: `underline-offset-2 decoration-muted/40 hover:decoration-ink/60`.
- Layout widths: header container `1440px`; content max `1000px`; default mobile padding `px-4`.
- Surfaces: page background is unified via `--color-page-bg`; separation comes from subtle borders and card surfaces.
- Radii are tokenized in `css/styles.css`: `--radius-card`, `--radius-chip`.
- Use utility classes `radius-card`, `radius-chip` instead of hardcoded `rounded-*` values.
- Chips: venue chip uses `venueColor` (fallback `#262189`) with light text; date chip reuses the publication chip tokens.
