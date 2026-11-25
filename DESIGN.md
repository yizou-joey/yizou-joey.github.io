# Design Guidelines

This site is a quiet personal academic archive. Warm paper, editorial typography, and clear hierarchy serve research and personal expression rather than marketing. The independently composed [visual reference](/design.html) is not generated from Markdown; this document is its companion implementation guide. `css/styles.css` is the source of truth for values and states. Keep the references aligned when shared behavior changes.

The visual reference is itself an example of this design system, not just a description of it. Apply the shared typography, spacing, components, and interaction rules to the page itself; use guide-specific presentation only where its explanatory role requires it. When a shared rule changes, update and verify both the reference page and its examples alongside the affected site pages.

## Visual Direction And Boundaries

- Content comes before decoration. Establish reading order with type, alignment, whitespace, and fine dividers, not default cards, heavy shadows, glows, or animation.
- Reuse visual and interaction rules for the same semantics. Scope an exception only when its distinct responsibility cannot be met by the shared rule.
- Treat a page as a continuous reading space. On narrow screens, allow wrapping, growth, and reflow rather than clipping essential content to preserve a composition.
- Reserve decorative emphasis for meaningful roles such as venue and award. `--color-link-hover` is interaction feedback for links, not decoration. Communicate actions and state changes clearly, with visible focus and motion that supports understanding.

## Color And Themes

The [Color page](/design-color.html) shows these tokens live, with copyable names; this table is its written reference.

| Role | Token | Light | Dark |
| --- | --- | --- | --- |
| Paper | `--color-page-bg` | `#fdfdfc` | `#191919` |
| Text | `--color-ink` | `#15120f` | `#e7e5e2` |
| Link hover and keyboard focus text and underline | `--color-link-hover` | `#0066cc` | `#2997ff` |
| Focus ring | `--color-apple-blue` | `#0071e3` | `#0071e3` |
| Contact icon and label at rest | `--color-chip-text-muted` | `#3c3c3c` | `#e7e5e2` |
| Supporting information | `--color-muted` | `#73716c` | `#a6a39e` |
| Subtle divider | `--color-line` | `#f2f1ee` | `#2f2e2b` |
| Warm divider | `--color-border-warm` | `#dfdcd4` | `#3b3a37` |
| Award text | `--color-award-text` | `#b85a00` | `#f2cb00` |
| Resource links | `--color-resource-link` | `#92400e` | `#bd8c6e` |

Accent colors are semantic, not arbitrary decoration. Conferences use their corresponding `--color-venue-*-text` everywhere they appear, including news links and project labels, so the same conference has one text color per theme; dark mode raises text brightness while preserving the source hue. Stickers use the same image in both themes, with only the shadow adjusted. The footer illustration uses multiply in light mode and normal blending in dark mode. The theme button names its destination; content remains readable without JavaScript.

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
- Color swatch cards reuse existing primitives rather than defining their own roles. The name uses `.type-title-section` for its visual metrics (1rem, weight 500, ink), matching the characteristic names on the visual reference; this shares metrics only, and `.type-title-section` remains the section heading primitive. The description and the venue source line use `.type-body-sm`. Token names and hex values use the guide's monospace identifier style inside `.design-swatch`.
- Guide notes, such as the Heading Case note and pointers to a live example, use `.design-caption`. It shares the `.type-body-sm` serif metrics in `--color-muted`, sits directly under the heading, rule, or specimen it explains, and takes 16px above when it follows other content. A note may contain one inline link. Notes are guide-only explanations; site content must not use `.design-caption`.
- Write English page, section, and subsection headings with the first letter of every word capitalized, including short words. Author this casing in the source; preserve acronyms, brands, code, and verbatim publication titles as supplied. Body text uses sentence case.
- At the default 16px root, the hero is 3rem, body text 1rem, and narrative body text 1.125rem. Line-height tokens are unitless ratios. Do not set a root font size; let text containers grow with user settings.

## Layout, Spacing, And Responsiveness

- Use `.page-gutter` and `.section-rail-l1` / `.section-rail-l2`. Their rail maximums are 1100px and 1060px respectively; the header maximum is 1280px. Choose `--space-*` tokens: common section spacing is 48px, heading-to-content 32px, and list-item spacing 24px; fluid gutters range from 16–32px.
- Adapt to available width, not device names. The homepage changes to two columns at `56.25em`; `37.5em` adjusts identity details. The news script shares the former breakpoint. Service tooltip CSS and JavaScript share `64em`. Check both sides and synchronize scripts when changing breakpoints.
- The design guide uses one shared page navigation. At `56.25em` wide it sits beside the content and aligns with the top of the page introduction. It stays expanded and sticks while scrolling only when the viewport is also at least `36em` tall; at narrower widths it sits above the content.
- Guide navigation links use `.type-nav` (0.8125rem, regular weight). Group titles such as Start, Foundations, and Guide are navigation labels rather than section headings: they are `<p>` elements using `.type-label` in `--color-muted` (0.75rem, weight 600). Do not style them with `.type-title-section` or `.type-title-subsection`.
- The guide content column applies `--space-section-between` once between its introduction and sections. Section headings keep `--space-section-heading-content`; the introduction and sections do not add padding to the shared gap.
- [Flexible Layout](/design-principles.html#responsive) summarizes the reflow principle. The homepage puts names and biography on the left and portrait, contacts and news on the right. Below `56.25em`, stacked names, portrait and contacts share a row; biography and news each span the full width below. Below `37.5em`, identity type and spacing get more compact without changing that order. At a profile content width of `calc(21.25rem - 40px)` or less, the names span their own row above a smaller portrait and contacts.
- `rem` sizes, unitless line heights, and font-relative container queries support text enlargement. `em` media queries use the browser's initial font size. Shared head `text-scale` progressively enhances system scaling; do not simulate additional scaling in JavaScript. `--space-*` values are currently pixels, and the news script reads `--space-48` as pixels; update that reader if units change.
- Primary verification viewports are 402 × 874, 820 × 1180, and 1280 × 832 CSS pixels; also test 320px reflow and both sides of breakpoints. A viewport is not a physical pixel count or actual first-screen height; a landscape tablet may still use touch.
- Test at 100% page zoom with simulated DPR 3 for phones and DPR 2 for tablets where useful. Record browser and input method; do not infer desktop window width from DPR. For a real first screen, record both layout viewport and `visualViewport`, rather than guessing browser chrome height.

## Images, Icons, And Stickers

- Provide appropriate alternative text and dimensions; content images should support understanding, while decorative images use empty alt text. Use optimized resources in `public/files/generated/`; do not edit generated files directly.
- Contact and theme icons use the Tabler Outline 24px grid and 2px stroke; contact SVGs inherit text color. Stickers retain their original colors, white edge, and `--sticker-shadow-base`, without card-like backplates. See `docs/sticker-preview.md` for generation and history.

## Shapes And Corners

- Corners follow responsibility, not a universal card scale. Reading areas remain open and square by default; a 2px radius softens fine link focus outlines, while compact navigation and theme controls use 4px.
- Project media and citation frames and the visual guide's swatches use 8px. Badges use `--radius-badge` (999px). Swatch framing is for the guide and does not turn ordinary site content into cards.
- Both swatch groups share the same grid and color sample geometry. A single-column palette places the color sample beside the token and description instead of stretching it above the text.

## Components And Interaction States

- Ordinary `.inline-link`, `.contact-link-label`, and `.error404-link` share one native 1px underline family that wraps: offset `0.15em` at rest, `0.2em` on hover or focus, and `0.175em` when pressed. At rest, link text is `--color-ink`, the same as body text, and the underline is `--color-link-decoration-ink`. On hover or keyboard focus, link text and underline change to `--color-link-hover` (`#0066cc` light, `#2997ff` dark) over the same 140ms as the underline; press uses the same color. Focus outlines use `--color-apple-blue` (`#0071e3`) in both themes. External links follow the same rules, with no extra icon or resting color. Press updates the colors immediately and moves the underline over 100ms; keyboard focus feedback is immediate. Reduced motion keeps the resting offset and applies color feedback immediately.
- The ordinary link itself is the target. Hover, press, and focus belong to the entire `.contact-link` including icon and gap, and its icon and label change color together; only the label is underlined. Use `--link-text-rest` and `--link-text-emphasis` for contextual text tones when needed. Conference links keep their venue color for hover text and underline accent, and their resting text is ink like other links. Keep underline colors independent of the text tokens.
- `.service-event a[aria-describedby]` replaces the native underline with a pseudo-element coordinated with the tooltip connector. Both remain 1px in every state; the exception is the connecting line, not a thicker underline. Floating annotations open on hover or focus only at `min-width: 64em` with a fine hover pointer; keyboard focus is immediate. Escape, scroll, and resize dismiss them. On touch or narrow layouts the annotation is visually hidden and the link remains navigable; its text is referenced by `aria-describedby`. `.publication-project-link` owns the preview. Do not override these exceptions with global `a` states.
- `.publication-bracket-links` is the resource label, used for research resources such as papers, posters, videos, and downloadable files. Its brackets enclose only the resource name, such as `[DESIGN.md]`; verbs such as Download belong to the surrounding text. The label is `--color-resource-link`, pressed text mixes that color 65% with ink, and the label is not underlined at rest. Hover and keyboard focus reveal a 1px `::after` underline from left to right in 260ms, and an up-arrow appears in 260ms. The underline is not `text-decoration`, so the `--link-underline-*` offset tokens do not apply. Pressing lifts the underline by `-0.025em` in 100ms, the difference between the press and hover offsets, and only when motion is allowed. Reduced motion shows the final state immediately.
- `.service-list` owns the centered level-2 rail, list spacing, homepage base text metrics, and service link states. Reuse it around rendered service rows in other contexts; do not let a surrounding specimen heading or prose style redefine the rows.
- `.site-header-link` is muted without an underline, changes to ink on hover over 160ms ease, and shows a 2px blue focus outline with 2px offset. `aria-current="page"` or `"location"` uses ink; the current homepage item is a non-clickable span.
- The theme control is one fixed slot and one accessible button whose icon and name indicate the destination. Hover changes only icon color; fine-pointer press scales to 0.97 (160ms in, 100ms out). A supported pointer transition crossfades the whole page over 280ms without a wipe while the circle/crescent morph takes 240ms and rays scale/fade over 180/120ms; without path interpolation, the icon uses a 160ms fade/scale fallback. Keyboard activation, reduced motion, initial paint, storage updates, and unsupported transitions are immediate. Repeated clicks interrupt motion and apply the latest choice without layout shift or duplicated content. See `docs/technical-notes.md` for implementation details.
- Lists use `.editorial-*`; publications and news use `.publication-*` and `.news-*` respectively. Fix shared behavior in shared primitives rather than copying page-specific states.
- Project BibTeX citations use `.project-citation-*`: a semantic `<pre><code>` retains authored indentation, with a 1px warm border, `--color-line` background, 8px radius, 16px padding, and 0.875rem/1.6 monospace text. `pre-wrap` and `overflow-wrap: anywhere` wrap long lines visually without changing copied text. These rules are for citations, not a general programming-code standard; the guide's inline identifiers have their own local treatment.
- The citation's 40px icon button is progressively revealed by JavaScript; without it, text remains selectable. Fine-pointer hover changes surface and ink; keyboard focus has a 2px outline. Successful copy changes the icon and announces status, while failure displays and announces a message. Feedback clears after two seconds, and repeated activation remains possible. The clipboard API is used in secure contexts, with a selection-based fallback when unavailable or rejected; if copying fails, select the citation manually.

## Accessibility And Motion

- Use real headings, lists, links, and buttons, meaningful link names, and visible keyboard focus. Essential actions must work with touch, keyboard, and pointer; do not rely on color or hover alone.
- Motion explains relationships; it must not delay content or actions. `prefers-reduced-motion: reduce` retains immediate color, focus, and state feedback; ordinary links keep their resting underline offset. Keyboard interaction and browsers without relevant APIs need an immediate fallback.
- Navigation between site pages fades the page over 200ms (`--navigation-fade-duration`): a native cross-document crossfade where supported, otherwise a page-background veil that appears only after 150ms, fades out at 1s, and leaves a 2px ink hairline at the top while a slow page loads. Shared project image and title motion keep their own timing. Reduced motion navigates immediately, without the veil or hairline.
- Respect browser default font sizes, page zoom, and user text-spacing overrides. Do not hide overflowing content. Body content must remain readable without JavaScript.

## Implementation And Acceptance

- Inspect tokens, `.type-*`, `.section-*`, `.editorial-*`, and component families in `css/styles.css` before adding semantic classes. Do not put inline styles or temporary layout utilities in HTML. See `docs/content-schema.md` for content and `docs/technical-notes.md` for the build.
- Run `npm run check` and `git diff --check`. For shared behavior, cover all published pages, single and wrapped lines, light and dark themes, pointer, keyboard, touch, and reduced motion; inspect images, focus, complete rows, and horizontal overflow.
- Typography acceptance covers browser default sizes 16/20/24/32px, actual page zoom 125/150/200/400%, 320 CSS px, and text-spacing overrides (line height 1.5, paragraph spacing 2em, letter spacing 0.12em, word spacing 0.16em). Temporary root-size overrides supplement but do not replace real settings. Record browser, viewport, and input method; inspect browser chrome and the visual viewport separately on real devices.
