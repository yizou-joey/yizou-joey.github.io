// Stationary artwork for desktop scrolling; inline images remain the fallback.
export function createNewsSticker({ shell, region, list, reducedMotionMedia, getActiveItemIndex }) {
  const stage = document.createElement("div");
  stage.className = "news-sticker-stage news-mascot-column";
  stage.hidden = true;
  shell.append(stage);
  let enabled = false;
  let currentIndex = -1;
  let targetIndex = -1;
  let revision = 0;
  let primaryAnimation = null;
  let opacityAnimation = null;
  let timer = 0;
  let keyboardMode = false;
  let lastScrollTop = region.scrollTop;
  let phase = "idle";
  const hoverMedia = window.matchMedia("(hover: hover) and (pointer: fine)");
  // easeOutBack from easings.net / postcss-easings: one continuous overshoot.
  const EASE_REBOUND = "cubic-bezier(0.34, 1.56, 0.64, 1)";
  const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

  const imageAt = (index) => list.children[index]?.querySelector(".news-mascot-sticker");
  const landingTransform = (image) => getComputedStyle(image).getPropertyValue(
    stage.classList.contains("is-venue-hover") ? "--news-sticker-link" : "--news-sticker-rest"
  ).trim();
  const trackEntry = (motion) => {
    primaryAnimation = motion;
    motion.finished.then(() => {
      if (primaryAnimation !== motion) return;
      primaryAnimation = null;
      phase = "idle";
      targetIndex = -1;
    }).catch(() => {});
  };
  const trackTransform = (image, frames, duration, easing) => {
    trackEntry(image.animate(frames, { duration, easing }));
  };
  const setKeyboardMode = (value) => {
    keyboardMode = value;
    shell.classList.toggle("has-keyboard-motion", value);
  };
  const retarget = () => {
    const image = stage.firstElementChild;
    if (!image) return;
    const from = getComputedStyle(image).transform;
    primaryAnimation?.cancel();
    if (keyboardMode) {
      opacityAnimation?.cancel();
      primaryAnimation = null;
      phase = "idle";
      targetIndex = -1;
      return;
    }
    trackTransform(image, [{ transform: from }, { transform: landingTransform(image) }], 160, EASE_OUT);
  };
  const updateLink = () => {
    const item = list.children[currentIndex];
    const active = Boolean(item?.querySelector(".news-venue-link:focus-visible") ||
      (hoverMedia.matches && item?.querySelector(".news-venue-link:hover")));
    const changed = stage.classList.contains("is-venue-hover") !== active;
    stage.classList.toggle("is-venue-hover", active);
    if (changed && phase === "enter" && !reducedMotionMedia.matches) retarget();
  };
  const cancel = () => {
    revision++;
    clearTimeout(timer);
    primaryAnimation?.cancel();
    opacityAnimation?.cancel();
    opacityAnimation = null;
    primaryAnimation = null;
    targetIndex = -1;
    phase = "idle";
  };
  const copy = (index) => {
    const image = imageAt(index)?.cloneNode();
    if (image) image.loading = "eager";
    return image;
  };
  const replace = (index, image = copy(index)) => {
    stage.replaceChildren();
    if (image) stage.append(image);
    currentIndex = index;
    updateLink();
  };
  const swap = async (index) => {
    if (!enabled || index === targetIndex || (index === currentIndex && targetIndex === -1)) return;
    const oldImage = stage.firstElementChild;
    const styles = oldImage && getComputedStyle(oldImage);
    const from = styles && (reducedMotionMedia.matches
      ? { opacity: styles.opacity }
      : { opacity: styles.opacity, transform: styles.transform });
    cancel();
    targetIndex = index;
    const token = revision;
    if (keyboardMode) {
      replace(index);
      targetIndex = -1;
      return;
    }
    const nextImage = copy(index);
    // Decode during the exit, not after a scroll-settle delay.
    const ready = nextImage ? nextImage.decode().catch(() => {}) : Promise.resolve();
    if (oldImage) {
      phase = "exit";
      primaryAnimation = oldImage.animate([from, { ...from, opacity: 0 }], {
        duration: 100, easing: EASE_OUT, fill: "forwards",
      });
      await Promise.all([primaryAnimation.finished.catch(() => {}), ready]);
    } else await ready;
    if (token !== revision || !enabled) return;
    primaryAnimation?.cancel();
    replace(index, nextImage);
    if (!nextImage) {
      primaryAnimation = null;
      phase = "idle";
      targetIndex = -1;
      return;
    }
    phase = "enter";
    // Opacity has no overshoot; the transform follows a single continuous curve.
    opacityAnimation = nextImage.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 125, easing: EASE_OUT,
    });
    if (reducedMotionMedia.matches) {
      trackEntry(opacityAnimation);
    } else {
      trackTransform(nextImage, [
        { transform: "rotate(-8deg) scale(0.94) translateY(0)" },
        { transform: landingTransform(nextImage) },
      ], 250, EASE_REBOUND);
    }
  };
  const settle = () => {
    clearTimeout(timer);
    if (!enabled) return;
    swap(getActiveItemIndex());
  };
  region.addEventListener("scroll", () => {
    if (!enabled || region.scrollTop === lastScrollTop) return;
    lastScrollTop = region.scrollTop;
    clearTimeout(timer);
    // Manual scrolling keeps the old sticker visible until a destination is known.
    timer = window.setTimeout(settle, 80);
  }, { passive: true });
  region.addEventListener("scrollend", settle);
  shell.addEventListener("keydown", () => {
    setKeyboardMode(true);
  });
  shell.addEventListener("pointerdown", () => {
    setKeyboardMode(false);
  });
  region.addEventListener("wheel", () => {
    setKeyboardMode(false);
  }, { passive: true });
  list.addEventListener("pointerover", () => {
    if (!hoverMedia.matches) return;
    setKeyboardMode(false);
  });
  for (const event of ["pointerover", "pointerout", "focusin", "focusout", "keyup"]) {
    list.addEventListener(event, () => requestAnimationFrame(updateLink));
  }
  hoverMedia.addEventListener("change", updateLink);
  reducedMotionMedia.addEventListener("change", () => {
    const index = targetIndex === -1 ? getActiveItemIndex() : targetIndex;
    cancel();
    if (enabled) replace(index);
  });
  return {
    start(index) {
      if (!enabled || !Number.isInteger(index) || index < 0 || index >= list.children.length) return;
      swap(index);
    },
    sync() {
      cancel();
      lastScrollTop = region.scrollTop;
      enabled = region.classList.contains("is-scrollable");
      shell.classList.toggle("has-stationary-sticker", enabled);
      stage.hidden = !enabled;
      if (enabled) {
        stage.style.blockSize = `${list.children[0]?.getBoundingClientRect().height || 0}px`;
        replace(getActiveItemIndex());
      } else {
        stage.replaceChildren();
        currentIndex = -1;
      }
    },
  };
}
