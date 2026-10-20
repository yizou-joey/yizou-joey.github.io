// Parser-blocking head bootstrap, preceded by the critical opt-in CSS.
(() => {
  const key = "dodgeui-transition";
  const root = document.documentElement;
  let transfer;
  try {
    transfer = JSON.parse(sessionStorage.getItem(key) || "null");
    sessionStorage.removeItem(key);
  } catch { /* Storage is optional. */ }
  const arriving = transfer && transfer.to === location.href
    && Date.now() - transfer.time < 5000
    && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const native = "onpageswap" in window && "onpagereveal" in window;
  let state = "idle";
  let watchdog;
  let overlay;
  let nativeAnimations = Promise.resolve([]);
  const animations = [];
  const setState = (next) => {
    state = next;
    root.dataset.projectTransition = next;
  };
  const cleanup = () => {
    clearTimeout(watchdog);
    root.classList.remove("project-arriving", "project-fallback-arriving");
    overlay?.remove();
    animations.forEach((animation) => animation.cancel());
  };
  const domReady = new Promise((resolve) => {
    if (document.readyState !== "loading") resolve();
    else document.addEventListener("DOMContentLoaded", resolve, { once: true });
  });

  const fallback = async (reason = "unsupported") => {
    if (!arriving || state.startsWith("fallback") || state === "native-finished") return;
    root.dataset.projectFallbackReason = reason;
    setState("fallback-preparing");
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
    if (native && transfer.native) root.classList.add("project-arriving");
    else fallback();
  }
  window.addEventListener("pageswap", (event) => {
    if (event.viewTransition && !root.classList.contains("project-departing")) {
      event.viewTransition.skipTransition();
    }
  });
  window.addEventListener("pagereveal", (event) => {
    if (!arriving) { event.viewTransition?.skipTransition(); return; }
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
    root.classList.remove("project-departing");
    if (event.persisted) cleanup();
    else if (arriving && state === "idle") {
      // pagereveal follows pageshow in Chromium. Do not preempt its native snapshot.
      requestAnimationFrame(() => { if (state === "idle") fallback("no-reveal-event"); });
    }
  });
})();
