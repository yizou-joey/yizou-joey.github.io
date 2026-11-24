import { escapeHtml } from "../escape-html.js";
import { formatIsoDateLabel } from "../shared/date.js";
import { renderInlineMarkdown } from "../shared/inline-markdown.js";
import { getVenueConfig } from "../shared/venue.js";
import { normalizeInlineText } from "../shared/text.js";

export const renderServiceItemHtml = (item, index = 0) => {
  const entry = item || {};
  const venueConfig = getVenueConfig(entry.venueKey);
  const venueClass = venueConfig ? ` ${venueConfig.className}` : "";
  const datePeriod = normalizeInlineText(entry.dateLabel) || formatIsoDateLabel(entry.date);
  let eventContent = renderInlineMarkdown(entry.event);
  const fullName = normalizeInlineText(entry.eventFullName);
  if (fullName && eventContent.includes("<a ")) {
    const descriptionId = `service-event-description-${index}`;
    const description = [normalizeInlineText(entry.eventEdition), fullName].filter(Boolean).join(" ");
    eventContent = eventContent.replace("<a ", `<a aria-describedby="${descriptionId}" `);
    eventContent += `<span class="service-event-tooltip" id="${descriptionId}" role="tooltip"><span class="service-event-note">${escapeHtml(description)}</span></span>`;
  }
  const eventHtml = entry.event
    ? `<div class="editorial-inst-name service-event">${eventContent}</div>`
    : entry.detail
      ? `<div class="editorial-inst-name">${renderInlineMarkdown(entry.detail || "")}</div>`
      : "";
  const locationHtml = entry.location
    ? `<div class="editorial-inst-sub">${renderInlineMarkdown(entry.location)}</div>`
    : "";
  const detailHtml = eventHtml || locationHtml
    ? `<div class="editorial-item-subtitle">${eventHtml}${locationHtml}</div>`
    : "";
  const logoHtml = entry.logo
    ? `<div class="editorial-media-column service-mascot-column"><img class="service-mascot-sticker" src="${escapeHtml(entry.logo)}" alt="${escapeHtml(entry.logoAlt || "Conference mascot")}" loading="eager" decoding="async" width="80" height="80" /></div>`
    : "";
  return `<div class="editorial-media-row editorial-service-row${venueClass}"><div class="editorial-date-column"><div class="editorial-date-start">${escapeHtml(datePeriod)}</div></div><div class="editorial-detail-column"><h3 class="editorial-item-title">${escapeHtml(entry.role || "")}</h3>${detailHtml}</div>${logoHtml}</div>`;
};

export const renderServiceListHtml = (items) =>
  (items || []).map((item, index) => renderServiceItemHtml(item || {}, index)).join("");
