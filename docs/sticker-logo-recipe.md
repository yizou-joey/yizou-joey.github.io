# Sticker Logo Recipe

Pre-bake a consistent "peel-and-stick" outline around any irregular logo PNG so
that the rendered website can show the artwork as a sticker without runtime
SVG filters.

## Why pre-bake

Runtime CSS / SVG filters (`drop-shadow` stacks, `feMorphology`) work, but:

- Stacked `drop-shadow` halos stay sharp on edges → can't smooth jagged sources.
- `feMorphology` runs every paint and can be expensive on Safari.
- Pre-baked PNGs guarantee identical look across browsers and zero runtime cost.

## Visual recipe

Three operations on the source image's **alpha channel**, then composited
back as a white "paper pad" behind the original artwork:

1. **Dilate** — grow the silhouette outward by N pixels → the sticker padding.
2. **Close** (dilate + erode) — fill small interior holes (thin cables, gaps in
   railings) so the white pad reads as one continuous shape, not a perforated
   one.
3. **Blur + threshold** — soften the dilated alpha, then re-binarize. This is
   the trick that converts angular polygon edges into **rounded, organic
   contours** that look hand-cut rather than algorithmic.
4. *(Optional)* **EdgeOut** — extract a thin ring on the outer boundary of the
   padded shape and fill it with a muted gray/dark color → a thin outline that
   keeps the sticker readable on light backgrounds.

## One-shot ImageMagick command

This command uses a **dilate + heavy-blur + double-threshold** mask pipeline
to produce smooth, organic die-cut contours, then composites a thin dark
stroke and a white pad behind the artwork. Tuned to match the visual weight
of the IEEE VR 26 mascot's baked-in white pad + dark stroke.

```bash
magick "<INPUT>-gray.png" \
  -bordercolor none -border 220x220 \
  \( +clone -alpha extract \
     -morphology Dilate Disk:25 \
     -blur 0x65 -threshold 33% \
     -blur 0x6  -threshold 50% \
     +write mpr:mask +delete \
  \) \
  \( mpr:mask -morphology EdgeOut Disk:4 \
     -background "#3a3a3d" -alpha shape \
  \) \
  -compose DstOver -composite \
  \( mpr:mask -background white -alpha shape \) \
  -compose DstOver -composite \
  -trim +repage -bordercolor none -border 24x24 \
  "<OUTPUT>-sticker.png"
```

### Parameter knobs (keep constant across all logos for a consistent look)

| Knob                       | Meaning                              | Default   | Tune when…                                           |
| -------------------------- | ------------------------------------ | --------- | ---------------------------------------------------- |
| `border 220x220`           | Working canvas headroom for blur     | `220`     | Larger source → keep ≥ 2× blur sigma                 |
| `Dilate Disk:25`           | Initial silhouette growth (pre-blur) | `25`      | Thinner features → 15–20                             |
| `Blur 0x65 -threshold 33%` | Heavy blur → organic outer contour   | `0x65/33%`| Tighter contour → drop blur to 40, threshold 40%     |
| `Blur 0x6  -threshold 50%` | Final edge smoothing                 | `0x6/50%` | Sharper edges → drop blur to 3                       |
| `EdgeOut Disk:4`           | Outline ring thickness               | `4`       | Aligns with IEEE VR mascot stroke at ~64–120 px      |
| `#3a3a3d`                  | Outline color (deep gray, not navy)  | `#3a3a3d` | Use brand accent for tagged stickers                 |
| `border 24x24` (final)     | Trimmed padding around sticker       | `24`      | Increase if shadow gets clipped                      |

### Recoloring the artwork first (optional)

If the source artwork is white-on-transparent (common for event logos meant
for dark backgrounds), recolor it to a neutral gray so it reads on light
paper backgrounds:

```bash
magick "<INPUT>.png" -fill "#737375" -colorize 100 "<INPUT>-gray.png"
```

Then run the sticker recipe on the gray copy.

## Verifying the result

Composite onto a non-white background to confirm the halo is opaque, has no
internal holes, and the outline ring traces every silhouette element:

```bash
magick "<OUTPUT>-sticker.png" -background "#222" -alpha remove -alpha off /tmp/check.png
```

## Reference outputs in this repo

- Source:  `files/logos/MMSys 26 Logo.png`
- Recolored: `files/logos/MMSys 26 Logo-gray.png` (`#737375`)
- Final sticker: `files/logos/MMSys 26 Logo-sticker.png`

Visual benchmark for parity: `files/logos/IEEE VR 26 Mascot.png` — the
MMSys sticker's white-pad thickness and stroke weight are tuned so that the
two stickers read as the same "die-cut" language when rendered side-by-side
at 64–120 px on the warm paper background (`#FAF7F0`).

## Consumption in CSS

Because the halo + outline + recoloring are baked into the PNG, the CSS just
displays it — no `invert`, no `url(#sticker-pad)` filter, no shadow stack
needed:

```css
.service-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: auto;
  image-rendering: smooth;
}
```
