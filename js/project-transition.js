// Parser-blocking head bootstrap, preceded by the critical opt-in CSS.
(() => {
  const key = "dodgeui-transition";
  const returnFallbackKey = "project-return-native-unavailable";
  const root = document.documentElement;
  let transfer;
  try {
    transfer = JSON.parse(sessionStorage.getItem(key) || "null");
    sessionStorage.removeItem(key);
  } catch { /* Storage is optional. */ }
  const validTransfer = transfer && transfer.to === location.href
    && Date.now() - transfer.time < 5000;
  const returning = validTransfer && transfer.direction === "return";
  const arriving = validTransfer && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const contextKey = (url) => `project-return:${url}`;
  let returnTarget;
  let returningWithFallback = false;
  let returnPrepared = false;
  const prepareReturn = () => {
    if (!returning || returnPrepared) return;
    root.classList.add("project-returned");
    returnTarget = [...document.querySelectorAll(".publication-project-link")]
      .find((link) => link.href === transfer.project)?.closest(".publication-title-serif");
    if (!returnTarget) return;
    returnPrepared = true;
    returnTarget?.setAttribute("data-project-return-target", "");
    if (Number.isFinite(transfer.scrollY)) {
      window.scrollTo({ top: transfer.scrollY, left: 0, behavior: "instant" });
    } else if (returnTarget) {
      const top = returnTarget.getBoundingClientRect().top + window.scrollY;
      const header = document.querySelector(".site-header")?.getBoundingClientRect().height || 0;
      window.scrollTo({ top: Math.max(0, top - header - 32), behavior: "instant" });
    }
  };
  if (returning) {
    root.classList.add("project-returned");
    history.scrollRestoration = "manual";
  }
  document.addEventListener("click", (event) => {
    const link = event.target.closest(".publication-project-link, .project-back");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey
      || event.ctrlKey || event.shiftKey || event.altKey || link.target) return;
    if (link.matches(".publication-project-link")) {
      root.classList.remove("project-returned");
      try { sessionStorage.setItem(contextKey(link.href), JSON.stringify({ scrollY: window.scrollY })); }
      catch { /* Direct return still has a stable section target. */ }
      return;
    }
    let context;
    try {
      context = JSON.parse(sessionStorage.getItem(contextKey(location.href)) || "null");
      sessionStorage.removeItem(contextKey(location.href));
    }
    catch { /* Use the project title as the default landing position. */ }
    try {
      const title = document.querySelector(".project-title");
      const rect = title?.getBoundingClientRect();
      const style = title && getComputedStyle(title);
      const destination = new URL(link.href);
      destination.hash = "";
      returningWithFallback = sessionStorage.getItem(returnFallbackKey) === "true";
      sessionStorage.setItem(key, JSON.stringify({
        time: Date.now(), to: destination.href, returnUrl: link.href,
        project: location.href, direction: "return",
        scrollY: context?.scrollY,
        fallback: returningWithFallback,
        title: title && {
          text: title.textContent, x: rect.x, y: rect.y, width: rect.width,
          fontSize: style.fontSize, lineHeight: style.lineHeight,
          fontWeight: style.fontWeight, fontFamily: style.fontFamily,
          color: style.color,
        },
      }));
      root.classList.add("project-return-departing");
      event.preventDefault();
      location.assign(destination.href);
    } catch { /* Keep the ordinary link usable when storage is unavailable. */ }
  }, true);
  const native = "onpageswap" in window && "onpagereveal" in window;
  const returnCompatibility = returning && arriving && (!native || transfer.fallback);
  let state = "idle";
  let watchdog;
  let overlay;
  let targetOverlay;
  let nativeAnimations = Promise.resolve([]);
  const animations = [];
  const setState = (next) => {
    state = next;
    root.dataset.projectTransition = next;
  };
  const cleanup = () => {
    clearTimeout(watchdog);
    root.classList.remove("project-arriving", "project-fallback-arriving", "project-return-arriving", "project-return-fallback");
    returnTarget?.removeAttribute("data-project-return-target");
    if (returning) {
      history.scrollRestoration = "auto";
      if (transfer.returnUrl) history.replaceState(history.state, "", transfer.returnUrl);
    }
    overlay?.remove();
    targetOverlay?.remove();
    animations.forEach((animation) => animation.cancel());
  };
  const domReady = new Promise((resolve) => {
    if (document.readyState !== "loading") resolve();
    else document.addEventListener("DOMContentLoaded", resolve, { once: true });
  });

  domReady.then(() => { if (!returnCompatibility) prepareReturn(); });

  const fallback = async (reason = "unsupported") => {
    if (!arriving || state.startsWith("fallback") || state === "native-finished") return;
    const nativeStarted = state === "native-pending" || state === "native-ready";
    root.dataset.projectFallbackReason = reason;
    // A rejected/cancelled native transition may already have revealed the page.
    // Never hide it again or replay a fade from zero.
    if (returning && (nativeStarted || reason !== "unsupported")) {
      if (reason.startsWith("native-")) {
        try { sessionStorage.setItem(returnFallbackKey, "true"); }
        catch { /* Use native navigation again when storage is unavailable. */ }
      }
      setState("fallback-settled");
      cleanup();
      return;
    }
    setState("fallback-preparing");
    if (returning) {
      root.classList.remove("project-return-arriving");
      root.classList.add("project-return-fallback");
      const source = transfer.title;
      if (source) {
        overlay = document.createElement("div");
        overlay.className = "project-transition-title";
        overlay.textContent = source.text;
        overlay.setAttribute("aria-hidden", "true");
        root.append(overlay);
        animations.push(overlay.animate([{
          width: `${source.width}px`, fontSize: source.fontSize,
          lineHeight: source.lineHeight, fontWeight: source.fontWeight,
          fontFamily: source.fontFamily, color: source.color,
          transform: `translate(${source.x}px, ${source.y}px)`,
        }], { duration: 0, fill: "both" }));
      }
      watchdog = setTimeout(() => { setState("fallback-timeout"); cleanup(); }, 1500);
      try {
        await domReady;
        if (document.readyState !== "complete") {
          await new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
        }
        await document.fonts?.ready;
        // Let homepage layout observers settle before restoring and measuring.
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        if (state !== "fallback-preparing") return;
        prepareReturn();
        const shell = document.querySelector(".site-shell");
        const target = returnTarget?.getBoundingClientRect();
        if (overlay && target) {
          const targetStyle = getComputedStyle(returnTarget);
          const scale = parseFloat(targetStyle.fontSize) / parseFloat(source.fontSize);
          targetOverlay = document.createElement("div");
          targetOverlay.className = "project-transition-title";
          targetOverlay.textContent = returnTarget.textContent;
          targetOverlay.setAttribute("aria-hidden", "true");
          root.append(targetOverlay);
          // Each layer keeps its own line wrapping; only uniform scale and position move.
          animations.push(targetOverlay.animate([{
            width: `${target.width}px`, fontSize: targetStyle.fontSize,
            lineHeight: targetStyle.lineHeight, fontWeight: targetStyle.fontWeight,
            fontFamily: targetStyle.fontFamily, color: targetStyle.color,
            letterSpacing: targetStyle.letterSpacing,
          }], { duration: 0, fill: "both" }));
          const timing = { duration: 250, easing: "cubic-bezier(0.77, 0, 0.175, 1)", fill: "both" };
          animations.push(overlay.animate([
            { transform: `translate(${source.x}px, ${source.y}px) scale(1)` },
            { transform: `translate(${target.x}px, ${target.y}px) scale(${scale})` },
          ], timing), targetOverlay.animate([
            { transform: `translate(${source.x}px, ${source.y}px) scale(${1 / scale})` },
            { transform: `translate(${target.x}px, ${target.y}px) scale(1)` },
          ], timing));
          animations.push(overlay.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: 100, easing: "linear", fill: "both",
          }), targetOverlay.animate([{ opacity: 0 }, { opacity: 1 }], {
            delay: 100, duration: 100, easing: "linear", fill: "both",
          }));
          // The real title appears only when the exact destination layer is removed.
          animations.push(returnTarget.animate([{ opacity: 0 }], { duration: 0, fill: "both" }));
        }
        const fade = shell.animate([{ opacity: 0 }, { opacity: 1 }], {
          delay: overlay && target ? 250 : 0,
          duration: 100, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "both",
        });
        animations.push(fade);
        setState("fallback-running");
        await Promise.all(animations.map((animation) => animation.finished));
        setState("fallback-finished");
      } catch { setState("fallback-skipped"); }
      finally { cleanup(); }
      return;
    }
    root.classList.remove("project-arriving");
    root.classList.add("project-fallback-arriving");
    // Keep the source image visible while the destination finishes parsing.
    overlay = document.createElement("img");
    overlay.src = transfer.image;
    overlay.className = "project-transition-image";
    overlay.alt = "";
    overlay.setAttribute("aria-hidden", "true");
    root.append(overlay);
    const sourceTransform = `translate(${transfer.x}px, ${transfer.y}px)`;
    const hold = overlay.animate([{ transform: sourceTransform }], {
      duration: 0, fill: "forwards",
    });
    animations.push(hold);
    watchdog = setTimeout(() => { setState("fallback-timeout"); cleanup(); }, 1500);
    try {
      await domReady;
      const frame = document.querySelector(".project-image-frame");
      const image = frame?.querySelector("img");
      const shell = document.querySelector(".site-shell");
      if (!image || !shell) throw new Error("Missing project figure");
      await Promise.race([image.decode(), new Promise((resolve) => setTimeout(resolve, 150))]);
      if (state !== "fallback-preparing") return;
      const target = frame.getBoundingClientRect();
      const easing = getComputedStyle(root).getPropertyValue("--publication-motion-ease").trim();
      // Give the retained source position one painted frame before moving it.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      if (state !== "fallback-preparing") return;
      const movement = overlay.animate([
        { transform: sourceTransform },
        { transform: `translate(${target.x}px, ${target.y}px)` },
      ], { duration: 300, easing, fill: "both" });
      hold.cancel();
      animations.push(movement, shell.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 200, easing, fill: "both",
      }));
      setState("fallback-running");
      await movement.finished;
      setState("fallback-finished");
    } catch {
      setState("fallback-skipped");
    } finally { cleanup(); }
  };

  if (arriving) {
    if (native && (returning ? !transfer.fallback : transfer.native)) root.classList.add(returning ? "project-return-arriving" : "project-arriving");
    else fallback();
  }
  window.addEventListener("pageswap", (event) => {
    if (event.viewTransition && (returningWithFallback
      || (!root.classList.contains("project-departing") && !root.classList.contains("project-return-departing")))) {
      event.viewTransition.skipTransition();
    }
  });
  window.addEventListener("pagereveal", (event) => {
    if (!returnCompatibility) prepareReturn();
    if (!arriving) { event.viewTransition?.skipTransition(); if (returning) cleanup(); return; }
    if (returning && !returnTarget) { event.viewTransition?.skipTransition(); fallback("missing-title"); return; }
    if (!event.viewTransition) { fallback("no-native-transition"); return; }
    if (state.startsWith("fallback")) { event.viewTransition.skipTransition(); return; }
    setState("native-pending");
    event.viewTransition.ready.then(() => {
      setState("native-ready");
      // finished also resolves when Chrome skips an already-started transition.
      // The captured animations distinguish completion from cancellation.
      nativeAnimations = Promise.allSettled(document.getAnimations()
        .filter((animation) => animation.animationName?.includes("view-transition"))
        .map((animation) => animation.finished));
    }).catch((error) => { fallback(`native-rejected: ${error.message}`); });
    event.viewTransition.finished.then(async () => {
      const results = await nativeAnimations;
      if (state !== "native-ready") return;
      if (results.some((result) => result.status === "rejected")) {
        fallback("native-interrupted");
      } else {
        setState("native-finished");
        cleanup();
      }
    }).catch((error) => { fallback(`native-rejected: ${error.message}`); });
  });
  window.addEventListener("pageshow", (event) => {
    root.classList.remove("project-departing", "project-return-departing");
    if (!returnCompatibility) prepareReturn();
    if (event.persisted) cleanup();
    else if (arriving && state === "idle") {
      // pagereveal follows pageshow in Chromium. Do not preempt its native snapshot.
      requestAnimationFrame(() => { if (state === "idle") fallback("no-reveal-event"); });
    }
  });
})();
