// Inlined as a classic script before stylesheets so the first paint uses the theme.
(() => {
  const STORAGE_KEY = "site-theme";
  const root = document.documentElement;
  // Keep the entry-time browser preference as the fallback; do not track changes.
  const initialTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  const resolveTheme = (value) =>
    value === "light" || value === "dark" ? value : initialTheme;

  let storage = null;
  let theme = initialTheme;
  let controls = [];
  let transition = null;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  try {
    storage = window.localStorage;
    theme = resolveTheme(storage.getItem(STORAGE_KEY));
  } catch {
    // A blocked storage API must not prevent the current page from changing theme.
  }

  const applyTheme = () => {
    root.dataset.theme = theme;
    const label = `Switch to ${theme === "dark" ? "light" : "dark"} mode`;
    for (const control of controls) {
      control.setAttribute("aria-label", label);
      control.setAttribute("title", label);
    }
  };

  applyTheme();

  const stopTransition = () => {
    if (!transition) return;
    const previous = transition;
    transition = null;
    previous.skipTransition();
    delete root.dataset.themeTransition;
  };

  const showTheme = (event) => {
    const interrupted = Boolean(transition);
    stopTransition();
    if (interrupted || !(event.detail > 0) || reducedMotion.matches ||
        typeof document.startViewTransition !== "function") {
      applyTheme();
      return;
    }

    root.dataset.themeTransition = "";
    try {
      // Read the latest preference in the callback: a skipped capture may still
      // run after another click or a storage event has superseded it.
      const current = document.startViewTransition(applyTheme);
      transition = current;
      const finish = () => {
        if (transition !== current) return;
        transition = null;
        delete root.dataset.themeTransition;
      };
      current.ready.catch(() => {}); // Skipping a pending capture rejects ready.
      current.finished.then(finish, finish);
    } catch {
      delete root.dataset.themeTransition;
      applyTheme();
    }
  };

  window.addEventListener("storage", (event) => {
    if (!storage || event.storageArea !== storage) return;
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    stopTransition();
    theme = resolveTheme(event.newValue);
    applyTheme();
  });

  const bindControls = () => {
    controls = [...document.querySelectorAll("[data-theme-toggle]")];
    applyTheme();
    const toggleTheme = (event) => {
      theme = theme === "dark" ? "light" : "dark";
      showTheme(event);
      try {
        storage?.setItem(STORAGE_KEY, theme);
      } catch {
        // Keep the in-memory preference when persistence is unavailable.
      }
    };
    for (const control of controls) {
      control.addEventListener("click", toggleTheme);
      control.hidden = false;
    }

    // Captured elements can be omitted from hit testing during a native view
    // transition. Route a click on the visible button snapshot to the same entry.
    document.addEventListener("click", (event) => {
      if (!transition || !(event.detail > 0) ||
          controls.some((control) => control.contains(event.target))) return;
      const onButton = controls.some((control) => {
        const rect = control.getBoundingClientRect();
        return event.clientX >= rect.left && event.clientX <= rect.right &&
          event.clientY >= rect.top && event.clientY <= rect.bottom;
      });
      if (onButton) toggleTheme(event);
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindControls, { once: true });
  } else {
    bindControls();
  }
})();
