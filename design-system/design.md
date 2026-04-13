# Design System of Yi ZOU Website

## 0. Current Refactor Scope

This phase only defines and sharpens the design language system. We are not yet applying these rules to every page/component.

### In Scope (Now)
- Establish a complete, explicit language in this folder (`design-system/`) with aligned markdown + visual reference page.
- Refine subsystem-level guidance for:
  - Foundation tokens
  - Publication ticket
  - Education timeline
  - Chip language
- Resolve cross references so design assets can evolve independently from page implementation files.

### Out of Scope (Later Phase)
- Full-site implementation sweep for all existing pages.
- Structural content rewrites beyond design-system artifacts.
- New feature work unrelated to design-language unification.

## 1. Visual Theme & Atmosphere

This design language blends Apple-style restraint with Notion-like editorial warmth. The interface is intentionally quiet: soft paper-like backgrounds, minimal chrome, and carefully tokenized typography that keeps attention on research content instead of ornamental UI.

The visual character is academic and calm. Cards are lightly bordered rather than heavily elevated. Motion is subtle. Color is mostly neutral, with disciplined accents: deep UST blue for semantic emphasis and contextual brand hues (for publication venues) where useful.

This is not a dark cinematic product theater. It is a readable, warm, structured research portfolio optimized for scanning publication metadata, timeline history, and profile context.

**Key Characteristics:**
- Warm neutral canvas (`#fdfdfc`) with low-contrast separators (`#f2f1ee`)
- Content-first layout with stable width rhythm (`--width-rail-level-1: 1050px`, `--width-rail-level-2: 950px`)
- Semantic typography utilities with fixed, literal type tokens
- Mixed type personality: `Inter` for UI clarity, `Noto Serif SC` for identity and hero voice
- Subtle surfaces and whisper borders over heavy shadow stacks
- Chip-driven metadata system for publications/news/status
- Pill controls used selectively for non-primary navigation; explicit actions use button geometry instead of badge geometry

## 2. Color Palette & Roles

### Primary
- **Ink** (`#15120f`): Primary text, major labels, strong actions.
- **Page Background** (`#fdfdfc`): Global canvas.

### Iconic Ascent
- **UST Blue** (`#003366`): Academic emphasis, timeline/divider semantics.
- **Apple Blue** (`#0071e3`): Focus and primary-action color available for interactive moments.

### Interface Foundations
- **Paper** (`#f7f4ef`): Light supportive surface and light-on-dark chip text.
- **Muted** (`#787774`): Secondary text.
- **Light Gray** (`#f5f5f7`): Alternate preview sections and subtle palette outlines.
- **Selection Highlight** (`#fef08a`): Browser text-selection background, paired with Ink text for legible temporary emphasis.
- **Award Accent** (`#efbf04`): Highlighted award/status signal.
- **Gold Tint** (`#FEF3C7`): Notion-style status chip background (warm amber-cream).
- **Gold Dark** (`#92400E`): Notion-style status chip text, pairs with Gold Tint.
- **Gold Vivid** (`#FDE68A`): Award (vivid gold) status chip background (bright yellow-gold).
- **Gold Text Deep** (`#78350F`): Award (vivid gold) status chip text, ~7.3:1 contrast on Gold Vivid.
- **Line** (`#f2f1ee`): Dividers, card borders, section separators.

### Secondary System Tones
- **UST Blue Soft** (`rgba(0, 51, 102, 0.28)`): Connector line and low-emphasis blue guides.
- **White** (`#ffffff`): Card and contained surface start tone.
- **Warm Card** (`#fcfcfb`): Publication ticket and preview card end tone.
- **Warm Card Soft** (`#fbfaf8`): Lightweight subsystem-card end tone.

### Publication System
- **Publication Rail BG** (`#f8f7f3`): Right stub area in ticket layout.
- **Publication Rail Border** (`#e7e5dd`): Dashed separator line.
- **Chip BG** (`#f7f5ef`), **Chip Border** (`#dfdcd4`)
- **IEEE VR Blue** (`#262189`): Current publication venue swatch and venue chip.
- **Venue colors**: Add new venue tokens as needed and bind them through `data-venue` selectors rather than venue-specific component markup.

### Component Neutrals
- **Publication Body Text** (`#141414`): Author lines and metadata body.
- **Chip Text** (`#2c2b29`) and **Chip Text Muted** (`#3c3c3c`): Compact label text tones.
- **404 Display Tone** (`#2b2825`): Hero numeral tone.

### Inspiration Additions (Notion / Linear)
- Keep Notion-like warm neutrals as first-class surfaces.
- For future dark variant exploration, borrow Linear-style luminance layering (e.g., `#08090a`, `#0f1011`, translucent borders), but keep current light mode as primary.

## 3. Typography Rules

### Font Family
- **UI / Body**: `Inter`, sans-serif
- **Brand / Hero Serif**: `Noto Serif SC`, serif

### Special Exception (Preserved)
- `Display Hero` (`.type-title-hero`) and `Display Secondary` (`.type-title-hero-sub`) remain as the two serif identity levels.
- They are intentionally outside the fixed Inter reading hierarchy, and are reserved for hero/identity moments only.

### Hierarchy (Current Tokens)

| Role | Class | Size | Weight | Line-height | Tracking | Family |
|------|-------|------|--------|-------------|----------|--------|
| Section Heading | `.type-section-heading` | 48px | 700 | 1.00 | -1.5px | Inter |
| Sub-heading Large | `.type-subheading-large` | 40px | 700 | 1.50 | normal | Inter |
| Sub-heading | `.type-subheading` | 32px | 600 | 1.06 | normal | Inter |
| Sub-heading Serif | `.type-subheading-serif` | 26px | 400 | 1.23 | normal | Noto Serif SC |
| Body Large | `.type-body-large` | 20px | 600 | 1.40 | -0.125px | Inter |
| Body Medium | `.type-body-medium` | 16px | 500 | 1.50 | normal | Inter |
| Body | `.type-body` | 16px | 400 | 1.50 | normal | Inter |
| Bio Body | `.type-body-bio` | 18px | 400 | 1.61 | normal | Inter |
| Nav / Button Label | `.type-nav-label` | 15px | 400 | 1.33 | normal | Inter |
| Caption | `.type-caption` | 14px | 400 | 1.43 | normal | Inter / Muted `#787774` |
| Badge / Micro Label | `.type-badge-micro` | 12px | 600 | 1.33 | 0.125px | Inter |

### Principles
- Type hierarchy follows fixed, Notion-like tiers for clarity and consistency.
- Sub-heading family (`Large` / `Sans` / `Serif`) uses unified tracking (`normal`) for consistent rhythm across section-level titles.
- Body family is split by purpose: `Body Large` for lead, `Body Medium` for emphasized utility text, `Body` for standard reading, `Bio Body` for the About intro paragraph.
- Publication ticket titles use `Body Large` instead of a separate card-title tier.
- Typography notation in `design.html` is literal and maps 1:1 to CSS class values in `design-spec.css`.
- Font feature settings are unified across all levels via `font-feature-settings: "kern" 1, "liga" 1, "clig" 1`.
- Caption text defaults to `--color-muted` so metadata reads as secondary information without requiring an extra utility class.
- `.type-body-sm` remains available in the preview as a helper alias of `Caption`; it is not a separate semantic text tier for production migration.
- Do not introduce a global type multiplier; each visible type role should stay directly inspectable.

### Text Links & Formatting
- `<a/>` tags globally inherit their parent element's text color and text decoration. This nullifies the browser-default `:visited` purple formatting.
- For standard inline text links, rely on inherited colors and apply utility classes like `.underline` paired with `.decoration-muted/40` or `.hover:decoration-ink/60` to indicate interactivity without hardcoded structural colors.

## 4. Component Stylings

### Header Navigation
- Sticky header on page background (not translucent glass).
- Compact nav pills (`--radius-badge`) with color-state emphasis.
- Header rhythm uses a 40px inner rail (`.site-header-inner`) with a 20px brand mark (`.type-brand` + 20px brand box), and 30px nav links (28px on small screens).
- Desktop keeps the navigation on one restrained row; mobile switches the header rail itself to a vertical stack so the brand sits above a centered, wrapped nav row instead of sharing the same horizontal flex line.
- Header links include explicit `:focus-visible` ring treatment (Apple Blue outline) for keyboard navigation parity with action controls.
- Header section links use `aria-current="location"` to indicate the currently viewed section, synchronized as the user scrolls.
- In-page section anchors keep a scroll offset so sticky header does not cover target headings.
- Active page: ink text; inactive: muted gray.

### Publication Ticket Card (Signature Component)
- Two-zone structure on desktop: main content + right stub.
- Card shell: light gradient surface (`--color-white` to `--color-card-warm`), subtle border and soft shadow.
- Identity strip: prominent venue chip + quiet type chip series with optional type note/link + optional status chip.
- Right stub: supplement links as resource actions grouped by visual type: document (`Paper` / `PDF`), media (`Video` / `Demo`), arXiv, slides, poster, and code.

### Chips
- Unified badge geometry via `--radius-badge` and label token.
- Venue chip uses solid fill (venue color background) with light text (`--color-paper`) for high-emphasis source identity. Deep academic venue colors render better as solid fills; tinted approach would make navy/purple venues nearly invisible. Venue chip color is selected by `data-venue`, keeping markup stable as publication venues grow.
- Type chips such as Journal, Conference, Workshop, and Poster belong to the same quiet label series and must share `.publication-type-chip`.
- Workshop/type notes such as `NIDIT` live inside the type chip after `.publication-type-divider`; linked notes use `.publication-type-note-link` with a hover/focus-only `--radius-badge` peel background.
- Workshop/type-note buttons include an `:active` press state aligned with primary action-button logic: keep white text, darken the peel background to the primary active blue, and avoid adding extra hover-only variants.
- Workshop/type-note animation decision (2026-04-10): use center diffusion as the default behavior (`opacity 200ms ease` + `transform scale(0.8 -> 1)` with `transform-origin: center center`) to avoid left-to-right reveal mismatch and keep text/background timing visually synchronized.
- Status chip has three variants: (1) **outline** — `1px solid --color-gold` border, `--color-gold-tint` bg, `--color-gold-dark` text; (2) **Notion-style** (`--notion`) — no border, warm amber-gold background (`--color-gold-tint: #FEF3C7`), deep amber text (`--color-gold-dark: #92400E`, 600 weight); (3) **vivid gold** (`--award`) — no border, vivid amber-yellow background (`--color-gold-vivid: #FDE68A`), deep amber text (`--color-gold-text-deep: #78350F`, ~7.3:1 contrast). The `--award` variant is the component default and is used in all publication tickets; it reads as bright yellow-gold rather than cream. Design Comparisons section preserves all three variants for reference.

### Buttons and Actions
- Clickable actions are visually separated from labels without overpowering dense rows: `--size-action-min-height` = `30px`, `--space-action-block` = `--gap-6`, `--space-action-inline` = `--gap-12`, and `--radius-action` = `--radius-teaching` (`16px`).
- Primary actions use Apple Blue for available CTA moments with no visible outline; secondary/resource actions use warm neutral surfaces with restrained borders.
- General actions may also use a directional orb CTA: a circular silhouette inspired by Notion’s homepage button language, with its diameter reusing the existing action height (`--size-action-min-height`) rather than introducing a new size token. It stays recolored to Apple Blue (`--color-apple-blue`) with a white arrow using rounded cap/join finish. In preview, the three directional variants (right, up-right 45 degrees, down-right 45 degrees) are grouped on one row using the system action rhythm `--gap-8`; the icon itself should render larger than a text-button-equivalent padding model so the graphic reads clearly inside the circle.
- Button labels use the Nav / Button Label tier (`15px / 400`) rather than the Badge / Micro Label tier.
- Publication resource links render as resource actions, not metadata chips, even when they live inside the publication ticket stub.
- In visual preview specimens, non-navigational examples use `button[type="button"]` instead of `href="#"` placeholders to avoid hash jumps while preserving inspectable interaction states.
- Hover behavior follows the Apple-inspired restraint in `DESIGN.md`: primary actions brighten subtly, neutral actions lift by surface/border contrast, focus uses the Apple Blue outline, and active states avoid motion-heavy feedback.
- Preview catalogs group equivalent labels and actions vertically so every available attribute in a family can be inspected without implying a hierarchy between siblings.
- Required publication component families are venue labels, publication type labels, type notes/links, status labels, resource actions, and general actions.

### Education Timeline
- Three-column grid (period / center content / logo) on desktop.
- Blue divider semantics with computed connector between period endpoints.
- Content hierarchy uses shared body tiers in order: `Body Medium` for degree/program, `Body` for affiliation, `Caption` for secondary unit metadata.
- Mobile collapses to single-column stacked reading order.

### News + Teaching Cards
- Light card surfaces with subtle borders.
- News supports a bullet-point variant with a narrow dot column (`--size-rail-dot: 16px`) and short dot marker for fast scanning in dense update streams.
- Bullet-list uses a 3-column grid: dot (centered, 16px) / date rail (80px) / text (fluid). Vertical alignment is `align-items: center` so the dot sits symmetrically in the middle of the row height without a margin-top hack.
- Bullet-list width follows the same section-aligned width logic as index News (`section-aligned` pattern), using one unified inset rule instead of extra component-specific indentation.
- Date rail and body text share a center baseline in the bullet variant for clean horizontal scanning rhythm.
- News date node reuses the same classes as `Publication type labels` (`publication-meta-chip publication-type-chip type-label`) so frame geometry and typography stay identical.
- News date spacing is optimized with a content-aware date rail (`minmax(--size-rail-track, max-content)`) and tighter dot/date gap, preserving a stable text start line while avoiding cramped chip-body spacing.
- Teaching uses role/detail two-column pattern.

### 404 Editorial Hero
- Centered serif-forward display with dual pill actions.
- Uses shared tokens and restrained elevation to stay system-consistent.

### Inspiration Additions (Notion / Linear)
- Keep Notion-style whisper-border discipline: avoid heavy outlines and deep neon glows.
- Preserve low-amplitude hover/focus behavior; avoid noisy transforms.

## 5. Layout Principles

### Spacing System
- Core gap scale is fixed and inspectable: `4 / 6 / 8 / 12 / 16 / 24 / 32 / 48 / 56`.
- `--gap-4` and `--gap-6` are for micro text stacks and dense metadata.
- `--gap-8` and `--gap-12` are the default component internals for chips, rows, and card groups.
- `--gap-16`, `--gap-24`, and `--gap-32` define section and card rhythm.
- `--gap-48` bridges standard section rhythm and wide editorial separation; use it when `32px` feels tight but `56px` opens too far.
- `--gap-56` is reserved for wide editorial columns.
- Semantic spacing aliases (`--space-section`, `--space-card-inline`, etc.) map back to the core gap scale; avoid exposing raw `clamp()` formulas in the visual spec.

### Container Strategy
- Header rail max width: `1440px`.
- Content max width (design-system current): `1050px`.
- Current implementation aligns many section components through shared insets (`--space-title-inline-inset: --gap-24`).

Preferred rail tokens for future migration:
- `--width-rail-level-1: 1050px` (title rail + publication card rail)
- `--width-rail-level-2: 950px` (default content rail)

### Two-Level Width Hierarchy (Title + Content)
- **Level 1 / Title Rail**: section title wrappers use full content rail width inside `--width-rail-level-1` (production pattern remains `w-full` heading row with local `p-[10px]`).
- **Level 2 / Content Rail**: default dense reading components (news cards, teaching cards, bio lead, timeline blocks) align to a narrower rail.
- **Publication exception**: publication cards remain Level 1 because they carry denser metadata/actions and benefit from the wider measure.
- This split keeps headings visually anchored, preserves scan rhythm for most content, and avoids over-compressing publication payload.

### Implementation Audit (2026-04-12)
Current production mapping check:
- Section titles (News / Publications / Teaching / Bio): Level 1.
- News cards: Level 2 (`section-aligned-card`).
- Publication cards: Level 1 (`section-rail-l1` on card root).
- Teaching cards: Level 2 (`section-aligned-card`).
- Bio lead and education timeline: Level 2 (tokenized rail wrappers).

Design-spec verification (Education Timeline vs News Bullet in `design-system/design.html`):
- Both are intended to be centered and visually aligned under the same Level 2 rail.
- Historical mismatch came from mixed width mechanisms (`max-width: 960px` for Education vs inset formula for News), even when the visual delta was small.
- Additional optical drift can come from internal track geometry (Education fixed tracks `112 / 48 / ... / 180` and News `dot + date + body` grid), not only outer container width.

Rule after this pass:
- Education Timeline and News Bullet share the same explicit outer rail token (`--width-rail-level-2`) and remain centered with auto margins.
- Education and News now also share period/track/body rails (`--size-rail-period`, `--size-rail-track`) so primary text-start alignment is directly diagnosable.

Audit conclusion:
- The current site runs the intended mixed model (L1 titles, publication cards on L1, and default dense content on L2).

Proposed direction for future production pass:
- Keep two levels: titles on L1, default content on L2, publication cards on L1.
- For maintainability, prefer explicit rail width utilities/tokens over per-component inset math where practical.
- Keep this design-system page as the reference board for both "current observed" and "preferred" states until production migration is explicitly requested.

### Width Baseline Sync (2026-04-12)

Production extraction from `index.html` + `css/styles.css`:
- Header inner rail: `w-[1440px] max-w-full`.
- Primary section container (design-system current): `w-full` with token-driven cap from `--width-rail-level-1`.
- Title row pattern: `w-full` heading wrappers with local `p-[10px]`.
- Horizontal page gutter: `--space-gutter-fluid: clamp(16px, 3vw, 32px)`.
- Section-aligned inner content width: `calc(100% - (2 * var(--space-title-inline-inset)))`, where `--space-title-inline-inset: clamp(18px, 2vw, 24px)`.

Design-system comparison (before sync):
- Header rail was already aligned at `1440px`.
- Narrative spec already declared the two-rail contract (`1050px / 950px`).
- `design.html` main container used `max-w-[1200px]`, creating preview-vs-production drift.

Decision in this pass:
- Align `design.html` preview main container to the canonical Level 1 rail wrapper so the specimen page reflects the final `1050px / 950px` system rather than a separate `1000px` width rule.

Recommended next refinements (design-system only):
1. Keep the configured rail tokens (`1050/950`) as the canonical design-system content rhythm unless a deliberate width revision is made.
2. If a wider canvas is needed for side-by-side documentation, use local demo blocks (internal grids) instead of widening the global content rail.
3. Preserve an explicit width audit block in `design.html` Layout section so future migrations can be checked quickly against the same component list.
4. In production migration, replace implicit inset-width helpers with explicit rail classes mapped to Level 1 and Level 2 where possible.

### Composition Principles
- One strong visual pattern per section (avoid mixed motifs).
- Metadata-heavy areas prioritize alignment and scanability over decoration.
- Content hierarchy should be obvious without color dependence.

### Radius Scale
- **Card**: `--radius-card` = `24px`
- **Teaching / Action**: `--radius-teaching` = `16px` (Action uses `--radius-action: var(--radius-teaching)`)
- **Badge**: `--radius-badge` = `999px`
- **Control**: `--radius-control` = `8px`

## 6. Depth & Elevation

| Level | Treatment | Use |
|------|-----------|-----|
| Flat | no border, no shadow | Base content surfaces and inline contexts |
| Contained | `1px solid #f2f1ee` | Standard cards and section shells |
| Ring | stronger outline ring, optional very weak shadow | Interactive cards, controls, and active emphasis |
| Hover Card | `--shadow-card-subtle-hover` | Hover/focus-within emphasis |

**Depth Philosophy:** rely on border contrast first, shadow second; reserve stronger shadows for hover/interaction states only.

## 7. Do's and Don'ts

### Do
- Reuse semantic tokens before adding one-off values.
- Keep neutral surfaces warm and low contrast.
- Use blue as semantic emphasis, not decorative saturation.
- Preserve publication ticket information hierarchy.
- Keep typography roles explicit (`type-*` classes).
- Use `align-items: center` on flex/grid parents to center inline elements (dots, icons) vertically instead of using margin-top/margin-bottom hacks.

### Don't
- Don't introduce heavy shadow stacks or glossy effects.
- Don't overuse saturated accent colors.
- Don't replace semantic spacing with arbitrary per-component gaps.
- Don't use `clamp()` as the main spacing vocabulary in the visual spec; map responsive behavior to named gap tokens first.
- Don't introduce an extra global content width outside the `1050px / 950px` rail contract without a specific layout reason.
- Don't use serif for dense metadata/UI controls.
- Don't add `--type-scale` or another global typography multiplier; it hides the real values shown in the preview.
- Don't use `margin-top` / `margin-bottom` hacks to visually "center" inline elements within a flex/grid row — use `align-items: center` on the parent instead. Margin hacks create maintenance burdens: they require different values per breakpoint and break when element sizes change.

## 8. Responsive Behavior

### Breakpoints
- **Mobile (<=700px)**: stack-heavy layout; full-width actions/chips when needed.
- **Header behavior (all widths)**: keep logo + nav in one row; reduce link height/padding only on very narrow screens.
- **Tablet (701px-767px)**: intermediate spacing and card paddings, while preserving desktop information structure where possible.
- **Desktop (>=768px)**: full publication ticket split and 3-column education timeline.

### Component Collapses
- Publication ticket: 2-column -> single-column with top border on stub.
- News row: date/text grid -> stacked flow.
- Education: 3-column -> stacked entries; connector hidden on mobile.
- 404 actions: horizontal pills -> vertical full-width buttons on small screens.

### Interaction Targets
- Chips maintain compact metadata height (`~30px`).
- Buttons/actions maintain a compact touch target (`30px` minimum), larger-than-chip padding, and non-pill corners to avoid being mistaken for tags.

## 9. Agent Prompt Guide

### Quick Token Reference
- `--color-ink: #15120f`
- `--color-page-bg: #fdfdfc`
- `--color-line: #f2f1ee`
- `--color-selection-highlight: #fef08a`
- `--color-ust-blue: #003366`
- `--color-apple-blue: #0071e3`
- `--color-ieee-vr-blue: #262189`
- `--font-inter`, `--font-serif-sc`
- `--radius-card: 24px`, `--radius-teaching: 16px`, `--radius-badge: 999px`, `--radius-action: --radius-teaching`
- `--size-rail-dot: 16px` (news bullet dot column)

### Example Prompts
- "Build a section using warm neutral surfaces, Inter body text, and serif display accents only for hero identity."
- "Create a publication ticket card with left metadata cluster and right resource-stub chips; keep borders whisper-light and shadows subtle."
- "Design a bio timeline row in three columns (period, details, logo) with deep-blue divider semantics and restrained typography."
- "Use low-amplitude hover states and avoid decorative gradients except on narrowly scoped card surfaces."

### Inspiration Blend Guidance
1. Start from this site's current token system and layout rules.
2. Borrow Notion's warmth and border restraint, not its whole component vocabulary.
3. Borrow Linear's precision mindset for hierarchy and spacing discipline, without switching to dark-first branding.
4. Keep outcomes academic, readable, and content-forward.

## 10. Sub-Design Systems (Active)

### 10.1 Foundation Tokens Subsystem
- **Purpose**: define non-negotiable visual primitives used by all components.
- **Includes**: color tokens, typography tokens, spacing clamps, radius tokens, elevation tokens.
- **Rules**:
  - No hardcoded spacing/radius/color values in component CSS when a semantic token already exists.
  - Add new token only when reused by at least two independent components.
  - Keep naming semantic (`--color-muted`, `--space-section`) over contextual (`--bio-gray-2`).
- **Primary sources**: `design-spec.css` and this document.

### 10.2 Publication Ticket Subsystem
- **Purpose**: preserve a signature, scannable publication card pattern.
- **Desktop structure**: content column + stub column.
- **Mobile structure**: single column with stub section stacked and clearly separated.
- **Rules**:
  - Metadata strip always appears before title.
  - Venue/type/status chips never collapse into plain inline text.
  - Venue colors use `data-venue` and venue color tokens, not one-off inline styles.
  - Stub actions keep consistent button geometry and icon spacing.
  - Visual weight remains border-first; shadow is only supporting.

### 10.3 Education Timeline Subsystem
- **Purpose**: communicate temporal progression with minimal visual noise.
- **Desktop structure**: period / details / logo (three-column rhythm).
- **Mobile structure**: single-column stacking with connector removed.
- **Rules**:
  - Period block keeps clear start/end hierarchy.
  - Connector is assistive, not dominant.
  - Affiliation metadata remains typographically subordinate to degree/program title.

#### Vertical Editorial Timeline (Variant)
A card-free minimal timeline variant using a sophisticated dot-and-line track layout:
- **Desktop structure**: 4-column CSS grid. Left (dates) / track (dot+line) / content (degree & affiliation) / right (logo), with preview ratio `112px / 48px / 1fr / 152px` so institutional marks remain legible.
- **Visual pattern**: Inspired by Apple restraint & Notion warmth. Inactive nodes are subtle gray, active nodes are UST Blue with a soft focus-ring shadow. The track uses a continuous elegant 1px soft-border line. Active "Present" text uses a distinct subheading-sized `Noto Serif SC` styling with italics to break the grid rhythm.
- **Node alignment**: node center is derived from the first date line so both active and inactive dots align to the bottom edge of the start-date line, not the full two-line date stack.
- **Connector geometry**: connector start and end are both derived from node-center variables, so line length adjusts with date typography instead of relying on fixed visual offsets.
- **Mobile breakpoint**: Collapses gracefully to 2 columns. The track shifts to the far left, the dates merge above the content, and the logo shrinks or hides.
- **Logo fit rule**: Logo visuals remain constrained to the right track width; use a wider right track in the preview when legibility drops below acceptable scan size.
- **CSS classes**: `.education-timeline-vertical` (container), `.education-timeline-vertical-item` (row), `.education-timeline-vertical-period` (dates wrapper), `.education-timeline-vertical-track` (contains `.education-timeline-vertical-node` and `.education-timeline-vertical-line`), `.education-timeline-vertical-content` (Title uses `Body Medium`, Affiliation uses `Body`, Sub uses `Caption`).
- **Connector baseline**: the default vertical timeline now uses a lowered line-start plus adaptive overhang so the connector better covers item body area without needing preview-only comparison variants.
- **Use case**: When an editorial, chronological, and airy timeline appearance is preferred over the card-based original.

### 10.4 Chip Language Subsystem
- **Purpose**: unify all compact metadata controls under one badge grammar.
- **Chip classes**: venue chip, type chip, status chip.
- **Rules**:
  - Shared shape + spacing token system across all chip types.
  - Semantic differences come from tone/border/text color, not geometry drift.
  - Venue chip tone is data-driven and is the only default high-emphasis publication label.
  - Publication type chips (`Journal`, `Conference`, `Workshop`, `Poster`) share the same quiet class and should not be styled as separate special cases.
  - Type notes and type-note links are part of the type-chip family; default state stays quiet, and hover/focus reveals a `999px` peel background.
  - Status chips cover selected, award, and honorable-mention metadata.
  - Resource links are no longer chips; they use action geometry to preserve click affordance.

### 10.5 Action Button Subsystem
- **Purpose**: distinguish clickable commands from metadata labels without importing a full external component style.
- **Button classes**: primary action, secondary action, publication resource action.
- **Rules**:
  - Actions use compact padding and `30px` minimum height, staying visually larger than chips without dominating metadata rows.
  - Actions use `--radius-action`, which inherits the `16px` teaching radius, rather than `--radius-badge`.
- Resource actions mirror `PUBLICATION_SUPPLEMENT_FIELDS` in `js/utils.js`, but the visual catalog groups aliases by shared icon and interaction type: `Paper / PDF`, `Video / Demo`, `arXiv`, `Slides`, `Poster`, and `Code`.
- Resource actions use **Nav level** typography (`15px / 400`) to keep labels readable without visual dominance.
  - Primary and secondary actions follow unified progressive darkening: idle → hover (darker) → active (darkest). Neither action ever brightens on interaction. Primary uses Apple Blue darkening; secondary uses gray darkening.
  - Maintain clear focus/hover/active states with Apple Blue reserved for focus and primary CTA; filled dark/blue actions keep transparent borders so hover color does not visually detach from an outline.

### 10.6 Apply-Later Checklist (When Phase 1 is done)
1. Audit all pages for one-off color/radius/spacing values.
2. Replace one-off values with design tokens.
3. Normalize chip usage and publication card structure.
4. Validate responsive behavior against section 8 breakpoints.
5. Run visual QA pass for cross-page consistency.
