if (location.pathname === "/design.html") {
  const followLegacyLinksAnchor = () => {
    if (location.hash === "#links") location.replace("/design-links.html#links");
  };
  followLegacyLinksAnchor();
  window.addEventListener("hashchange", followLegacyLinksAnchor);
}

const colorHex = (element) => {
  const values = getComputedStyle(element).backgroundColor.match(/\d+/g);
  return values && values.length >= 3
    ? `#${values.slice(0, 3).map((part) => Number(part).toString(16).padStart(2, "0")).join("")}`
    : "";
};

const updateSwatches = () => {
  document.querySelectorAll(".design-swatch").forEach((swatch) => {
    const fill = swatch.querySelector(".design-fill");
    const hex = colorHex(fill);
    if (!hex) return;
    let value = swatch.querySelector(".design-color-value");
    if (!value) {
      value = document.createElement("code");
      value.className = "design-color-value";
      swatch.lastElementChild.insertBefore(value, swatch.querySelector("small"));
    }
    value.textContent = hex;
    const source = swatch.querySelector(".design-source");
    if (source) {
      let sourceValue = source.querySelector(".design-source-value");
      if (!sourceValue) {
        sourceValue = document.createElement("code");
        sourceValue.className = "design-source-value";
        source.append(sourceValue);
      }
      sourceValue.textContent = colorHex(source.querySelector("i"));
    }
  });
};

const updateTypography = () => {
  document.querySelectorAll(".design-type-row").forEach((row) => {
    const style = getComputedStyle(row.children[1]);
    let metrics = row.querySelector(".design-type-metrics");
    if (!metrics) {
      metrics = document.createElement("div");
      metrics.className = "design-type-metrics";
      row.append(metrics);
    }
    const fields = [
      ["Size", style.fontSize],
      ["Weight", style.fontWeight],
      ["Line", style.lineHeight],
      ["Preferred font", style.fontFamily.split(",")[0].trim().replace(/^"|"$/g, "")],
    ];
    metrics.replaceChildren(...fields.map(([label, value]) => {
      const field = document.createElement("span");
      const heading = document.createElement("span");
      field.className = "design-type-metric";
      heading.className = "design-type-metric-label";
      heading.textContent = label;
      field.append(heading, document.createTextNode(value));
      if (label === "Preferred font") field.title = `Computed font stack (rendered font may differ): ${style.fontFamily}`;
      return field;
    }));
  });
};

updateSwatches();
updateTypography();
window.addEventListener("resize", updateTypography);
document.fonts.ready.then(updateTypography);
document.fonts.addEventListener("loadingdone", updateTypography);
new MutationObserver(updateSwatches).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
