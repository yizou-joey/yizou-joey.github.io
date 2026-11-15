# Design Guidelines

This site is a quiet personal academic archive. Warm paper, editorial typography, and clear hierarchy serve research and personal expression rather than marketing. The independently composed [visual reference](/design.html) is not generated from Markdown; this document is its companion implementation guide. `css/styles.css` is the source of truth for values and states. Keep the references aligned when shared behavior changes.

The visual reference is itself an example of this design system, not just a description of it. Apply the shared typography, spacing, components, and interaction rules to the page itself; use guide-specific presentation only where its explanatory role requires it. When a shared rule changes, update and verify both the reference page and its examples alongside the affected site pages.

## Visual Direction And Boundaries

- Content comes before decoration. Establish reading order with type, alignment, whitespace, and fine dividers, not default cards, heavy shadows, glows, or animation.
- Reuse visual and interaction rules for the same semantics. Scope an exception only when its distinct responsibility cannot be met by the shared rule.
- Treat a page as a continuous reading space. On narrow screens, allow wrapping, growth, and reflow rather than clipping essential content to preserve a composition.
- Reserve emphasis for meaningful roles such as venue and award. Communicate actions and state changes clearly, with visible focus and motion that supports understanding.

## Color And Themes

| Role | Token | Light | Dark |
| --- | --- | --- | --- |
| Paper | `--color-page-bg` | `#fdfdfc` | `#191919` |
| Text | `--color-ink` | `#15120f` | `#e7e5e2` |
| Supporting information | `--color-muted` | `#73716c` | `#a6a39e` |
| Warm divider | `--color-border-warm` | `#dfdcd4` | `#3b3a37` |
| Award text | `--color-award-text` | `#b85a00` | `#f2cb00` |
| Resource links | `--color-resource-link` | `#92400e` | `#bd8c6e` |

Accent colors are semantic, not arbitrary decoration. Conferences use their corresponding `--color-venue-*-text`; dark mode raises text brightness while preserving the source hue. Stickers use the same image in both themes, with only the shadow adjusted. The footer illustration uses multiply in light mode and normal blending in dark mode. The theme button names its destination; content remains readable without JavaScript.

| Venue | Source token / color | Text token | Light | Dark |
| --- | --- | --- | --- | --- |
| IEEE VR | `--color-venue-ieee-vr` / `#262189` | `--color-venue-ieee-vr-text` | `#262189` | `#7c77de` |
| ISMAR | `--color-venue-ismar` / `#008efc` | `--color-venue-ismar-text` | `#006bbd` | `#008efc` |
| MMSys | `--color-venue-mmsys` / `#185669` | `--color-venue-mmsys-text` | `#185669` | `#2c9cbf` |

## Typography And Hierarchy

- `--font-sans` favors system fonts with local Inter as a fallback; `--font-serif-sc` uses local Noto Serif SC and fallbacks; `--font-handwritten` is reserved for occasional personal expression. Do not assume the existing serif subset covers all Chinese characters.
- Choose typography by content role, not mechanically by HTML heading level or whether something is a link or navigation. Use `.type-title-hero` for the page title, `.type-title-section` for section headings, and `.type-title-subsection` for groups within a section. Subsection headings use the quieter sans-serif, regular-weight, muted treatment; use spacing and grouping to establish their relationship to the section rather than a larger serif title.
- Content-item titles, such as publications, education entries, and the design principles, have their own editorial or component roles; do not force them into the subsection style solely because they use `h3`. Preserve a logical HTML heading outline independently of visual styling.
- `.type-body-bio` is the larger serif narrative style, used for the homepage biography, project abstracts and details, and 404 copy. Its historical name does not limit it to biographies. `.type-body-sm` is compact serif supporting text, used for profile location and contacts and for the visual reference's secondary explanations; it is not a universal caption style.
- `.type-body` remains an available sans-serif primitive but is not used by the homepage or the visual reference. `.type-label` is for compact sans-serif labels. Editorial components own distinct text roles: for example, news uses `.editorial-news-content`, while publication authors and project image captions have their own metrics. Do not unify them solely because their font sizes match.
- The visual reference uses narrative type for its opening lede and the shared small serif style for most introductions, rules, captions, and specimen descriptions. Headings, navigation, code, metrics, and embedded site components keep their own typography. Its font metric identifies the preferred font in the computed stack, not necessarily the font that rendered each glyph.
- Write English page, section, and subsection headings with the first letter of every word capitalized, including short words. Author this casing in the source; preserve acronyms, brands, code, and verbatim publication titles as supplied. Body text uses sentence case.
- At the default 16px root, the hero is 3rem, body text 1rem, and narrative body text 1.125rem. Line-height tokens are unitless ratios. Do not set a root font size; let text containers grow with user settings.

## Layout, Spacing, And Responsiveness

- Use `.page-gutter` and `.section-rail-l1` / `.section-rail-l2`. Their rail maximums are 1100px and 1060px respectively; the header maximum is 1280px. Choose `--space-*` tokens: common section spacing is 48px, heading-to-content 32px, and list-item spacing 24px; fluid gutters range from 16–32px.
- Adapt to available width, not device names. The homepage changes to two columns at `56.25em`; `37.5em` adjusts identity details. The news script shares the former breakpoint. Service tooltip CSS and JavaScript share `64em`. Check both sides and synchronize scripts when changing breakpoints.
- In the wide homepage layout, the portrait occupies the right column and the full address and social links are centered. In the narrow layout, the name becomes vertical, the portrait and contact details reflow rightward or downward, the address shortens to the city, and the biography follows the identity area. Name and body share a starting line, with only font-relative optical adjustments as needed.
- `rem` sizes, unitless line heights, and font-relative container queries support text enlargement. `em` media queries use the browser's initial font size. Shared head `text-scale` progressively enhances system scaling; do not simulate additional scaling in JavaScript. `--space-*` values are currently pixels, and the news script reads `--space-48` as pixels; update that reader if units change.
- Primary verification viewports are 402 × 874, 820 × 1180, and 1280 × 832 CSS pixels; also test 320px reflow and both sides of breakpoints. A viewport is not a physical pixel count or actual first-screen height; a landscape tablet may still use touch.
- Test at 100% page zoom with simulated DPR 3 for phones and DPR 2 for tablets where useful. Record browser and input method; do not infer desktop window width from DPR. For a real first screen, record both layout viewport and `visualViewport`, rather than guessing browser chrome height.

## Images, Icons, And Stickers

- Provide appropriate alternative text and dimensions; content images should support understanding, while decorative images use empty alt text. Use optimized resources in `public/files/generated/`; do not edit generated files directly.
- Contact and theme icons use the Tabler Outline 24px grid and 2px stroke; contact SVGs inherit text color. Stickers retain their original colors, white edge, and `--sticker-shadow-base`, without card-like backplates. See `docs/sticker-preview.md` for generation and history.

## Shapes And Corners

- Corners follow responsibility, not a universal card scale. Reading areas remain open and square by default; a 2px radius softens fine link focus outlines, while compact navigation and theme controls use 4px.
- Project media frames and the visual guide's swatches use 8px. Badges use `--radius-badge` (999px). Swatch framing is for the guide and does not turn ordinary site content into cards.

## Components And Interaction States

- Ordinary `.inline-link` and `.contact-link-label` share one native 1px underline family that wraps: offset `0.15em` at rest, `0.2em` on hover or focus, and `0.175em` when pressed; hover takes 140ms, press 100ms, and focus outlines appear immediately. Reduced motion keeps the resting offset and retains color feedback. The ordinary link itself is the target; contact hover, press and focus belong to the entire parent `.contact-link`, including icon and gap, while only its label is underlined. The 404 page uses `.error404-link`. Context can provide a conference accent; otherwise use the ink underline token.
- `.service-event a[aria-describedby]` replaces the native underline with a pseudo-element coordinated with the tooltip connector. Both remain 1px in every state; the exception is the connecting line, not a thicker underline. Floating annotations open on hover or focus only at `min-width: 64em` with a fine hover pointer; keyboard focus is immediate. Escape, scroll, and resize dismiss them. On touch or narrow layouts the annotation is visually hidden and the link remains navigable; its text is referenced by `aria-describedby`. `.publication-bracket-links` owns resource arrows and underlines; `.publication-project-link` owns the preview. Do not override these exceptions with global `a` states.
- `.service-list` owns the centered level-2 rail, list spacing, homepage base text metrics, and service link states. Reuse it around rendered service rows in other contexts; do not let a surrounding specimen heading or prose style redefine the rows.
- `.site-header-link` is muted without an underline, changes to ink on hover over 160ms ease, and shows a 2px blue focus outline with 2px offset. `aria-current="page"` or `"location"` uses ink; the current homepage item is a non-clickable span.
- The theme control is one fixed slot and one accessible button whose icon and name indicate the destination. Hover changes only icon color; fine-pointer press scales to 0.97 (160ms in, 100ms out). A supported pointer transition crossfades the whole page over 280ms without a wipe while the circle/crescent morph takes 240ms and rays scale/fade over 180/120ms; without path interpolation, the icon uses a 160ms fade/scale fallback. Keyboard activation, reduced motion, initial paint, storage updates, and unsupported transitions are immediate. Repeated clicks interrupt motion and apply the latest choice without layout shift or duplicated content. See `docs/technical-notes.md` for implementation details.
- Lists use `.editorial-*`; publications and news use `.publication-*` and `.news-*` respectively. Fix shared behavior in shared primitives rather than copying page-specific states.

## Accessibility And Motion

- Use real headings, lists, links, and buttons, meaningful link names, and visible keyboard focus. Essential actions must work with touch, keyboard, and pointer; do not rely on color or hover alone.
- Motion explains relationships; it must not delay content or actions. `prefers-reduced-motion: reduce` retains immediate color, focus, and state feedback; ordinary links keep their resting underline offset. Keyboard interaction and browsers without relevant APIs need an immediate fallback.
- Respect browser default font sizes, page zoom, and user text-spacing overrides. Do not hide overflowing content. Body content must remain readable without JavaScript.

## Implementation And Acceptance

- Inspect tokens, `.type-*`, `.section-*`, `.editorial-*`, and component families in `css/styles.css` before adding semantic classes. Do not put inline styles or temporary layout utilities in HTML. See `docs/content-schema.md` for content and `docs/technical-notes.md` for the build.
- Run `npm run check` and `git diff --check`. For shared behavior, cover all published pages, single and wrapped lines, light and dark themes, pointer, keyboard, touch, and reduced motion; inspect images, focus, complete rows, and horizontal overflow.
- Typography acceptance covers browser default sizes 16/20/24/32px, actual page zoom 125/150/200/400%, 320 CSS px, and text-spacing overrides (line height 1.5, paragraph spacing 2em, letter spacing 0.12em, word spacing 0.16em). Temporary root-size overrides supplement but do not replace real settings. Record browser, viewport, and input method; inspect browser chrome and the visual viewport separately on real devices.
