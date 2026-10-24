// Parser-blocking head bootstrap, preceded by the critical opt-in CSS.
(() => {
  const key = "dodgeui-transition";
  const root = document.documentElement;
  const native = "onpageswap" in window && "onpagereveal" in window;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  let generation = 0;
  let activeTransition;
  const animations = [];
  const samePage = (left, right) => {
    try {
      const a = new URL(left), b = new URL(right);
      return a.origin === b.origin && a.pathname === b.pathname && a.search === b.search;
    } catch { return false; }
  };
  const readTransfer = () => {
    try { return JSON.parse(sessionStorage.getItem(key) || "null"); }
    catch { return null; }
  };
  const writeTransfer = (value) => {
    try {
      if (value) sessionStorage.setItem(key, JSON.stringify(value));
      else sessionStorage.removeItem(key);
    } catch { /* Transitions are optional; native navigation remains intact. */ }
  };
  const fresh = (value) => value && Date.now() - value.time >= 0 && Date.now() - value.time < 5000;
  const visible = (element) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0
      && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
  };
  const clean = () => {
    root.classList.remove("project-arriving", "project-departing", "project-return-arriving", "project-return-departing");
    document.querySelectorAll("[data-project-return-target]")
      .forEach((element) => element.removeAttribute("data-project-return-target"));
    animations.splice(0).forEach((animation) => animation.cancel());
  };
  const reset = () => {
    generation += 1;
    activeTransition?.skipTransition();
    activeTransition = null;
    clean();
    root.dataset.projectTransition = "idle";
    delete root.dataset.projectTransitionDirection;
    delete root.dataset.projectTransitionMode;
    delete root.dataset.projectTransitionSkippedReason;
    return generation;
  };
  const titleData = (title) => {
    const rect = title.getBoundingClientRect();
    return { height: rect.height, fontSize: getComputedStyle(title).fontSize };
  };
  const homeTitle = (project) => [...document.querySelectorAll(".publication-project-link")]
    .find((link) => samePage(link.href, project))?.closest(".publication-title-serif");
  const homeDestination = (url) => {
    try {
      const target = new URL(url);
      return target.origin === location.origin && ["/", "/index.html", "/publications.html"].includes(target.pathname);
    } catch { return false; }
  };

  // pageswap handles links, browser buttons and history traversal equally.
  // Never intercept history or alter scrollRestoration: the browser owns it.
  window.addEventListener("pageswap", (event) => {
    const pending = readTransfer();
    const token = reset();
    const transition = event.viewTransition;
    const destination = event.activation?.entry?.url;
    root.dataset.projectTransitionNavigationType = event.activation?.navigationType || "unknown";
    if (!native || reduced() || !transition || !destination) {
      root.dataset.projectTransitionSkippedReason = !native ? "unsupported" : reduced() ? "reduced-motion" : !transition ? "no-view-transition" : "no-destination";
      writeTransfer(null);
      transition?.skipTransition();
      return;
    }
    let transfer;
    const projectTitle = document.querySelector(".project-title");
    if (projectTitle && homeDestination(destination)) {
      transfer = {
        direction: "return", from: location.href, to: destination,
        project: location.href, title: visible(projectTitle) ? titleData(projectTitle) : null,
      };
      if (transfer.title) root.classList.add("project-return-departing");
    } else if (homeTitle(destination)) {
      // Only a click-prepared visible preview may become the shared image.
      // History forward must never manufacture a floating preview.
      const preview = document.querySelector(".publication-preview");
      const hasPreview = event.activation.navigationType !== "traverse"
        && fresh(pending) && samePage(pending.from, location.href)
        && samePage(pending.to, destination) && pending.image
        && visible(preview) && Number(getComputedStyle(preview).opacity) > 0.95;
      transfer = { direction: "enter", from: location.href, to: destination,
        ...(hasPreview ? { image: pending.image } : {}) };
      root.classList.remove("project-returned");
      if (hasPreview) root.classList.add("project-departing");
    }
    if (!transfer) {
      root.dataset.projectTransitionSkippedReason = "unrelated-route";
      writeTransfer(null);
      transition.skipTransition();
      return;
    }
    writeTransfer({ ...transfer, time: Date.now() });
    activeTransition = transition;
    // This document may enter BFCache. Remove snapshot names once capture ends.
    transition.finished.finally(() => {
      if (generation === token) { clean(); activeTransition = null; }
    }).catch(() => {});
  });

  window.addEventListener("pagereveal", (event) => {
    const token = reset();
    const transfer = readTransfer();
    writeTransfer(null);
    const transition = event.viewTransition;
    const activation = window.navigation?.activation;
    root.dataset.projectTransitionNavigationType = activation?.navigationType || "unknown";
    const valid = fresh(transfer) && samePage(transfer.to, location.href)
      && (!activation?.from?.url || samePage(transfer.from, activation.from.url));
    if (!native || reduced() || !transition || !valid) {
      root.dataset.projectTransitionSkippedReason = !native ? "unsupported" : reduced() ? "reduced-motion" : !transition ? "no-view-transition" : !transfer ? "no-transfer" : !fresh(transfer) ? "stale-transfer" : !samePage(transfer.to, location.href) ? "wrong-destination" : "wrong-source";
      transition?.skipTransition();
      return;
    }
    activeTransition = transition;
    root.dataset.projectTransitionDirection = transfer.direction;
    root.dataset.projectTransitionMode = "fade";
    let target;
    if (transfer.direction === "return") {
      // Suppress hover previews until the user moves the pointer after returning.
      root.classList.add("project-returned");
      target = homeTitle(transfer.project);
      if (transfer.title && visible(target)) {
        target.setAttribute("data-project-return-target", "");
        root.classList.add("project-return-arriving");
        root.dataset.projectTransitionMode = "title";
      }
    } else if (transfer.image && document.querySelector(".project-image-frame")) {
      root.classList.add("project-arriving");
      root.dataset.projectTransitionMode = "image";
    }
    root.dataset.projectTransition = "native-pending";
    transition.ready.then(() => {
      if (generation !== token) return;
      root.dataset.projectTransition = "native-ready";
      if (root.classList.contains("project-return-arriving")) {
        const source = transfer.title;
        const targetRect = target.getBoundingClientRect();
        const style = getComputedStyle(root);
        const scale = parseFloat(getComputedStyle(target).fontSize) / parseFloat(source.fontSize);
        // Preserve text aspect ratio even when the two titles wrap differently.
        for (const [name, height, from, to] of [
          ["old", source.height, 1, scale], ["new", targetRect.height, 1 / scale, 1],
        ]) {
          animations.push(root.animate([
            { height: `${height}px`, transformOrigin: "left top", transform: `scale(${from})` },
            { height: `${height}px`, transformOrigin: "left top", transform: `scale(${to})` },
          ], {
            pseudoElement: `::view-transition-${name}(project-title)`,
            duration: parseFloat(style.getPropertyValue("--project-title-duration")),
            easing: style.getPropertyValue("--project-title-ease").trim(), fill: "both",
          }));
        }
      }
    }).catch(() => {
      if (generation === token) {
        root.dataset.projectTransition = "native-skipped";
        clean();
      }
    });
    transition.finished.finally(() => {
      if (generation !== token) return;
      if (root.dataset.projectTransition !== "native-skipped") root.dataset.projectTransition = "native-finished";
      clean();
      activeTransition = null;
    }).catch(() => {});
  });
  // Swap/reveal own their state. A late pageshow must not cancel a transition.
  window.addEventListener("pagehide", () => {
    // Retain names until pageswap capture finishes; do not use unload handlers,
    // which would prevent BFCache on some browsers.
    if (!activeTransition) clean();
  });
})();

// Shared press feedback for project navigation and resource links.
(() => {
  // Touch browsers can defer :active until release. Show feedback on contact,
  // without capturing the pointer or changing scrolling and link navigation.
  const actionSelector = ".publication-bracket-links a";
  let pressed = null;

  const clearPress = () => {
    pressed?.link.classList.remove("is-touch-pressed");
    pressed = null;
  };

  document.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch") return;
    clearPress();
    const link = event.target.closest(actionSelector);
    if (!event.isPrimary || !link) return;
    pressed = { link, id: event.pointerId, x: event.clientX, y: event.clientY };
    link.classList.add("is-touch-pressed");
  }, { passive: true });

  document.addEventListener("pointermove", (event) => {
    if (pressed?.id !== event.pointerId) return;
    if (Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) > 8) clearPress();
  }, { passive: true });

  for (const type of ["pointerup", "pointercancel"]) {
    document.addEventListener(type, (event) => {
      if (pressed?.id === event.pointerId) clearPress();
    }, { passive: true });
  }
  window.addEventListener("blur", clearPress);
  window.addEventListener("pagehide", clearPress);
  document.addEventListener("scroll", clearPress, { capture: true, passive: true });
})();
