const colorHex = (element) => {
  const values = getComputedStyle(element).backgroundColor.match(/\d+/g);
  return values && values.length >= 3
    ? `#${values.slice(0, 3).map((part) => Number(part).toString(16).padStart(2, "0")).join("")}`
    : "";
};

const rows = [...document.querySelectorAll("[data-token]")];
const status = document.querySelector(".design-token-status");

rows.forEach((row) => {
  const chip = row.querySelector(".design-token-chip");
  const value = row.querySelector(".design-token-value");
  if (chip && value) value.textContent = colorHex(chip);
});

const copyWithSelection = (text) => {
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.setAttribute("aria-hidden", "true");
  field.tabIndex = -1;
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  try {
    field.select();
    return document.execCommand("copy") === true;
  } catch {
    return false;
  } finally {
    field.remove();
  }
};

const copy = async (text) => {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return copyWithSelection(text);
    }
  }
  return copyWithSelection(text);
};

const timers = new WeakMap();
let lastMessage = "";

const report = (button, copied, token) => {
  clearTimeout(timers.get(button));
  button.removeAttribute("data-copied");
  button.removeAttribute("data-failed");
  button.setAttribute(copied ? "data-copied" : "data-failed", "");
  let message = copied ? `Copied ${token}` : `Copy failed for ${token}`;
  if (message === lastMessage) message += "\u00a0";
  lastMessage = message;
  status.textContent = message;
  timers.set(button, setTimeout(() => {
    button.removeAttribute("data-copied");
    button.removeAttribute("data-failed");
    status.textContent = "";
  }, 2000));
};

document.querySelectorAll("[data-copy-token]").forEach((button) => {
  button.hidden = false;
  button.addEventListener("click", async () => {
    const token = button.dataset.copyToken;
    report(button, await copy(token), token);
  });
});
