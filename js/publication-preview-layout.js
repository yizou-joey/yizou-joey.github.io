const GAP = 12;

const intersects = (a, b) => a.left < b.right && a.right > b.left
  && a.top < b.bottom && a.bottom > b.top;

export const canShowPublicationPreview = ({ viewportWidth, top, bottom, width, height, maxEntryHeight }) =>
  viewportWidth >= 480 && width <= viewportWidth - GAP * 2
  && bottom - top >= maxEntryHeight + 2 * (height + GAP);

export const placePublicationPreview = ({ source, viewportWidth, top, bottom, width, height,
  previousSide, protectedRects = [] }) => {
  const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
  const x = clamp(source.right - width, GAP, viewportWidth - width - GAP);
  const y = clamp((source.top + source.bottom - height) / 2, top, bottom - height);
  const candidates = [
    { side: "right", x: source.right + GAP, y },
    { side: "left", x: source.left - width - GAP, y },
    { side: "bottom", x, y: source.bottom + GAP },
    { side: "top", x, y: source.top - height - GAP },
  ].filter((point) => point.x >= GAP && point.x + width <= viewportWidth - GAP
    && point.y >= top && point.y + height <= bottom);
  const sides = candidates.filter((point) => point.side === "right" || point.side === "left");
  if (sides.length) return sides.find((point) => point.side === previousSide) || sides[0];

  const overlaps = (point) => protectedRects.filter((rect) => intersects({
    left: point.x, right: point.x + width, top: point.y, bottom: point.y + height,
  }, rect)).length;
  candidates.sort((a, b) => overlaps(a) - overlaps(b)
    || Number(b.side === previousSide) - Number(a.side === previousSide));
  // Stable sorting preserves bottom-before-top when neither is the previous side.
  return candidates[0] || null;
};
