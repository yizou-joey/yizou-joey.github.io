import { escapeHtml } from "@site/components/escape-html";
import {
  getVenueConfig,
  normalizeInlineText,
  renderInlineMarkdown,
  renderNewsInline,
} from "@site/components/shared/render";
import {
  renderProjectHeadingHtml,
  renderProjectResourcesHtml,
  renderPublicationItemHtml,
} from "@site/components/publication/render";

export {
  getVenueConfig,
  normalizeInlineText,
  renderInlineMarkdown,
  renderNewsInline,
  renderProjectHeadingHtml,
  renderProjectResourcesHtml,
  renderPublicationItemHtml,
};
const MONTH_NUMBER_BY_NAME = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const getDateSortValue = (value) => {
  const text = (value || "").trim();
  if (!text) return 0;
  const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDate) {
    const [, year, month, day] = isoDate;
    return Date.UTC(Number(year), Number(month) - 1, Number(day));
  }
  const isoYearMonth = text.match(/^(\d{4})-(\d{2})$/);
  if (isoYearMonth) {
    const [, year, month] = isoYearMonth;
    return Date.UTC(Number(year), Number(month) - 1, 1);
  }
  const isoYear = text.match(/^(\d{4})$/);
  if (isoYear) return Date.UTC(Number(isoYear[1]), 0, 1);
  const monthYear = text.match(/^([A-Za-z]{3,9})\.?,?\s+(\d{4})$/);
  if (monthYear) {
    const [, monthName, year] = monthYear;
    const monthIndex = MONTH_NUMBER_BY_NAME[monthName.slice(0, 3).toLowerCase()];
    if (typeof monthIndex === "number") return Date.UTC(Number(year), monthIndex, 1);
  }
  const fallback = Date.parse(text);
  return Number.isFinite(fallback) ? fallback : 0;
};

const renderProjectVideoHtml = (entry) => {
  if (!entry.youtubeUrl?.trim()) return "";
  const url = new URL(entry.youtubeUrl);
  const host = url.hostname.replace(/^www\./, "");
  const videoId = host === "youtu.be" ? url.pathname.slice(1)
    : host === "youtube.com" ? (url.pathname === "/watch" ? url.searchParams.get("v") : url.pathname.match(/^\/embed\/([^/]+)$/)?.[1]) : "";
  if (url.protocol !== "https:" || !/^[A-Za-z0-9_-]{11}$/.test(videoId || "")) {
    throw new Error("Project youtubeUrl must identify an HTTPS YouTube video.");
  }
  const embed = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
  embed.searchParams.set("playsinline", "1");
  embed.searchParams.set("rel", "0");
  const timestamp = url.searchParams.get("start") || url.searchParams.get("t");
  if (timestamp) {
    const parts = timestamp.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
    const seconds = /^\d+$/.test(timestamp) ? Number(timestamp)
      : parts ? Number(parts[1] || 0) * 3600 + Number(parts[2] || 0) * 60 + Number(parts[3] || 0) : 0;
    if (Number.isSafeInteger(seconds) && seconds > 0) embed.searchParams.set("start", String(seconds));
  }
  const label = entry.youtubeLabel?.trim() || "Video";
  const title = `${entry.project.name} — ${label}`;
  return `<section class="project-section project-video-section" aria-labelledby="project-video-title"><h2 id="project-video-title" class="type-title-section">${escapeHtml(label)}</h2><div class="project-video project-section-content"><iframe src="${escapeHtml(embed.href)}" title="${escapeHtml(title)}" width="770" height="433" loading="eager" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div></section>`;
};

export {
  escapeHtml,
  getDateSortValue,
  renderProjectVideoHtml,
};
