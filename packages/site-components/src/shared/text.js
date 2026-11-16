export const normalizeInlineText = (value) => String(value || "").replace(/\s+/g, " ").trim();
