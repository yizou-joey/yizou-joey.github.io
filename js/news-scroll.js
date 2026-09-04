const DESKTOP_QUERY = "(min-width: 900px)";
const MOBILE_VISIBLE_ITEMS = 2;
const SCROLL_END_TOLERANCE = 2;

const panel = document.querySelector(".profile-news-panel");
const profileLayout = document.querySelector(".profile-intro-layout");
const profileMain = document.querySelector(".profile-main");
const shell = panel?.querySelector("[data-news-scroll-shell]");
const region = panel?.querySelector("[data-news-scroll-region]");
const list = panel?.querySelector("#news-list");
const control = panel?.querySelector("[data-news-scroll-control]");

if (panel && profileLayout && profileMain && shell && region && list && control) {
  const desktopMedia = window.matchMedia(DESKTOP_QUERY);
  const reducedMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
  let mobileExpanded = false;
  let desktopViewportBudget = 0;
  let desktopControlTarget = null;
  let layoutFrame = 0;

  const getItems = () => Array.from(list.children);

  const getPixelToken = (name, fallback) => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name);
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const getRegionPadding = () => {
    const styles = getComputedStyle(region);
    return {
      top: Number.parseFloat(styles.paddingTop) || 0,
      bottom: Number.parseFloat(styles.paddingBottom) || 0,
    };
  };

  const clearManagedItemVisibility = () => {
    for (const item of getItems()) {
      if (item.dataset.newsMobileHidden === "true") {
        item.hidden = false;
        delete item.dataset.newsMobileHidden;
      }
    }
  };

  const resetDesktopScroll = () => {
    desktopViewportBudget = 0;
    desktopControlTarget = null;
    profileLayout.style.minBlockSize = "";
    region.style.blockSize = "";
    list.style.removeProperty("--news-item-block-size");
    region.scrollTop = 0;
    region.classList.remove("is-scrollable");
    shell.classList.remove("is-scrollable");
    region.removeAttribute("tabindex");
    region.removeAttribute("role");
    region.removeAttribute("aria-labelledby");
  };

  const setControl = ({ hidden, pointsUp, label, expanded }) => {
    control.hidden = hidden;
    control.classList.toggle("is-up", pointsUp);
    control.setAttribute("aria-label", label);
    if (typeof expanded === "boolean") {
      control.setAttribute("aria-expanded", String(expanded));
    } else {
      control.removeAttribute("aria-expanded");
    }
  };

  const getLeadingItemIndex = () => {
    const items = getItems();
    if (!items.length || !region.classList.contains("is-scrollable")) return 0;

    const padding = getRegionPadding();
    const viewportTop = region.getBoundingClientRect().top + padding.top;
    const index = items.findIndex(
      (item) => item.getBoundingClientRect().bottom > viewportTop + SCROLL_END_TOLERANCE
    );
    return index === -1 ? Math.max(items.length - 1, 0) : index;
  };

  const updateDesktopControl = () => {
    if (!region.classList.contains("is-scrollable")) return;
    const maxScroll = Math.max(region.scrollHeight - region.clientHeight, 0);
    const atEnd = region.scrollTop >= maxScroll - SCROLL_END_TOLERANCE;
    const atStart = region.scrollTop <= SCROLL_END_TOLERANCE;

    if (desktopControlTarget === "end") {
      if (atEnd) desktopControlTarget = null;
      setControl({ hidden: false, pointsUp: true, label: "Back to latest news" });
      return;
    }

    if (desktopControlTarget === "start") {
      if (atStart) desktopControlTarget = null;
      setControl({ hidden: false, pointsUp: false, label: "Show older news" });
      return;
    }

    setControl({
      hidden: false,
      pointsUp: atEnd,
      label: atEnd ? "Back to latest news" : "Show older news",
    });
  };

  const measureControlSpace = () => {
    const wasHidden = control.hidden;
    const previousVisibility = control.style.visibility;
    control.hidden = false;
    control.style.visibility = "hidden";

    const shellStyles = getComputedStyle(shell);
    const gap = Number.parseFloat(shellStyles.rowGap) || 0;
    const height = control.getBoundingClientRect().height;

    control.hidden = wasHidden;
    control.style.visibility = previousVisibility;
    return height + gap;
  };

  const getDesktopScrollTop = (items, startIndex) => {
    const padding = getRegionPadding();
    const regionRect = region.getBoundingClientRect();
    const startItem = items[startIndex];
    const startRect = startItem.getBoundingClientRect();
    const startTop = startRect.top - regionRect.top + region.scrollTop;
    return startTop - padding.top;
  };

  const showDesktopPage = (startIndex) => {
    const items = getItems();
    if (!items.length || !region.classList.contains("is-scrollable")) return;

    const safeStartIndex = Math.min(Math.max(startIndex, 0), items.length - 1);
    scrollRegion(getDesktopScrollTop(items, safeStartIndex));
  };

  const layoutDesktop = () => {
    const items = getItems();
    const leadingItemIndex = getLeadingItemIndex();

    clearManagedItemVisibility();
    resetDesktopScroll();
    setControl({ hidden: true, pointsUp: false, label: "Show older news" });

    if (!items.length) return;

    shell.classList.add("is-scrollable");
    region.classList.add("is-scrollable");

    const regionRect = region.getBoundingClientRect();
    const padding = getRegionPadding();
    const allowance = getPixelToken("--space-48", 48);
    const availableHeight = Math.max(
      profileMain.getBoundingClientRect().bottom + allowance - regionRect.top,
      0
    );
    const itemBottoms = items.map(
      (item) => item.getBoundingClientRect().bottom - regionRect.top + padding.bottom
    );
    const maximumItemContentHeight = Math.ceil(
      Math.max(...items.map((item) => item.getBoundingClientRect().height))
    );
    const maximumItemHeight = padding.top + maximumItemContentHeight + padding.bottom;
    const fullContentHeight = itemBottoms[itemBottoms.length - 1];

    if (items.length === 1 || fullContentHeight <= availableHeight + SCROLL_END_TOLERANCE) {
      resetDesktopScroll();
      return;
    }

    const controlSpace = measureControlSpace();
    const maximumViewportBudget = Math.max(availableHeight - controlSpace, maximumItemHeight);
    const listGap = Number.parseFloat(getComputedStyle(list).rowGap) || 0;
    const availableContentHeight = maximumViewportBudget - padding.top - padding.bottom;
    const visibleItemCount = Math.min(
      items.length,
      Math.max(
        1,
        Math.floor(
          (availableContentHeight + listGap + SCROLL_END_TOLERANCE) /
            (maximumItemContentHeight + listGap)
        )
      )
    );
    desktopViewportBudget =
      padding.top +
      visibleItemCount * maximumItemContentHeight +
      Math.max(visibleItemCount - 1, 0) * listGap +
      padding.bottom;
    list.style.setProperty("--news-item-block-size", `${maximumItemContentHeight}px`);
    const reservedBottom = regionRect.top + desktopViewportBudget + controlSpace;
    const layoutRect = profileLayout.getBoundingClientRect();
    profileLayout.style.minBlockSize = `${Math.ceil(reservedBottom - layoutRect.top)}px`;

    region.style.blockSize = `${Math.ceil(desktopViewportBudget)}px`;
    region.setAttribute("tabindex", "0");
    region.setAttribute("role", "region");
    region.setAttribute("aria-labelledby", "news-heading");
    setControl({ hidden: false, pointsUp: false, label: "Show older news" });

    region.scrollTop = getDesktopScrollTop(
      items,
      Math.min(leadingItemIndex, items.length - 1)
    );
    updateDesktopControl();
  };

  const layoutMobile = () => {
    const items = getItems();
    resetDesktopScroll();
    clearManagedItemVisibility();

    const hasOlderItems = items.length > MOBILE_VISIBLE_ITEMS;
    if (!hasOlderItems) {
      mobileExpanded = false;
      setControl({
        hidden: true,
        pointsUp: false,
        label: "Show older news",
        expanded: false,
      });
      return;
    }

    if (!mobileExpanded) {
      items.slice(MOBILE_VISIBLE_ITEMS).forEach((item) => {
        item.hidden = true;
        item.dataset.newsMobileHidden = "true";
      });
    }

    setControl({
      hidden: false,
      pointsUp: mobileExpanded,
      label: mobileExpanded ? "Show fewer news" : "Show older news",
      expanded: mobileExpanded,
    });
  };

  const layout = () => {
    if (desktopMedia.matches) {
      layoutDesktop();
    } else {
      layoutMobile();
    }
  };

  const queueLayout = () => {
    window.cancelAnimationFrame(layoutFrame);
    layoutFrame = window.requestAnimationFrame(layout);
  };

  const scrollRegion = (top) => {
    region.scrollTo({
      top,
      behavior: reducedMotionMedia.matches ? "auto" : "smooth",
    });
  };

  control.addEventListener("click", () => {
    if (!desktopMedia.matches) {
      mobileExpanded = !mobileExpanded;
      layoutMobile();
      if (!mobileExpanded) {
        panel.scrollIntoView({
          behavior: reducedMotionMedia.matches ? "auto" : "smooth",
          block: "start",
        });
      }
      return;
    }

    const maxScroll = Math.max(region.scrollHeight - region.clientHeight, 0);
    const atEnd = region.scrollTop >= maxScroll - SCROLL_END_TOLERANCE;
    if (atEnd) {
      desktopControlTarget = "start";
      setControl({ hidden: false, pointsUp: false, label: "Show older news" });
      showDesktopPage(0);
      return;
    }

    const padding = getRegionPadding();
    const viewportBottom = region.getBoundingClientRect().bottom - padding.bottom;
    const items = getItems();
    const nextItem = items.find(
      (item) => item.getBoundingClientRect().bottom > viewportBottom + SCROLL_END_TOLERANCE
    );
    if (nextItem) {
      const nextItemIndex = items.indexOf(nextItem);
      const targetScroll = Math.min(getDesktopScrollTop(items, nextItemIndex), maxScroll);
      if (targetScroll >= maxScroll - SCROLL_END_TOLERANCE) {
        desktopControlTarget = "end";
        setControl({ hidden: false, pointsUp: true, label: "Back to latest news" });
      }
      showDesktopPage(nextItemIndex);
    } else {
      desktopControlTarget = "end";
      setControl({ hidden: false, pointsUp: true, label: "Back to latest news" });
      scrollRegion(maxScroll);
    }
  });

  region.addEventListener("scroll", () => {
    if (!desktopMedia.matches || !region.classList.contains("is-scrollable")) return;
    updateDesktopControl();
  }, { passive: true });

  desktopMedia.addEventListener("change", () => {
    mobileExpanded = false;
    queueLayout();
  });

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(queueLayout);
    resizeObserver.observe(profileMain);
    resizeObserver.observe(list);
  } else {
    window.addEventListener("resize", queueLayout, { passive: true });
  }

  for (const image of list.querySelectorAll("img")) {
    if (!image.complete) image.addEventListener("load", queueLayout, { once: true });
  }

  document.fonts?.ready.then(queueLayout);
  queueLayout();
}
