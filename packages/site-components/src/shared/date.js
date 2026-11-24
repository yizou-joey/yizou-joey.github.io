import { normalizeInlineText } from "./text.js";

const MONTH_SHORT_LABEL = {
  january: "Jan.", february: "Feb.", march: "Mar.", april: "Apr.", may: "May",
  june: "Jun.", july: "Jul.", august: "Aug.", september: "Sep.", october: "Oct.",
  november: "Nov.", december: "Dec.",
};

export const formatIsoDateLabel = (value) => {
  const text = normalizeInlineText(value || "");
  if (!text) return "";
  const match = text.match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/);
  if (!match) return text;
  const [, year, monthValue, dayValue] = match;
  if (!monthValue) return year;
  const monthKeys = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const month = MONTH_SHORT_LABEL[monthKeys[Number(monthValue) - 1]];
  if (!month) return text;
  if (!dayValue) return `${month} ${year}`;
  return `${month} ${Number(dayValue)}, ${year}`;
};
