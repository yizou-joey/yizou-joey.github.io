// Inspired by Sanyam's Lab (see README.md), adapted to a quiet reading list.
// Neighboring placements protect the active paper; other content is a soft preference.
import { canShowPublicationPreview, placePublicationPreview } from "./publication-preview-layout.js";
const entries = [...document.querySelectorAll(".editorial-publication-item")];
const sources = entries.map((entry) => entry.querySelector(".publication-preview-source"));

if (sources.some(Boolean)) {
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const preview = document.createElement("div");
  preview.className = "publication-preview";
  preview.setAttribute("aria-hidden", "true");
  document.body.append(preview);
  const images = new Map();
  const frames = new Map();
  const decoded = new Map();
  let placement;
  let location = null;
  let requested = -1;
  let displayed = -1;
  let dismissed = -1;
  let generation = 0;
  let intentTimer;
  let leaveTimer;
  let keyboard = false;
  let requestKeyboard = false;
  let layout;
  let layoutKey = "";
  let enabled = false;

  const imageFor = (index) => {
    if (!images.has(index)) {
      const frame = document.createElement("div");
      frame.className = "publication-preview-frame";
      const image = sources[index].content.querySelector("img").cloneNode(true);
      image.draggable = false;
      frame.append(image);
      preview.append(frame);
      images.set(index, image);
      frames.set(index, frame);
    }
    return images.get(index);
  };

  const decodeImage = (index) => {
    if (!decoded.has(index)) {
      const ready = imageFor(index).decode().catch((error) => {
        decoded.delete(index);
        throw error;
      });
      decoded.set(index, ready);
    }
    return decoded.get(index);
  };
  const warmImages = () => {
    if (!enabled) return;
    sources.forEach((source, index) => {
      if (source) decodeImage(index).catch(() => {});
    });
  };

  const findLocation = (index) => {
    const protectedElements = [...document.querySelectorAll(".section-heading-row")];
    entries.forEach((entry, key) => {
      if (key !== index) protectedElements.push(...entry.querySelectorAll(
        ".publication-title-serif, .publication-bracket-links a",
      ));
    });
    return placePublicationPreview({
      ...layout,
      source: entries[index].getBoundingClientRect(),
      previousSide: location?.side,
      protectedRects: protectedElements.map((element) => element.getBoundingClientRect()),
    });
  };

  const setSource = (index, instant) => {
    entries.forEach((entry, key) => {
      entry.classList.toggle("is-preview-instant", instant);
      entry.classList.toggle("is-preview-active", key === index);
    });
    displayed = index;
  };
  const hide = (instant = false) => {
    clearTimeout(intentTimer);
    clearTimeout(leaveTimer);
    leaveTimer = undefined;
    generation += 1;
    requested = -1;
    keyboard = false;
    requestKeyboard = false;
    preview.classList.toggle("is-instant", instant);
    preview.classList.remove("is-visible");
    setSource(-1, instant);
  };
  const leave = () => {
    if (keyboard || leaveTimer) return;
    clearTimeout(intentTimer);
    generation += 1;
    requested = -1;
    leaveTimer = setTimeout(() => hide(), 150);
  };
  const show = (index, fromKeyboard = false) => {
    if (!enabled) return;
    clearTimeout(leaveTimer);
    leaveTimer = undefined;
    if ((index === requested && fromKeyboard === requestKeyboard) || index === dismissed) return;
    clearTimeout(intentTimer);
    requested = index;
    requestKeyboard = fromKeyboard;
    const ticket = ++generation;
    const reveal = async () => {
      try { await decodeImage(index); } catch {
        if (ticket === generation) hide();
        return;
      }
      if (ticket !== generation || !enabled) return;
      const next = findLocation(index);
      if (!next) { reset(); updateLayout(); return; } // Only possible after a stale layout.
      keyboard = fromKeyboard;
      const instant = keyboard || reducedMotion.matches;
      preview.classList.toggle("is-instant", instant);
      const style = getComputedStyle(preview);
      // On a fully hidden opening only the outer window fades. Image swaps
      // during an interrupted exit keep their current opacity and crossfade.
      const opening = Number(style.opacity) === 0;
      preview.classList.toggle("is-preparing", opening);
      const transform = `translate(${next.x}px, ${next.y}px)`;
      if (instant || !location || location.x !== next.x || location.y !== next.y) {
        // Retarget from the rendered transform so rapid reversals never restart
        // from an old endpoint. WAAPI avoids inline layout styles.
        const current = style.transform;
        const moving = location && preview.classList.contains("is-visible") && !instant;
        placement?.cancel();
        placement = preview.animate([
          { transform: moving ? current : transform }, { transform },
        ], {
          duration: moving ? parseFloat(style.getPropertyValue("--publication-motion-duration")) : 0,
          easing: style.getPropertyValue("--publication-motion-ease").trim(),
          fill: "forwards",
        });
      }
      location = next;
      // Establish the hidden starting state of a newly inserted image frame.
      preview.getBoundingClientRect();
      frames.forEach((frame, key) => frame.classList.toggle("is-current", key === index));
      if (opening) {
        preview.getBoundingClientRect();
        preview.classList.remove("is-preparing");
      }
      setSource(index, instant);
      preview.classList.add("is-visible");
    };
    if (fromKeyboard || preview.classList.contains("is-visible")) reveal();
    else intentTimer = setTimeout(reveal, 75);
  };

  const groups = [...new Set(entries.map((entry) => entry.parentElement))];
  groups.forEach((group) => {
    group.addEventListener("pointerenter", () => {
      if (finePointer.matches) warmImages();
    }, { passive: true });
    group.addEventListener("focusin", warmImages);
    group.addEventListener("pointermove", (event) => {
      if (!finePointer.matches || !["mouse", "pen"].includes(event.pointerType)) return;
      const index = entries.indexOf(event.target.closest(".editorial-publication-item"));
      if (index < 0 || !sources[index]) { leave(); return; }
      if (index !== dismissed) dismissed = -1;
      show(index);
    }, { passive: true });
    group.addEventListener("pointerleave", () => { dismissed = -1; leave(); });
  });
  const focusedIndex = (target) => {
    const link = target?.closest(".publication-bracket-links a");
    const index = entries.indexOf(link?.closest(".editorial-publication-item"));
    return index >= 0 && sources[index] ? index : -1;
  };
  document.addEventListener("focusin", (event) => {
    const index = focusedIndex(event.target);
    if (index >= 0 && event.target.matches(":focus-visible")) {
      dismissed = -1;
      show(index, true);
    } else if (keyboard || requestKeyboard) hide(true);
  });
  document.addEventListener("focusout", (event) => {
    if ((keyboard || requestKeyboard) && focusedIndex(event.relatedTarget) < 0) hide(true);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      dismissed = requested >= 0 ? requested : displayed;
      hide(true);
      keyboard = false;
    }
  });
  const reset = () => { hide(true); location = null; keyboard = false; dismissed = -1; };
  const header = document.querySelector(".site-header");
  const updateLayout = () => {
    const size = preview.getBoundingClientRect();
    const entrySizes = entries.filter((entry, index) => sources[index])
      .map((entry) => {
        const rect = entry.getBoundingClientRect();
        return [rect.width, rect.height];
      });
    const next = {
      viewportWidth: document.documentElement.clientWidth,
      top: Math.max(12, (header?.getBoundingClientRect().bottom || 0) + 12),
      bottom: innerHeight - 12,
      width: size.width,
      height: size.height,
      maxEntryHeight: Math.max(...entrySizes.map((size) => size[1])),
    };
    const key = JSON.stringify([next, entrySizes]);
    if (key === layoutKey) return;
    reset();
    layout = next;
    layoutKey = key;
    enabled = canShowPublicationPreview(layout);
  };
  updateLayout();
  const observer = new ResizeObserver(updateLayout);
  [preview, header, ...groups, ...entries].filter(Boolean).forEach((element) => observer.observe(element));
  document.fonts.ready.then(updateLayout);
  document.fonts.addEventListener("loadingdone", updateLayout);
  window.addEventListener("scroll", reset, { passive: true, capture: true });
  window.addEventListener("resize", updateLayout);
  window.addEventListener("blur", reset);
  document.addEventListener("visibilitychange", reset);
  finePointer.addEventListener("change", reset);
  reducedMotion.addEventListener("change", reset);
}
