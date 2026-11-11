const section = document.querySelector("#recent-news[data-news-disclosure]");
const list = section?.querySelector("#news-list");
const toggle = section?.querySelector("[data-news-toggle]");

if (list && toggle) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let expanded = false;
  let animations = [];
  let collapsing = false;

  const entries = () => Array.from(list.children).filter((item) => item.matches("li.news-entry"));
  const keepToggleVisible = () => {
    if (!expanded && !toggle.hidden && toggle.getBoundingClientRect().top < 0) {
      toggle.scrollIntoView({ block: "nearest", behavior: "instant" });
    }
  };
  const cancelAnimations = () => {
    for (const animation of animations) {
      animation.onfinish = null;
      animation.cancel();
    }
    animations = [];
  };
  const focusList = () => {
    const tabIndex = list.getAttribute("tabindex");
    list.setAttribute("tabindex", "-1");
    list.focus({ preventScroll: true });
    if (tabIndex === null) list.removeAttribute("tabindex");
    else list.setAttribute("tabindex", tabIndex);
  };
  const render = () => {
    const items = entries();
    const hasOlder = items.length > 3;
    if (!hasOlder) expanded = false;
    // Move focus before hiding either an entry or the now-unnecessary control.
    if (!expanded && items.slice(3).some((item) => item.contains(document.activeElement))) {
      toggle.focus({ preventScroll: true });
    }
    if (!hasOlder && document.activeElement === toggle) focusList();
    items.forEach((item, index) => { item.hidden = !expanded && index >= 3; });
    toggle.hidden = !hasOlder;
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.textContent = expanded ? "SHOW LESS" : "SHOW OLDER NEWS";
  };
  const settle = () => {
    cancelAnimations();
    if (collapsing) keepToggleVisible();
    collapsing = false;
  };

  toggle.addEventListener("click", (event) => {
    // Capture the current interpolated height before cancelling a reversal.
    const fromHeight = getComputedStyle(list).height;
    cancelAnimations();
    collapsing = false;
    expanded = !expanded;
    render();
    const toHeight = getComputedStyle(list).height;
    if (event.detail === 0 || reducedMotion.matches || !list.animate || fromHeight === toHeight) {
      keepToggleVisible();
      return;
    }
    const easing = getComputedStyle(section).getPropertyValue("--news-disclosure-ease").trim()
      || "cubic-bezier(0.23, 1, 0.32, 1)";
    const options = { duration: 200, easing };
    collapsing = !expanded;
    const height = list.animate([
      { height: fromHeight, overflow: "clip" },
      { height: toHeight, overflow: "clip" },
    ], options);
    animations.push(height);
    // Only the extra entries fade: the first three never move within the list.
    if (expanded) {
      for (const item of entries().slice(3)) {
        animations.push(item.animate([{ opacity: 0 }, { opacity: 1 }], options));
      }
    }
    height.onfinish = settle;
  });

  reducedMotion.addEventListener("change", settle);
  window.addEventListener("resize", settle, { passive: true });
  if ("ResizeObserver" in window) {
    let width = list.getBoundingClientRect().width;
    new ResizeObserver(() => {
      const nextWidth = list.getBoundingClientRect().width;
      if (nextWidth !== width) {
        width = nextWidth;
        settle();
      }
    }).observe(list);
  }
  new MutationObserver(() => {
    cancelAnimations();
    render();
    if (collapsing) keepToggleVisible();
    collapsing = false;
  }).observe(list, { childList: true });
  render();
}
