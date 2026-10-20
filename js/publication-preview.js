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
  let eligible = false;
  let navigating = false;

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
    if (!eligible) return;
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
    if (navigating) return;
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
    if (navigating) return;
    if (keyboard || leaveTimer) return;
    clearTimeout(intentTimer);
    generation += 1;
    requested = -1;
    leaveTimer = setTimeout(() => hide(), 150);
  };
  const show = (index, fromKeyboard = false) => {
    if (document.documentElement.classList.contains("project-returned")) return;
    if (!eligible || navigating) return;
    clearTimeout(leaveTimer);
    leaveTimer = undefined;
    if ((index === requested && fromKeyboard === requestKeyboard) || index === dismissed) return;
    clearTimeout(intentTimer);
    requested = index;
    requestKeyboard = fromKeyboard;
    const ticket = ++generation;
    const unavailable = () => {
      hide(true);
      // Remember this attempt, including its input mode, until leave/reset or
      // another entry is requested. Pointer moves must not retry every frame.
      requested = index;
      requestKeyboard = fromKeyboard;
    };
    const reveal = async () => {
      if (!findLocation(index)) { unavailable(); return; }
      try { await decodeImage(index); } catch {
        if (ticket === generation) hide();
        return;
      }
      if (ticket !== generation || !eligible) return;
      const next = findLocation(index);
      if (!next) { unavailable(); return; }
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
      if (document.documentElement.classList.contains("project-returned")) {
        if (!event.movementX && !event.movementY) return;
        document.documentElement.classList.remove("project-returned");
      }
      if (!finePointer.matches || !["mouse", "pen"].includes(event.pointerType)) return;
      const index = entries.indexOf(event.target.closest(".editorial-publication-item"));
      if (index < 0 || !sources[index]) { leave(); return; }
      if (index !== dismissed) dismissed = -1;
      show(index);
    }, { passive: true });
    group.addEventListener("pointerleave", () => { dismissed = -1; leave(); });
  });
  document.addEventListener("click", async (event) => {
    const link = event.target.closest(".publication-project-link");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey
      || event.ctrlKey || event.shiftKey || event.altKey || link.target) return;
    if (navigating) { event.preventDefault(); return; }
    if (!event.detail || !finePointer.matches || reducedMotion.matches || !eligible) return;
    const index = entries.indexOf(link.closest(".editorial-publication-item"));
    if (index < 0 || !sources[index] || !findLocation(index)) return;
    const image = imageFor(index);
    // Never hold navigation for a cold or broken image.
    if (!image.complete || !image.naturalWidth) return;
    event.preventDefault();
    const alreadyVisible = displayed === index && Number(getComputedStyle(preview).opacity) > 0.95;
    clearTimeout(intentTimer);
    clearTimeout(leaveTimer);
    generation += 1;
    const point = findLocation(index);
    if (!point) { locationAssign(); return; }
    const currentTransform = getComputedStyle(preview).transform;
    placement?.cancel();
    placement = preview.animate([
      { transform: alreadyVisible ? currentTransform : `translate(${point.x}px, ${point.y}px)` },
    ], { duration: 0, fill: "forwards" });
    frames.forEach((frame, key) => frame.classList.toggle("is-current", key === index));
    setSource(index, false);
    preview.classList.remove("is-instant", "is-preparing");
    preview.classList.add("is-launching");
    preview.getBoundingClientRect();
    preview.classList.add("is-visible");
    navigating = true;
    // Let :active release back to hover before navigation captures the page.
    // The preview's 100ms entrance runs concurrently with the 140ms release.
    await new Promise((resolve) => setTimeout(resolve, 140));
    const rect = preview.getBoundingClientRect();
    try {
      sessionStorage.setItem("dodgeui-transition", JSON.stringify({
        time: Date.now(), from: window.location.href, to: link.href,
        image: image.currentSrc || image.src,
        contain: image.classList.contains("publication-preview-image--contain"),
        x: rect.x, y: rect.y, width: rect.width, height: rect.height,
        native: "onpageswap" in window && "onpagereveal" in window,
      }));
      document.documentElement.classList.add("project-departing");
    } catch { /* Navigation still works when storage is unavailable. */ }
    locationAssign();
    function locationAssign() { window.location.assign(link.href); }
  });
  window.addEventListener("pageshow", () => {
    navigating = false;
    preview.classList.remove("is-launching");
    hide(true);
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
    if (event.key === "Tab") document.documentElement.classList.remove("project-returned");
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
    };
    const key = JSON.stringify([next, entrySizes]);
    if (key === layoutKey) return;
    reset();
    layout = next;
    layoutKey = key;
    eligible = canShowPublicationPreview(layout);
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
