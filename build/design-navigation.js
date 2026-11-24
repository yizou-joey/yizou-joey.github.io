import { escapeHtml } from "@site/components/escape-html";
import navigation from "../contents/design-navigation.js";

export const renderDesignNavigationHtml = ({ currentId } = {}) => {
  const groups = navigation.map((group) => {
    const items = group.items.map((item) => {
      const current = item.id === currentId ? ' aria-current="page"' : "";
      return `<li><a href="${escapeHtml(item.href)}"${current}>${escapeHtml(item.title)}</a></li>`;
    }).join("");
    return `<div class="design-doc-nav-group"><p class="design-doc-nav-title type-label text-muted">${escapeHtml(group.title)}</p><ul class="design-doc-nav-list">${items}</ul></div>`;
  }).join("");
  return `<nav class="design-doc-nav type-nav" aria-label="Design guide">${groups}</nav>`;
};
