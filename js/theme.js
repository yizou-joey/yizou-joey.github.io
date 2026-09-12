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

  window.addEventListener("storage", (event) => {
    if (!storage || event.storageArea !== storage) return;
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    theme = resolveTheme(event.newValue);
    applyTheme();
  });

  const bindControls = () => {
    controls = [...document.querySelectorAll("[data-theme-toggle]")];
    applyTheme();
    for (const control of controls) {
      control.addEventListener("click", () => {
        theme = theme === "dark" ? "light" : "dark";
        applyTheme();
        try {
          storage?.setItem(STORAGE_KEY, theme);
        } catch {
          // Keep the in-memory preference when persistence is unavailable.
        }
      });
      control.hidden = false;
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindControls, { once: true });
  } else {
    bindControls();
  }
})();
