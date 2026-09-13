// Inspired by Sanyam's Lab (see README.md), adapted to a quiet reading list.
// A shared safe lane and title feedback keep the preview connected to its paper.
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
    sources.forEach((source, index) => {
      if (source) decodeImage(index).catch(() => {});
    });
  };

  const findLocation = (index) => {
    const width = preview.offsetWidth;
    const height = preview.offsetHeight;
    const headerBottom = document.querySelector(".site-header")?.getBoundingClientRect().bottom || 0;
    const topEdge = Math.max(12, headerBottom + 12);
    const rects = entries.map((entry) => entry.getBoundingClientRect())
      .filter((rect) => rect.bottom > topEdge && rect.top < innerHeight);
    if (!rects.length) return null;
    const safe = (point) => point && point.x >= 12 && point.y >= topEdge
      && point.x + width <= innerWidth - 12 && point.y + height <= innerHeight - 12
      && rects.every((rect) => point.x >= rect.right + 12 || point.x + width <= rect.left - 12
        || point.y >= rect.bottom + 12 || point.y + height <= rect.top - 12);
    const left = Math.min(...rects.map((rect) => rect.left));
    const right = Math.max(...rects.map((rect) => rect.right));
    const top = Math.min(...rects.map((rect) => rect.top));
    const bottom = Math.max(...rects.map((rect) => rect.bottom));
    const source = entries[index].getBoundingClientRect();
    const y = Math.max(topEdge, Math.min((source.top + source.bottom - height) / 2, innerHeight - height - 12));
    if (location) {
      // The entire vertical travel corridor stays outside every paper, not just
      // its endpoints. Never switch sides or cross reading text while visible.
      const inSideLane = location.x >= right + 12 || location.x + width <= left - 12;
      const next = { x: location.x, y };
      if (!reducedMotion.matches && inSideLane && safe(next)) return next;
      return safe(location) ? location : null;
    }
    const x = Math.max(12, Math.min(right - width, innerWidth - width - 12));
    return [
      { x: right + 12, y },
      { x: left - width - 12, y },
      { x, y: bottom + 12 },
      { x, y: top - height - 12 },
    ].find(safe) || null;
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
      if (ticket !== generation) return;
      const next = findLocation(index);
      if (!next) { hide(fromKeyboard); return; }
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
  window.addEventListener("scroll", reset, { passive: true, capture: true });
  window.addEventListener("resize", reset);
  window.addEventListener("blur", reset);
  document.addEventListener("visibilitychange", reset);
  finePointer.addEventListener("change", reset);
  reducedMotion.addEventListener("change", reset);
}
