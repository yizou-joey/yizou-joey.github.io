import fs from "node:fs/promises";
import path from "node:path";
import {
  BOOLEAN_FIELDS,
  CONTENT_SCHEMAS,
  PUBLICATION_TYPES,
  VENUE_REGISTRY,
  getAllowedFields,
  getVenueConfig,
  isUrlField,
} from "../js/site-contracts.js";

const root = process.cwd();
const errors = [];

const report = (message) => {
  errors.push(message);
};

const readUtf8 = (filePath) => fs.readFile(path.join(root, filePath), "utf8");

const parseKeyValueLine = (line) => {
  const [key, ...rest] = line.split(":");
  if (!key || !rest.length) return null;
  return {
    key: key.trim(),
    value: rest.join(":").trim(),
  };
};

const isCommentLine = (line) =>
  line.startsWith("#") || line.startsWith("<!--") || line.startsWith("-->");

const hasItemContent = (item) =>
  Object.values(item.fields).some((value) => typeof value === "string" && value.trim());

const parseListData = (text, filePath) => {
  const lines = String(text || "").replace(/\r/g, "").split("\n");
  const items = [];
  let current = null;

  const finalizeCurrent = () => {
    if (!current) return;
    if (hasItemContent(current)) items.push(current);
    current = null;
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line || isCommentLine(line)) return;

    if (line.startsWith("- ")) {
      finalizeCurrent();
      current = { index: items.length + 1, line: index + 1, fields: {} };
      const firstEntry = parseKeyValueLine(line.slice(2));
      if (firstEntry) current.fields[firstEntry.key] = firstEntry.value;
      return;
    }

    if (!current) {
      report(`${filePath}:${index + 1} has content outside a list item.`);
      return;
    }

    const entry = parseKeyValueLine(line);
    if (!entry) {
      report(`${filePath}:${index + 1} is not a key/value line.`);
      return;
    }
    current.fields[entry.key] = entry.value;
  });

  finalizeCurrent();
  return items;
};

const itemLabel = (filePath, item) => `${filePath}: item ${item.index} (line ${item.line})`;

const isBooleanLike = (value) =>
  ["true", "false", "1", "0", "yes", "no", "y", "n", "on", "off"].includes(
    String(value || "").trim().toLowerCase()
  );

const isIsoDate = (value) => {
  const match = String(value || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const isDisplayDate = (value) => {
  const text = String(value || "").trim();
  return (
    /^[A-Z][a-z]{2,8}\.?\s+\d{1,2},\s+\d{4}$/.test(text) ||
    /^[A-Z][a-z]{2,8}\.?\s+\d{4}$/.test(text) ||
    /^\d{4}-\d{2}-\d{2}$/.test(text)
  );
};

const isExternalUrl = (value) => /^(https?:\/\/|mailto:)/i.test(value);

const validatePathOrUrl = async ({ filePath, item, field, value }) => {
  const text = String(value || "").trim();
  if (!text) return;
  if (isExternalUrl(text)) return;
  if (text.startsWith("/") || text.includes("..")) {
    report(`${itemLabel(filePath, item)} field "${field}" must be an external URL or public-relative path.`);
    return;
  }

  const publicPath = path.join(root, "public", text);
  try {
    const stat = await fs.stat(publicPath);
    if (!stat.isFile()) {
      report(`${itemLabel(filePath, item)} field "${field}" points to a non-file path: ${text}`);
    }
  } catch {
    report(`${itemLabel(filePath, item)} field "${field}" points to a missing public file: ${text}`);
  }
};

const validateContentFile = async (name, schema) => {
  const text = await readUtf8(schema.path);
  const items = parseListData(text, schema.path);
  const allowed = getAllowedFields(schema);
  const deprecated = new Set(schema.deprecated || []);

  for (const item of items) {
    const fields = item.fields;
    for (const field of Object.keys(fields)) {
      if (deprecated.has(field)) {
        report(`${itemLabel(schema.path, item)} field "${field}" is deprecated; use venueKey/registry tokens.`);
      } else if (!allowed.has(field)) {
        report(`${itemLabel(schema.path, item)} field "${field}" is not in the ${name} schema.`);
      }
    }

    for (const field of schema.required || []) {
      if (!String(fields[field] || "").trim()) {
        report(`${itemLabel(schema.path, item)} is missing required field "${field}".`);
      }
    }

    for (const field of BOOLEAN_FIELDS) {
      if (fields[field] && !isBooleanLike(fields[field])) {
        report(`${itemLabel(schema.path, item)} field "${field}" must be boolean-like.`);
      }
    }

    if (schema.dateFormat === "iso-date" && !isIsoDate(fields.date)) {
      report(`${itemLabel(schema.path, item)} field "date" must use YYYY-MM-DD.`);
    }

    if (schema.dateFormat === "display-date" && !isDisplayDate(fields.date)) {
      report(`${itemLabel(schema.path, item)} field "date" must be a readable display date.`);
    }

    if (name === "publications" && fields.type && !PUBLICATION_TYPES.includes(fields.type.trim().toUpperCase())) {
      report(`${itemLabel(schema.path, item)} field "type" must be one of ${PUBLICATION_TYPES.join(", ")}.`);
    }

    if (schema.venueKey === "required" || (schema.venueKey === "when-venue-text" && fields.venueText)) {
      if (!fields.venueKey) {
        report(`${itemLabel(schema.path, item)} needs a venueKey.`);
      } else if (!getVenueConfig(fields.venueKey)) {
        report(`${itemLabel(schema.path, item)} venueKey "${fields.venueKey}" is not registered.`);
      }
    } else if (fields.venueKey && !getVenueConfig(fields.venueKey)) {
      report(`${itemLabel(schema.path, item)} venueKey "${fields.venueKey}" is not registered.`);
    }

    const seenResources = new Map();
    for (const [field, value] of Object.entries(fields)) {
      if (!isUrlField(field)) continue;
      await validatePathOrUrl({ filePath: schema.path, item, field, value });
      const normalizedValue = String(value || "").trim();
      if (!normalizedValue) continue;
      if (seenResources.has(normalizedValue)) {
        report(
          `${itemLabel(schema.path, item)} fields "${seenResources.get(normalizedValue)}" and "${field}" reuse the same resource.`
        );
      }
      seenResources.set(normalizedValue, field);
    }
  }
};

const validateNoInlineHtmlStyles = async () => {
  const htmlFiles = ["index.html", "publications.html", "404.html"];
  for (const filePath of htmlFiles) {
    const text = await readUtf8(filePath);
    const lines = text.split("\n");
    lines.forEach((line, index) => {
      if (/\sstyle\s*=/.test(line)) {
        report(`${filePath}:${index + 1} uses an inline style attribute; add a semantic CSS class instead.`);
      }
    });
  }
};

const validateNoGeneratedInlineStyles = async () => {
  const jsFiles = ["js/utils.js", "js/index.js", "js/publications.js"];
  for (const filePath of jsFiles) {
    const text = await readUtf8(filePath);
    const lines = text.split("\n");
    lines.forEach((line, index) => {
      if (/style\s*=/.test(line)) {
        report(`${filePath}:${index + 1} generates inline styles; use classes and tokens instead.`);
      }
    });
  }
};

const validateCssColorsStayTokenized = async () => {
  const filePath = "css/styles.css";
  const text = await readUtf8(filePath);
  const rootEnd = text.indexOf("\n}\n");
  const outsideRoot = rootEnd >= 0 ? text.slice(rootEnd + 3) : text;
  const lines = outsideRoot.split("\n");
  lines.forEach((line, index) => {
    const withoutComments = line.replace(/\/\*.*?\*\//g, "");
    if (/(#[0-9a-fA-F]{3,8}|rgba?\()/i.test(withoutComments)) {
      report(`${filePath}:${index + 1} has a hard-coded color outside :root; add or reuse a token.`);
    }
  });
};

const validateDocsMentionContracts = async () => {
  const docs = await readUtf8("docs/content-schema.md");
  for (const key of Object.keys(CONTENT_SCHEMAS)) {
    const heading = key[0].toUpperCase() + key.slice(1);
    if (!docs.includes(`## ${heading}`)) {
      report(`docs/content-schema.md must include a "## ${heading}" section.`);
    }
  }

  for (const key of Object.keys(VENUE_REGISTRY)) {
    if (!docs.includes(`\`${key}\``)) {
      report(`docs/content-schema.md must document venueKey "${key}".`);
    }
  }
};

for (const [name, schema] of Object.entries(CONTENT_SCHEMAS)) {
  await validateContentFile(name, schema);
}
await validateNoInlineHtmlStyles();
await validateNoGeneratedInlineStyles();
await validateCssColorsStayTokenized();
await validateDocsMentionContracts();

if (errors.length) {
  console.error("Site contract check failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Site contract check passed.");
