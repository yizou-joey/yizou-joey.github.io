const dynamicFavicon = document.querySelector("[data-dynamic-favicon]");

if (dynamicFavicon) {
  const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const getIcon = (state, scheme) =>
    dynamicFavicon.getAttribute(`data-${state}-${scheme}-icon`) ||
    dynamicFavicon.getAttribute(`data-${state}-icon`);

  const updateFavicon = () => {
    const state = document.hidden ? "idle" : "active";
    const scheme = colorSchemeQuery.matches ? "dark" : "light";
    const icon = getIcon(state, scheme);

    if (icon) dynamicFavicon.href = icon;
  };

  document.addEventListener("visibilitychange", updateFavicon);
  if (typeof colorSchemeQuery.addEventListener === "function") {
    colorSchemeQuery.addEventListener("change", updateFavicon);
  } else if (typeof colorSchemeQuery.addListener === "function") {
    colorSchemeQuery.addListener(updateFavicon);
  }
  updateFavicon();
}
