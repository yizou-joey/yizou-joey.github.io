---
name: Yi ZOU Academic Homepage
version: 1.0
purpose: AI coding agent steering for UI, content presentation, and visual consistency.
domain: personal academic homepage
visual_dna: Warm paper editorial academic homepage with quiet academic typography, thin archival rules, sparse semantic accents, and tactile sticker-on-paper marks.
audience:
  - HCI and XR researchers
  - academic collaborators
  - students
  - conference reviewers and visitors
tone:
  - calm
  - precise
  - scholarly
  - personal
  - lightly tactile
surfaces:
  page:
    token: --color-page-bg
    value: "#fdfdfc"
    role: continuous warm paper canvas
  ink:
    token: --color-ink
    value: "#15120f"
    role: primary reading text and active navigation
  muted:
    token: --color-muted
    value: "#787774"
    role: secondary text, inactive dates, captions, quiet metadata
  hairline:
    token: --color-border-warm
    value: "#dfdcd4"
    role: editorial section rules and publication dividers
  line:
    token: --color-line
    value: "#f2f1ee"
    role: very quiet page chrome and footer/header dividers
colors:
  focus_blue:
    token: --color-apple-blue
    value: "#0071e3"
    permission: focus rings and clear interactive affordances only
  ieee_vr:
    token: --color-venue-ieee-vr
    value: "#262189"
    permission: IEEE VR venue identity through venueKey-backed classes
  mmsys:
    token: --color-venue-mmsys
    value: "rgb(24, 86, 105)"
    permission: MMSys venue identity through venueKey-backed classes
  award_gold:
    token: --color-award
    value: "#F2A900"
    permission: awards, recognitions, and status emphasis
  resource_gold:
    token: --color-gold-dark
    value: "#92400e"
    permission: publication resource links and bracket-style actions
typography:
  ui:
    token: --font-inter
    stack: '"Inter", sans-serif'
    role: navigation, labels, section headings, resource links, metadata chrome
  editorial:
    token: --font-serif-sc
    stack: '"Noto Serif SC", serif'
    role: name, biography, dates, publication titles, authors, academic body text, Chinese text
  hero:
    size: 48px
    line_height: 49px
    weight: 400
    tracking: -1.92px
  section_label:
    size: 14px
    weight: 500
    tracking: 0.1em
    transform: uppercase
  body:
    size: 16px
    line_height: 24px
    weight: 400
  bio:
    size: 18px
    line_height: 29px
    weight: 400
layout:
  rail_level_1:
    token: --width-rail-level-1
    value: 1050px
    role: broad page structure and section headings
  rail_level_2:
    token: --width-rail-level-2
    value: 950px
    role: body content, publication lists, and visual objects
  gutter:
    token: --space-gutter-fluid
    value: clamp(16px, 3vw, 32px)
  editorial_grid:
    mobile: single column
    desktop: 140px date column, flexible detail column, optional logo or mascot column
  section_rhythm:
    page_start: --space-page-start
    between_sections: --space-section-between
    heading_to_content: --space-section-heading-content
    list_item: --space-list-item
spacing:
  primitives:
    space_2: 2px
    space_4: 4px
    space_6: 6px
    space_8: 8px
    space_10: 10px
    space_12: 12px
    space_16: 16px
    space_20: 20px
    space_24: 24px
    space_28: 28px
    space_32: 32px
    space_48: 48px
radii:
  badge:
    token: --radius-badge
    value: 999px
    role: pill-shaped navigation hit areas
shadows:
  sticker_base:
    token: --sticker-shadow-base
    role: compact printed sticker shadow on paper
  sticker_hover:
    token: --sticker-shadow-hover
    role: restrained hover lift for sticker objects
  sticker_venue_hover:
    token: --sticker-shadow-venue-hover
    role: stronger linked-object lift when related text is hovered
motion:
  default_duration: 160ms to 300ms for interaction, 700ms for halftone reveal
  easing: cubic-bezier(0.16, 1, 0.3, 1) for sticker lift
  reduced_motion: preserve visible state changes; remove nonessential transitions
signature_components:
  - academic-sticky-header
  - dynamic-favicon-microinteraction
  - profile-intro-block
  - bio-keyword-sticker-stage
  - editorial-grid-row
  - publication-item
  - publication-bracket-links
  - venue-award-tokens
  - mascot-service-stickers
  - halftone-colophon
source_references:
  - css/styles.css
  - js/favicon.js
  - index.html
  - publications.html
  - docs/content-schema.md
---

# DESIGN.md

## Overview

This file is the design steering document for Yi ZOU's academic homepage. It is
written for AI coding agents and future maintainers who need to extend the site
without diluting its existing visual language.

The site is not a SaaS marketing page, a startup landing page, or a generic
portfolio template. It is a quiet academic homepage with the texture of a
research notebook: warm paper, restrained ink, precise chronology, publication
archive structure, and small tactile marks that carry provenance.

Use this file as the primary design context before changing UI, layout,
interaction, or content presentation. `css/styles.css` is the implementation
source for tokens and component classes, while this file is the canonical design
steering contract.

## Visual DNA

Warm paper editorial academic homepage with quiet academic typography, thin
archival rules, sparse semantic accents, and tactile sticker-on-paper marks.

The design should feel like an academic paper, a lab notebook, and a personal
research archive at the same time. The page is mostly continuous paper surface;
visual hierarchy comes from typography, chronology, thin rules, and semantic
marks rather than from heavy cards or decorative sections.

The closest getdesign.md-style analogs are editorial and warm-minimal systems:
Notion-like softness, Claude-like editorial calm, and WIRED-like print logic,
but adapted to a personal HCI/XR research homepage. Do not import any single
brand's style wholesale.

## Colors

The color system is intentionally narrow. The core page is built from warm paper,
near-black ink, muted gray-brown metadata, and hairline rules.

- `--color-page-bg` (`#fdfdfc`) is the continuous page canvas. It should read as
  warm paper, not sterile white and not beige decoration.
- `--color-ink` (`#15120f`) is the primary text color and the active navigation
  color. Use it for content that needs to feel authored and final.
- `--color-muted` (`#787774`) is for secondary information: inactive dates,
  captions, subtitles, and quiet supporting text.
- `--color-border-warm` (`#dfdcd4`) is the editorial rule color for section
  dividers and publication list boundaries.
- `--color-line` (`#f2f1ee`) is the quietest chrome: header lines, footer lines,
  and low-emphasis separators.

Accent colors have permissions, not just values:

- `--color-apple-blue` (`#0071e3`) is reserved for focus rings and clear
  interactive affordances. Do not use it as a decorative brand wash.
- Venue colors belong to venue identity only. They must come through
  `venueKey`, `js/site-contracts.js`, and matching CSS token/class rules.
- `--color-award` (`#F2A900`) is for awards and recognitions.
- `--color-gold-dark` (`#92400e`) is for publication resource links and
  bracket-style links.

Avoid adding a general-purpose accent palette. Color should clarify provenance,
status, or interaction.

## Typography

Typography carries most of the brand.

- Use `Inter` for UI chrome: navigation, labels, section headings, resource
  actions, and compact metadata.
- Use `Noto Serif SC` for the academic voice: the name, biography, dates,
  publication titles, authors, list details, and Chinese text.
- Keep section headings compact, uppercase, and rule-backed through
  `.type-title-section` and `.section-heading-row`.
- Use existing type classes before adding new sizes. Prefer `.type-body-bio`,
  `.editorial-item-title`, `.editorial-item-subtitle`,
  `.publication-title-serif`, and `.publication-authors-serif`.

The hero name uses a serif display scale with light weight and tight tracking.
Do not make the name heavy, glossy, or oversized like a product-launch hero.

## Layout

The site uses a two-rail editorial layout:

- Level 1 rail (`--width-rail-level-1`, 1050px) defines broad page structure and
  section heading width.
- Level 2 rail (`--width-rail-level-2`, 950px) contains body content,
  publication lists, and visual details.

Use `.page-gutter`, `.section-py`, `.section-stack`, `.section-rail-l1`, and
`.section-rail-l2` before introducing new layout primitives.

List sections use an editorial grid:

- a date or period column,
- a flexible detail/content column,
- an optional logo, mascot, or sticker column.

On mobile, preserve reading order and avoid cramped side-by-side composition.
On desktop, let chronology and details align cleanly across rows.

Page-specific exceptions should become semantic classes such as
 `.publications-page-heading` or `.publications-page-divider`, not inline styles.

## Spacing

Spacing uses a small primitive scale from `--space-2` through `--space-48`.
Repeated component gaps, margins, and padding must consume these primitives or
a semantic composite token such as `--space-list-item`; do not repeat the
equivalent pixel values in component rules.

Keep typography measurements, media dimensions, border thicknesses, shadow
geometry, transform offsets, and responsive breakpoints outside the spacing
scale. A unique optical adjustment may remain local when turning it into a
reusable token would imply a false design relationship.

## Surface & Hierarchy

The hierarchy pattern is:

1. Warm continuous paper canvas.
2. Thin editorial rules.
3. Chronological rows and publication groups.
4. Semantic resource chips, venue accents, and award markers.
5. Small tactile sticker or halftone marks.

Avoid boxed page sections and nested cards. The site should feel like an archive
or printed specimen, not a dashboard. Depth comes from tonal restraint,
hairlines, typography, and sticker materiality.

## Elevation & Depth

Use depth sparingly.

- Standard content and publication rows are flat.
- Section boundaries use hairline borders, not shadows.
- Stickers use compact drop-shadow stacks to feel placed on paper.
- The halftone colophon is flat ink-on-paper with `mix-blend-mode: multiply`,
  not a floating illustration.

Do not introduce material-style card shadows, glassmorphism, blurred gradient
orbs, or large ambient glow.

## Shapes

Shapes are restrained and semantic.

- Publication resource links should stay text-first and bibliographic rather
  than becoming button-like chips.
- Header navigation links use pill hit areas through `--radius-badge: 999px`,
  but the visual treatment remains quiet.
- Focus rings may use small radii only to keep outlines legible.
- Stickers may have irregular silhouettes because the asset itself carries the
  paper-cut material.

Do not make the interface uniformly rounded. Rounded rectangles should not
become the default visual language.

## Components

### Academic Sticky Header

Warm paper background, tiny serif brand mark, uppercase Inter navigation, muted
inactive links, ink active link, and a quiet bottom rule. Keep the header
compact and stable.

### Profile Intro Block

The profile image, contact rows, name, and biography form the personal entry
point. Keep it centered and calm on small screens, then left-readable on desktop.
The intro is not a marketing hero.

### Bio Keyword Sticker Stage

Research interest stickers are pre-generated image assets with compact paper
shadows. They should feel placed into the bio area, not like generic badges.
Use fixed dimensions and avoid layout shift on hover.

### Editorial Grid Row

The core list pattern for news, education, services, and teaching. It combines
chronology, detail text, and optional visual marks. Preserve date alignment and
serif detail text.

### Publication Item

Publication entries use eyebrow metadata, serif title/authors, warm dividers,
and bracket-style resource links. Venue color comes from `venueKey`; never write
venue color directly in content.

### Publication Bracket Links

Resource links are italic serif text with bracket-like behavior and subtle
animated underline/arrow affordances. They should feel bibliographic, not like
CTA buttons.

### Venue And Award Tokens

Venue and award styling is semantic. Use venue colors to indicate source or
community, and award gold only for recognition. Do not use these colors as
general decorations elsewhere.

### Mascot And Service Stickers

Mascot stickers are linked visual anchors for specific news or service items.
Text hover may lift the related sticker to show ownership between content and
visual object. Preserve reduced-motion behavior.

### Halftone Colophon

The colophon is quiet ink at the end of the page. It should read as a printed
closing mark, never as a decorative logo centerpiece.

### Dynamic Favicon Microinteraction

The favicon is treated as a small browser-chrome microinteraction rather than
only a static logo slot. It may change state when the tab moves between active
and background contexts, echoing the site's research archive language through a
quiet open/closed object.

The current implementation uses Lucide `folder-open` for the visible tab and
Lucide `folder` for the hidden/idle tab. Both are intentionally line-only SVGs:
dark ink lines in light browser contexts and warm-paper lines in dark browser
contexts. Do not add a filled backplate by default; the current direction is a
lightweight icon that belongs to browser chrome rather than a sticker object.

Future icon explorations should preserve the same interaction model while
looking for a more representative mark for Yi's work in HCI, XR, and adaptive
interfaces. Good candidates include simplified reading glasses with open/folded
states, an XR view frame, or another research-object metaphor that remains
legible at 16px. Avoid intricate perspective, multiple nested symbols, text,
shadows, and details that disappear at favicon scale.

## Motion & Accessibility

Motion should clarify relationships between text and related visual objects.
Keep transitions short and physically restrained.

- Hover states must not shift layout.
- Every interactive element needs a visible `:focus-visible` state.
- Use `--color-apple-blue` for focus outlines.
- Respect `prefers-reduced-motion: reduce` by removing nonessential movement
  while preserving visible hover and focus states.
- Keep image dimensions, grid columns, and action chip sizes stable.
- Favicon state changes should be discrete swaps, not continuous animation.
  They must remain decorative and never carry information unavailable elsewhere.

## Do's and Don'ts

Do:

- Use the warm paper canvas as the default page surface.
- Preserve the editorial rhythm: compact section labels, thin rules, generous
  blank space, and chronological rows.
- Use serif typography for academic narrative and publication detail.
- Use Inter for compact UI labels and navigation.
- Connect venue color to `venueKey` and the venue registry.
- Treat stickers and halftone marks as a material system.
- Prefer semantic classes and existing layout rails.

Don't:

- Do not turn the homepage into a SaaS landing page.
- Do not add generic AI gradients, neural-network visuals, glass panels, or
  decorative glow.
- Do not introduce heavy cards or nested card layouts.
- Do not use cyan/blue as a large decorative fill.
- Do not use venue or award colors outside their semantic roles.
- Do not use large poster-like illustrations on editorial listing pages.
- Do not replace publication archive structure with marketing feature blocks.
- Do not add inline `style` attributes in HTML.
- Do not generate inline style strings in JS for colors or spacing.

## Implementation Contract

All UI work must prefer existing CSS tokens, semantic classes, and content
contracts before adding new primitives.

- Colors and spacing should reference CSS custom properties when a matching
  token exists.
- New venue accents must be added through `js/site-contracts.js` and matching
  CSS token/class rules in `css/styles.css`.
- New content components should reuse the rail, section, editorial row,
  publication, and bracket resource-link vocabulary where possible.
- Page-specific layout differences should be named as semantic classes, not
  embedded as inline styles.
- Static content fields must follow `docs/content-schema.md`.
- If a new visual asset is needed, it should support the paper/editorial
  material system and remain secondary to text.

When in doubt, choose less spectacle: quieter typography, fewer colors, thinner
rules, and clearer academic structure.
