# Design System of Yi ZOU Website

## 1. Visual Theme & Atmosphere

This design language blends Apple-style restraint with Notion-like editorial warmth. The interface is intentionally quiet: soft paper-like backgrounds, minimal chrome, and carefully tokenized typography that keeps attention on research content instead of ornamental UI.

The visual character is academic and calm. Cards are lightly bordered rather than heavily elevated. Motion is subtle. Color is mostly neutral, with disciplined accents: deep UST blue for semantic emphasis and contextual brand hues (for publication venues) where useful.

This is not a dark cinematic product theater. It is a readable, warm, structured research portfolio optimized for scanning publication metadata, timeline history, and profile context.

**Key Characteristics:**
- Warm neutral canvas (`rgb(253, 253, 252)`) with low-contrast separators (`#f2f1ee`)
- Content-first layout with stable width rhythm (`max-width: 1000px`)
- Semantic typography utilities with a global scaling knob (`--type-scale`)
- Mixed type personality: `Inter` for UI clarity, `Noto Serif SC` for identity and hero voice
- Subtle surfaces and whisper borders over heavy shadow stacks
- Chip-driven metadata system for publications/news/status
- Pill controls used selectively (header links, 404 actions), not everywhere

## 2. Color Palette & Roles

### Primary
- **Ink** (`#15120f`): Primary text, major labels, strong actions.
- **Page Background** (`rgb(253, 253, 252)`): Global canvas.
- **Paper** (`#f7f4ef`): Light supportive surface and light-on-dark chip text.
- **Line** (`#f2f1ee`): Dividers, card borders, section separators.

### Accent & Identity
- **UST Blue** (`#003366`): Academic emphasis, timeline/divider semantics.
- **UST Blue Soft** (`rgba(0, 51, 102, 0.28)`): Connector line and low-emphasis blue guides.

### Publication System
- **Publication Rail BG** (`#f8f7f3`): Right stub area in ticket layout.
- **Publication Rail Border** (`#e7e5dd`): Dashed separator line.
- **Chip BG** (`#f7f5ef`), **Chip Border** (`#dfdcd4`)
- **Award Border/Text** (`#efbf04`): Highlighted status/award signal.

### Component Neutrals
- **Muted Text** (`#787774`): Secondary text.
- **Publication Body Text** (`#141414`): Author lines and metadata body.
- **404 Display Tone** (`#2b2825`): Hero numeral tone.

### Inspiration Additions (Notion / Linear)
- Keep Notion-like warm neutrals as first-class surfaces.
- For future dark variant exploration, borrow Linear-style luminance layering (e.g., `#08090a`, `#0f1011`, translucent borders), but keep current light mode as primary.

## 3. Typography Rules

### Font Family
- **UI / Body**: `Inter`, sans-serif
- **Brand / Hero Serif**: `Noto Serif SC`, serif

### Hierarchy (Current Tokens)

| Role | Token | Family | Weight | Notes |
|------|-------|--------|--------|-------|
| Brand Mark | `--type-brand-size` | Noto Serif SC | 400 | Header identity (`Yi`) |
| Hero Title | `--type-title-hero-size` | Noto Serif SC | 400 | Home identity line |
| Hero Subtitle | `--type-title-hero-sub-size` | Noto Serif SC | 400 | Joey / Chinese name |
| Page Title | `--type-title-page-size` | Inter | 600 | Top-level page heading |
| Section Title | `--type-title-section-size` | Inter | 600 | Main section headers |
| Subsection Title | `--type-title-subsection-size` | Inter | 600 | Subgroups, year blocks |
| Card Title | `--type-title-card-size` | Inter | 600 | Publication title |
| Minor Title | `--type-title-minor-size` | Inter | 600/500 | Teaching / education labels |
| Lead Body | `--type-body-lead-size` | Inter | 400 | Intro paragraphs |
| Body | `--type-body-size` | Inter | 400 | Standard copy |
| Body Small | `--type-body-sm-size` | Inter | 400 | Secondary content |
| Label | `--type-label-size` | Inter | 600 | Chips and compact metadata |

### Principles
- Serif display is reserved for identity moments; operational text stays sans-serif.
- Tight tracking is used at title tiers (`-0.03em` to `-0.008em`) for precision.
- Body keeps readable rhythm (`line-height` around `1.55` to `1.7`).
- Global scaling (`--type-scale`) allows site-wide proportion tuning without rewriting components.

## 4. Component Stylings

### Header Navigation
- Sticky header on page background (not translucent glass).
- Compact nav pills (`border-radius: 999px`) with color-state emphasis.
- Active page: ink text; inactive: muted gray.

### Publication Ticket Card (Signature Component)
- Two-zone structure on desktop: main content + right stub.
- Card shell: light gradient surface (`#ffffff` to `#fcfcfb`), subtle border and soft shadow.
- Identity strip: venue chip + type chip + optional status chip.
- Right stub: supplement links (`Paper`, `Video`, `Slides`, etc.) as compact chips.

### Chips
- Unified chip geometry via `--radius-chip` and label token.
- Venue chip uses venue color with light text for fast source recognition.
- Status chip uses gold border/text for awards or special status.

### Education Timeline
- Three-column grid (period / center content / logo) on desktop.
- Blue divider semantics with computed connector between period endpoints.
- Mobile collapses to single-column stacked reading order.

### News + Teaching Cards
- Light card surfaces with subtle borders.
- News uses date chip + text block.
- Teaching uses role/detail two-column pattern.

### 404 Editorial Hero
- Centered serif-forward display with dual pill actions.
- Uses shared tokens and restrained elevation to stay system-consistent.

### Inspiration Additions (Notion / Linear)
- Keep Notion-style whisper-border discipline: avoid heavy outlines and deep neon glows.
- Preserve low-amplitude hover/focus behavior; avoid noisy transforms.

## 5. Layout Principles

### Spacing System
- Section rhythm centered around `28px` core spacing (`--space-section` family).
- Fluid gutters via `clamp()` tokens for better cross-device consistency.
- Card inline paddings are tokenized by breakpoint (`--space-card-inline*`).

### Container Strategy
- Header rail max width: `1440px`.
- Content max width: `1000px`.
- Section components align through shared insets (`--space-title-inline-inset`).

### Composition Principles
- One strong visual pattern per section (avoid mixed motifs).
- Metadata-heavy areas prioritize alignment and scanability over decoration.
- Content hierarchy should be obvious without color dependence.

### Radius Scale
- **Card**: `--radius-card` = `24px`
- **Teaching**: `--radius-teaching` = `16px`
- **Chip**: `--radius-chip` = `12px`
- **Pill controls**: `999px`

## 6. Depth & Elevation

| Level | Treatment | Use |
|------|-----------|-----|
| Flat | border + solid/warm surface | Most sections |
| Subtle Card | `--shadow-card-subtle` | Light card definition |
| Hover Card | `--shadow-card-subtle-hover` | Hover/focus-within emphasis |
| Ticket Elevation | `0 8px 20px rgba(16,16,14,0.03)` | Publication ticket / 404 card |

**Depth Philosophy:** rely on border contrast first, shadow second. Depth should be readable but quiet.

## 7. Do's and Don'ts

### Do
- Reuse semantic tokens before adding one-off values.
- Keep neutral surfaces warm and low contrast.
- Use blue as semantic emphasis, not decorative saturation.
- Preserve publication ticket information hierarchy.
- Keep typography roles explicit (`type-*` classes).

### Don't
- Don't introduce heavy shadow stacks or glossy effects.
- Don't overuse saturated accent colors.
- Don't replace semantic spacing with arbitrary per-component gaps.
- Don't break the `1000px` content rhythm without a specific layout reason.
- Don't use serif for dense metadata/UI controls.

## 8. Responsive Behavior

### Breakpoints
- **Mobile (<640px)**: stack-heavy layout; full-width actions/chips when needed.
- **Tablet (640px-767px)**: intermediate spacing and card paddings.
- **Desktop (>=768px)**: full publication ticket split and 3-column education timeline.

### Component Collapses
- Publication ticket: 2-column -> single-column with top border on stub.
- News row: date/text grid -> stacked flow.
- Education: 3-column -> stacked entries; connector hidden on mobile.
- 404 actions: horizontal pills -> vertical full-width buttons on small screens.

### Interaction Targets
- Chips and controls maintain minimum touch-friendly heights (`~30px` chips, `~42px` key actions).

## 9. Agent Prompt Guide

### Quick Token Reference
- `--color-ink: #15120f`
- `--color-page-bg: rgb(253, 253, 252)`
- `--color-line: #f2f1ee`
- `--color-ust-blue: #003366`
- `--font-inter`, `--font-serif-sc`
- `--radius-card: 24px`, `--radius-chip: 12px`

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
