# Local site fonts

The published shared-shell pages use local Google Fonts subsets: Noto Serif SC
(variable weights 400–600) and Shantell Sans (400). Inter remains unchanged.
Both are distributed under the accompanying SIL Open Font License files. The
serif is used above the fold on every published page and is the only preload;
the handwritten font is fetched only when used. Legacy entries retain their
own font links and are not part of the published shell.

To regenerate after copy or generated UI text changes, run
`node scripts/prepare-site-fonts.mjs` with network access. This adapts the
separate Chinese typography worktree's Google Fonts `text`-subset approach;
it reads this checkout only and requests ASCII, extended Latin, and characters
in the current content, HTML, styles and rendering scripts. Google Fonts may
update its source versions, so regeneration is repeatable but not guaranteed
byte-identical over time. Review the resulting WOFF2 files and licences, and
run `npm run check`. New characters require regeneration; unsupported glyphs
fall back to the next font rather than triggering a remote font request.

## Validation (2026-11-14)

- `npm run check` and `git diff --check` passed.
- Headless Chromium checked the built homepage, both project pages and 404 at
  1280, 820, 390 and 320 CSS pixels, including coarse-pointer emulation at the
  three smaller widths, reduced motion, theme switching and a 32px root font.
- Independent contact/resource/navigation targets were at least 24px, or 44px
  with a coarse pointer. No target overlap, horizontal page overflow, broken
  loaded images or JavaScript errors were found in these cases.
- The browser loaded local Noto Serif SC, Shantell Sans and Inter on the home
  page, with no Google Fonts requests across the published routes. Only Noto
  is preloaded. Noto is 37,936 bytes; Shantell is 57,972 bytes.
- Local evidence: `/tmp/opencode/touch-font-audit/report.json` and desktop/mobile
  homepage screenshots alongside it. Browser checks used machine-local port
  5187; HTTP checks of the Tailscale origin confirmed font/image responses.
  This is not verification in a physical touch device or the remote Mac.
- The existing 5186 development process returned 404 for generated images that
  existed on disk. A separate built preview on 5187 was used for final checks;
  current preview assignments are in the workspace README.
