const panel = document.querySelector(".profile-news-panel");

if (panel) {
  const region = panel.querySelector("[data-news-scroll-region]");
  const list = panel.querySelector("#news-list");
  const control = panel.querySelector("[data-news-scroll-control]");
  const navigation = panel.querySelector(".news-navigation");
  const previous = panel.querySelector("[data-news-previous]");
  const next = panel.querySelector("[data-news-next]");
  const desktop = window.matchMedia("(min-width: 900px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let expanded = false;

  const updateNavigation = () => {
    const maximum = region.scrollWidth - region.clientWidth;
    navigation.hidden = !desktop.matches || maximum <= 2;
    previous.setAttribute("aria-disabled", String(region.scrollLeft <= 2));
    next.setAttribute("aria-disabled", String(region.scrollLeft >= maximum - 2));
    if (desktop.matches && maximum > 2) {
      region.setAttribute("tabindex", "0");
      region.setAttribute("role", "region");
      region.setAttribute("aria-labelledby", "news-heading");
    } else {
      region.removeAttribute("tabindex");
      region.removeAttribute("role");
      region.removeAttribute("aria-labelledby");
    }
  };

  const layout = () => {
    const items = Array.from(list.children);
    items.forEach((item, index) => {
      item.hidden = !desktop.matches && !expanded && index >= 2;
    });
    control.hidden = desktop.matches || items.length <= 2;
    control.classList.toggle("is-up", expanded);
    control.setAttribute("aria-expanded", String(expanded));
    control.setAttribute("aria-label", expanded ? "Show fewer news" : "Show older news");
    updateNavigation();
  };

  const move = (direction) => {
    const button = direction > 0 ? next : previous;
    if (button.getAttribute("aria-disabled") === "true") return;
    const items = Array.from(list.children);
    const positions = items.map((item) =>
      item.getBoundingClientRect().left - region.getBoundingClientRect().left + region.scrollLeft
    );
    const target = direction > 0
      ? positions.find((position) => position > region.scrollLeft + 2)
      : positions.findLast((position) => position < region.scrollLeft - 2);
    region.scrollTo({
      left: target ?? (direction > 0 ? region.scrollWidth : 0),
      behavior: reducedMotion.matches ? "instant" : "smooth",
    });
    updateNavigation();
  };

  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  control.addEventListener("click", () => {
    expanded = !expanded;
    layout();
    if (!expanded) panel.scrollIntoView({
      behavior: reducedMotion.matches ? "auto" : "smooth",
      block: "start",
    });
  });
  region.addEventListener("scroll", updateNavigation, { passive: true });
  desktop.addEventListener("change", () => {
    expanded = false;
    region.scrollLeft = 0;
    layout();
  });
  if ("ResizeObserver" in window) {
    new ResizeObserver(updateNavigation).observe(region);
  } else {
    window.addEventListener("resize", updateNavigation, { passive: true });
  }
  new MutationObserver(layout).observe(list, { childList: true });
  document.fonts?.ready.then(updateNavigation);
  layout();
}
