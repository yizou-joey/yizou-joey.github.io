const URL_FIELD_SUFFIX = "Url";

const INLINE_MARKDOWN_FIELDS = new Set([
  "title",
  "authors",
  "text",
  "institution",
  "subAffiliation",
  "event",
  "detail",
  "location",
  "courseName",
]);

const VENUE_REGISTRY = Object.freeze({
  "ieee-vr": Object.freeze({
    label: "IEEE VR",
    cssVar: "--color-venue-ieee-vr",
    className: "venue-ieee-vr",
  }),
  mmsys: Object.freeze({
    label: "MMSys",
    cssVar: "--color-venue-mmsys",
    className: "venue-mmsys",
  }),
});

const CONTENT_SCHEMAS = Object.freeze({
  publications: Object.freeze({
    path: "contents/publications.md",
    required: Object.freeze(["date", "selected", "type", "venueKey", "venue", "title", "authors"]),
    optional: Object.freeze([
      "workshopLabel",
      "typeLink",
      "award",
      "status",
      "paperUrl",
      "youtubeUrl",
      "youtubeLabel",
      "videoUrl",
      "demoUrl",
      "arxivUrl",
      "pdfUrl",
      "slidesUrl",
      "posterUrl",
      "codeUrl",
      "doi",
    ]),
    deprecated: Object.freeze(["venueColor", "venueAccent"]),
    dateFormat: "iso-date",
    venueKey: "required",
  }),
  news: Object.freeze({
    path: "contents/news.md",
    required: Object.freeze(["date", "text"]),
    optional: Object.freeze([
      "venueKey",
      "venueText",
      "venueUrl",
      "award",
      "awardText",
      "mascot",
      "mascotAlt",
    ]),
    deprecated: Object.freeze(["venueColor", "venueAccent"]),
    dateFormat: "display-date",
    venueKey: "when-venue-text",
  }),
  education: Object.freeze({
    path: "contents/education.md",
    required: Object.freeze(["period", "institution", "degree", "major"]),
    optional: Object.freeze(["subAffiliation", "location", "logo", "logoAlt"]),
    deprecated: Object.freeze([]),
  }),
  services: Object.freeze({
    path: "contents/services.md",
    required: Object.freeze(["period", "role"]),
    optional: Object.freeze(["event", "detail", "location", "logo", "logoAlt", "logoLink"]),
    deprecated: Object.freeze([]),
  }),
  teaching: Object.freeze({
    path: "contents/teaching.md",
    required: Object.freeze(["period", "role"]),
    optional: Object.freeze(["courseCode", "courseName", "institution", "detail"]),
    deprecated: Object.freeze([]),
  }),
});

const PUBLICATION_TYPES = Object.freeze(["C", "J", "W", "P"]);
const BOOLEAN_FIELDS = Object.freeze(["selected"]);

const getAllowedFields = (schema) =>
  new Set([...(schema.required || []), ...(schema.optional || [])]);

const isUrlField = (field) =>
  field === "doi" ||
  field === "typeLink" ||
  field === "logoLink" ||
  field.endsWith(URL_FIELD_SUFFIX) ||
  field === "logo" ||
  field === "mascot";

const getVenueConfig = (venueKey) => {
  const normalizedKey = String(venueKey || "").trim().toLowerCase();
  return VENUE_REGISTRY[normalizedKey] || null;
};

export {
  BOOLEAN_FIELDS,
  CONTENT_SCHEMAS,
  INLINE_MARKDOWN_FIELDS,
  PUBLICATION_TYPES,
  VENUE_REGISTRY,
  getAllowedFields,
  getVenueConfig,
  isUrlField,
};
