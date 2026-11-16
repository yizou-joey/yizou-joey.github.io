import { escapeHtml } from "../escape-html.js";
import { renderInlineMarkdown } from "./inline-markdown.js";
import { getVenueConfig, normalizeVenueKey } from "./venue.js";

const escapeRegExp = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const renderNewsInline = (entry) => {
  let html = renderInlineMarkdown(String(entry?.text || ""));
  const awardText = String(entry?.award || entry?.awardText || "").trim();
  if (awardText) html = html.replace(new RegExp(escapeRegExp(awardText), "g"),
    `<span class="news-award-token">${escapeHtml(awardText)}</span>`);
  const venueKey = normalizeVenueKey(entry);
  const venueText = String(entry?.venueText || entry?.venue || "").trim();
  const venueUrl = String(entry?.venueUrl || "").trim();
  const venueConfig = getVenueConfig(venueKey);
  const venueClass = venueConfig ? ` ${venueConfig.className}` : "";
  if (!venueKey || !venueText) return html;
  const venuePattern = new RegExp(escapeRegExp(venueText), "g");
  if (venueUrl) return html.replace(venuePattern,
    `<a href="${escapeHtml(venueUrl)}" class="inline-link news-venue-link news-venue-token${venueClass}" data-venue="${escapeHtml(venueKey)}" target="_blank" rel="noopener noreferrer">${escapeHtml(venueText)}</a>`);
  return html.replace(venuePattern,
    `<span class="news-venue-token${venueClass}" data-venue="${escapeHtml(venueKey)}">${escapeHtml(venueText)}</span>`);
};
