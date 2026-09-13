import assert from "node:assert/strict";
import { canShowPublicationPreview, placePublicationPreview } from "../js/publication-preview-layout.js";

let positions = 0;
for (const viewportWidth of [1920, 1440, 1280, 1024, 800, 600, 390]) {
  for (const viewportHeight of [900, 720, 600, 480]) {
    const width = Math.max(200, Math.min(viewportWidth / 4, 320));
    const height = width * 5 / 8;
    // Include wrapped titles and entries partly outside the visible region.
    for (const maxEntryHeight of [117, 142, 210, 300]) {
      const layout = { viewportWidth, top: 61, bottom: viewportHeight - 12,
        width, height, maxEntryHeight };
      const enabled = canShowPublicationPreview(layout);
      assert.equal(enabled, viewportWidth >= 480
        && viewportHeight - 73 >= maxEntryHeight + 2 * (height + 12));
      if (!enabled) continue;
      for (let top = layout.top - maxEntryHeight + 1; top < layout.bottom; top += 7) {
        for (const entryHeight of [maxEntryHeight, maxEntryHeight * 0.8]) {
          if (top + entryHeight <= layout.top) continue;
          const articleWidth = Math.min(1060, viewportWidth - 48);
          const source = { left: (viewportWidth - articleWidth) / 2,
            right: (viewportWidth + articleWidth) / 2, top, bottom: top + entryHeight };
          const point = placePublicationPreview({ ...layout, source });
          assert.ok(point, `Missing position at ${viewportWidth} × ${viewportHeight}`);
          assert.ok(point.x >= 12 && point.x + width <= viewportWidth - 12);
          assert.ok(point.y >= layout.top && point.y + height <= layout.bottom);
          assert.ok(point.x + width <= source.left || point.x >= source.right
            || point.y + height <= source.top || point.y >= source.bottom);
          positions++;
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
assert.equal(canShowPublicationPreview({ ...layout, maxEntryHeight: 483.5 }), true);
assert.equal(canShowPublicationPreview({ ...layout, maxEntryHeight: 483.51 }), false);
console.log(`Publication preview: 28 viewport combinations; ${positions} valid placements; overlap and direction priorities passed.`);
