const section = document.querySelector(".project-citation");
const code = section?.querySelector("code");
const button = section?.querySelector(".project-citation-copy");
const status = section?.querySelector(".project-citation-status");

const copyWithSelection = (text) => {
  const focused = document.activeElement;
  const selection = window.getSelection();
  const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange()) : [];
  const field = document.createElement("textarea");
  field.className = "project-citation-temporary";
  field.value = text;
  field.setAttribute("readonly", "");
  field.setAttribute("aria-hidden", "true");
  field.tabIndex = -1;
  document.body.append(field);
  try {
    field.select();
    return document.execCommand("copy") === true;
  } catch {
    return false;
  } finally {
    field.remove();
    focused?.focus({ preventScroll: true });
    if (selection) {
      selection.removeAllRanges();
      ranges.forEach((range) => selection.addRange(range));
    }
  }
};

if (code && button && status) {
  let timer;
  let request = 0;
  let lastMessage = "";
  button.addEventListener("click", async () => {
    const current = ++request;
    clearTimeout(timer);
    let copied;
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(code.textContent);
        copied = true;
      } catch {
        copied = copyWithSelection(code.textContent);
      }
    } else {
      copied = copyWithSelection(code.textContent);
    }
    if (current !== request) return;
    clearTimeout(timer);
    button.toggleAttribute("data-copied", copied);
    status.toggleAttribute("data-failed", !copied);
    const message = copied ? "BibTeX copied." : "Copy failed.";
    status.textContent = message === lastMessage ? `${message}\u00a0` : message;
    lastMessage = status.textContent;
    timer = setTimeout(() => {
      button.removeAttribute("data-copied");
      status.removeAttribute("data-failed");
      status.textContent = "";
    }, 2000);
  });
  button.hidden = false;
}
