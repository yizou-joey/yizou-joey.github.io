import { escapeHtml } from "../escape-html.js";

const linkMarkdownPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
const boldMarkdownPattern = /\*\*([^*]+)\*\*/g;
const italicMarkdownPattern = /\*([^*]+)\*/g;

export const renderInlineMarkdown = (value, { preserveLineBreaks = true, breakClass = "" } = {}) => {
  if (!value) return "";
  const escaped = escapeHtml(String(value));
  const withLinks = escaped.replace(linkMarkdownPattern, (_, text, url) => {
    if (/^javascript:/i.test(url.trim())) return text;
    const isExternal = /^https?:\/\//i.test(url.trim());
    const targetAttr = isExternal ? ` target="_blank" rel="noopener noreferrer"` : "";
    const personNameClass = /^Prof\.\s+\S/.test(text) ? " inline-link--person-name" : "";
    return `<a href="${url}" class="inline-link${personNameClass}"${targetAttr}>${text}</a>`;
  });
  const withBold = withLinks.replace(boldMarkdownPattern, "<strong>$1</strong>");
  const withItalic = withBold.replace(italicMarkdownPattern, "<em>$1</em>");
  if (!preserveLineBreaks) return withItalic;
  const classAttr = breakClass ? ` class="${breakClass}"` : "";
  return withItalic.replace(/\n/g, `<br${classAttr} />`).replace(/\\n/g, `<br${classAttr} />`);
};
