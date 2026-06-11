# Design System

This site uses a warm paper editorial academic direction with sticker accents.
The design should feel like a precise research notebook: quiet typography,
clear chronology, thin rules, and small tactile conference marks.

## Visual Direction

- Keep the canvas warm and low contrast: `--color-page-bg`, `--color-ink`,
  `--color-muted`, `--color-border-warm`, and `--color-line` are the core
  surface tokens.
- Use color sparingly. Venue and award colors are semantic accents, not a
  general palette. Add new venue color through the venue registry and a CSS
  token, not per-entry inline color.
- Preserve the editorial rhythm: compact section labels, thin dividers, and
  single-column content rails.
- Stickers and halftone marks are the memorable visual layer. They should feel
  printed or placed on paper, with compact warm shadows and restrained hover
  lift.

## Typography

- UI labels and section headings use `--font-inter`.
- Names, biography, dates, list details, and publication text use
  `--font-serif-sc` to support the academic/editorial tone and Chinese text.
- Use `.type-title-section` for section labels. It is uppercase, small, and
  rule-backed through `.section-heading-row`.
- Use `.type-body-bio`, `.editorial-item-title`, `.editorial-item-subtitle`,
  and publication-specific classes instead of ad hoc text sizing.

## Layout

- The page has two rails:
  - `--width-rail-level-1`: section heading and broad page structure.
  - `--width-rail-level-2`: body content, publication lists, and visuals.
- Use `.page-gutter`, `.section-py`, `.section-stack`, `.section-rail-l1`, and
  `.section-rail-l2` before adding new spacing classes.
- List sections use the editorial grid:
  - date column
  - detail/content column
  - optional logo or mascot column
- Page-specific exceptions should become semantic classes, such as
  `.publications-page-heading` or `.publications-page-divider`, instead of
  inline styles.

## Components

- Header: sticky, warm paper background, uppercase nav labels, active nav in
  ink, inactive nav muted.
- Inline links: inherit text color, use subtle underline decoration, and keep
  focus rings in `--color-apple-blue`.
- Publications: eyebrow metadata, serif title/authors, bracket-style resource
  links. Venue color comes from `venueKey`.
- News/services stickers: use pre-generated transparent assets and the shared
  sticker shadow tokens. Link hover may trigger stronger paired sticker lift.
- Footer/colophon: remain visually quiet. The halftone mark should read as ink
  on paper rather than a floating illustration.

## Motion And Accessibility

- Motion should clarify ownership between a link and its related visual object.
- Use `prefers-reduced-motion: reduce` for transition timing while preserving
  visible hover/focus states.
- Every interactive element needs a visible focus state.
- Avoid layout-shifting hover states. Fixed image dimensions and grid columns
  should keep rows stable.

## Contract Rules

- Do not add inline `style` attributes in HTML.
- Do not generate inline style strings in JS for colors or spacing.
- Do not add hard-coded component colors when a CSS token already exists.
- Add new venue accents by updating the venue registry in `js/site-contracts.js`
  and matching CSS token/class rules in `css/styles.css`.
