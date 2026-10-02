const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
const entries = [...document.querySelectorAll(".service-event")].flatMap((event) => {
  const link = event.querySelector("a[aria-describedby]");
  const tooltip = event.querySelector(".service-event-tooltip");
  return link && tooltip ? [{ link, tooltip, pointer: false, focus: false, overTooltip: false, dismissed: false }] : [];
});
let active = null;
let hideTimer;
let focusFrame = null;

const cancelFocus = () => {
  if (focusFrame !== null) cancelAnimationFrame(focusFrame);
  focusFrame = null;
};

const eligible = () => finePointer.matches && innerWidth >= 1024;
const occupied = (entry) => entry.pointer || entry.focus || entry.overTooltip;
const clearTimers = () => {
  clearTimeout(hideTimer);
};
const hide = (instant = false) => {
  clearTimers();
  if (!active) return;
  active.tooltip.classList.toggle("is-instant", instant);
  active.tooltip.classList.remove("is-open");
  active.overTooltip = false;
  active = null;
};
const show = (entry, keyboard = false) => {
  clearTimers();
  if (!eligible() || entry.dismissed || !occupied(entry)) return;
  if (active && active !== entry) hide(true);
  entry.tooltip.classList.toggle("is-instant", keyboard);
  entry.tooltip.classList.add("is-open");
  active = entry;
};
const leave = (entry, keyboard = false) => {
  if (occupied(entry)) return;
  entry.dismissed = false;
  if (active !== entry) return;
  clearTimeout(hideTimer);
  if (keyboard) hide(true);
  else hideTimer = setTimeout(() => hide(), 150);
};

entries.forEach((entry) => {
  entry.link.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "touch" || !eligible()) return;
    if (!occupied(entry)) entry.dismissed = false;
    entry.pointer = true;
    clearTimers();
    if (entry.dismissed) return;
    show(entry);
  });
  entry.link.addEventListener("pointerleave", () => {
    entry.pointer = false;
    leave(entry);
  });
  entry.tooltip.addEventListener("pointerenter", () => {
    entry.overTooltip = true;
    clearTimeout(hideTimer);
  });
  entry.tooltip.addEventListener("pointerleave", () => {
    entry.overTooltip = false;
    leave(entry);
  });
  entry.link.addEventListener("focus", () => {
    if (!occupied(entry)) entry.dismissed = false;
    entry.focus = true;
    cancelFocus();
    if (entry.link.matches(":focus-visible")) {
      // Focus may scroll its link into view. Show after that scroll, without
      // treating the browser's focus scroll as a request to dismiss the tooltip.
      focusFrame = requestAnimationFrame(() => {
        focusFrame = null;
        if (entry.focus) show(entry, true);
      });
    }
  });
  entry.link.addEventListener("blur", () => {
    cancelFocus();
    entry.focus = false;
    leave(entry, true);
  });
});

const dismiss = () => {
  cancelFocus();
  entries.forEach((entry) => {
    if (occupied(entry)) entry.dismissed = true;
  });
  hide(true);
};
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") dismiss();
});
window.addEventListener("scroll", () => {
  if (focusFrame !== null) hide(true);
  else dismiss();
}, { capture: true, passive: true });
window.addEventListener("resize", dismiss);
window.addEventListener("blur", () => {
  dismiss();
  entries.forEach((entry) => { entry.pointer = false; entry.overTooltip = false; });
});
finePointer.addEventListener("change", dismiss);
