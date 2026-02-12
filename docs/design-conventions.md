# Design Conventions

- Theme tokens are defined in inline `tailwind.config` blocks; keep `index.html` and `publications.html` in sync.
- Fonts: body/UI uses Inter (`font-inter`); serif brand/CJK uses Noto Serif SC (`font-serifSc`).
- Colors (Tailwind tokens): `ink #15120f`, `muted #787774`, `paper #f7f4ef`, `stone #f6f5f4`, `line #e9e7e3`, `chip #262189`.
- Neutrals used directly: hero gradient `#f7f6f3` → `#e9e7e3` → `#d3d1cb`; date-chip bg `#f1f1ef`.
- Type sizes (reuse these): `12/14/16/18/20/24/28/30/36/40/48/64` (px), with body at `16` and `leading-relaxed`.
- Links are always underlined with subdued decoration: `underline-offset-2 decoration-muted/40 hover:decoration-ink/60`.
- Layout widths: header container `1440px`; content max `1000px`; default mobile padding `px-4`.
- Surfaces: structure via alternating white and `bg-stone`; separation via `border border-line`.
- Radii: chips `rounded-[6px]`, small cards `rounded-[8px]`, large cards `rounded-xl`, avatar `rounded-[20px]`.
- Chips: venue chip uses `venueColor` (fallback `chip`) with `text-paper font-semibold`; date chip uses `#f1f1ef` + `text-muted`.
