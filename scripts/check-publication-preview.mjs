import assert from "node:assert/strict";
import { canShowPublicationPreview, placePublicationPreview } from "../js/publication-preview-layout.js";

// Independent space oracle: is there room in at least one of the four strips
// around the entry? Do not reproduce the implementation's candidate sorting.
const hasSpace = ({ viewportWidth, top, bottom, width, height, source }) => {
  if (viewportWidth < 480 || width > viewportWidth - 24 || height > bottom - top
    || source.bottom <= top || source.top >= bottom
    || source.right <= 12 || source.left >= viewportWidth - 12) return false;
  return source.left - 24 >= width || viewportWidth - source.right - 24 >= width
    || source.top - top - 12 >= height || bottom - source.bottom - 12 >= height;
};
const assertPlacement = (layout) => {
  const point = placePublicationPreview(layout);
  assert.equal(Boolean(point), hasSpace(layout), JSON.stringify(layout));
  if (point) {
    const { source, width, height, viewportWidth, top, bottom } = layout;
    assert.ok(point.x >= 12 && point.x + width <= viewportWidth - 12);
    assert.ok(point.y >= top && point.y + height <= bottom);
    assert.ok(point.x + width + 12 <= source.left || point.x >= source.right + 12
      || point.y + height + 12 <= source.top || point.y >= source.bottom + 12);
  }
  return point;
};

let positions = 0;
let unavailable = 0;
for (const viewportWidth of [1920, 1440, 1280, 1024, 800, 600, 480, 479, 390]) {
  for (const viewportHeight of [900, 720, 600, 480]) {
    const width = Math.max(200, Math.min(viewportWidth / 4, 320));
    const height = width * 5 / 8;
    // Include wrapped titles and entries partly outside the visible region.
    for (const entryHeight of [117, 142, 210, 300]) {
      const layout = { viewportWidth, top: 61, bottom: viewportHeight - 12,
        width, height };
      for (let top = layout.top - entryHeight - 7; top <= layout.bottom + 7; top += 7) {
        for (const railWidth of [1060, 600]) {
          const articleWidth = Math.min(railWidth, viewportWidth - 48);
          const source = { left: (viewportWidth - articleWidth) / 2,
            right: (viewportWidth + articleWidth) / 2, top, bottom: top + entryHeight };
          if (assertPlacement({ ...layout, source })) positions++;
          else unavailable++;
        }
      }
    }
  }
}
const layout = { viewportWidth: 1000, top: 60, bottom: 880, width: 250, height: 156.25,
  source: { left: 50, right: 950, top: 350, bottom: 500 } };
assert.equal(placePublicationPreview(layout).side, "bottom");
assert.equal(placePublicationPreview({ ...layout, previousSide: "top" }).side, "top");
assert.equal(placePublicationPreview({ ...layout, previousSide: "bottom",
  protectedRects: [{ left: 700, right: 950, top: 530, bottom: 580 }] }).side, "top");
assert.equal(placePublicationPreview({ ...layout, viewportWidth: 1920,
  source: { left: 500, right: 1300, top: 350, bottom: 500 }, previousSide: "left" }).side, "left");
const wideShort = { viewportWidth: 1920, top: 61, bottom: 468, width: 320, height: 200,
  source: { left: 430, right: 1490, top: 180, bottom: 322 } };
assert.equal(canShowPublicationPreview(wideShort), true);
assert.equal(assertPlacement(wideShort).side, "right");
const narrowShort = { ...wideShort, viewportWidth: 1000, width: 250, height: 156.25,
  source: { left: 24, right: 976, top: 70, bottom: 212 } };
assert.equal(assertPlacement(narrowShort).side, "bottom");
assert.equal(assertPlacement({ ...narrowShort,
  source: { left: 24, right: 976, top: 190, bottom: 332 } }), null);
// Unrelated entry heights must not change eligibility or placement.
assert.deepEqual(placePublicationPreview({ ...wideShort, maxEntryHeight: 10000 }),
  placePublicationPreview(wideShort));
assert.equal(canShowPublicationPreview({ ...wideShort, maxEntryHeight: 10000 }), true);

const exact = { viewportWidth: 480, top: 61, bottom: 186, width: 200, height: 125,
  source: { left: 24, right: 256, top: 80, bottom: 160 } };
assert.equal(assertPlacement(exact).side, "right");
assert.equal(assertPlacement({ ...exact, viewportWidth: 479 }), null);
assert.equal(assertPlacement({ ...exact, bottom: 185 }), null);
assert.equal(assertPlacement({ ...exact, source: { ...exact.source, right: 257 } }), null);
assert.equal(canShowPublicationPreview({ ...exact, width: 456 }), true);
assert.equal(canShowPublicationPreview({ ...exact, width: 457 }), false);
for (const source of [
  { left: 24, right: 256, top: 20, bottom: 62 }, // Partially visible above.
  { left: 24, right: 256, top: 185, bottom: 230 }, // Partially visible below.
  { left: 24, right: 256, top: 20, bottom: 61 },
  { left: 24, right: 256, top: 186, bottom: 230 },
  { left: -100, right: 12, top: 80, bottom: 160 },
  { left: 468, right: 600, top: 80, bottom: 160 },
]) assertPlacement({ ...exact, source });
console.log(`Publication preview: 36 viewport combinations; ${positions} valid placements; ${unavailable} unavailable placements; boundaries, overlap and direction priorities passed.`);
