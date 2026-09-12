import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const distRoot = path.join(root, "dist");
const errors = [];

const EXPECTED_HTML_FILES = ["index.html", "404.html"];

const STATIC_CONTENT_TARGETS = Object.freeze({
  "index.html": Object.freeze([
    "bio-intro",
    "news-list",
    "publications-list",
    "education-list",
    "services-list",
    "teaching-list",
  ]),
});

const report = (message) => {
  errors.push(message);
};

const readUtf8 = (filePath) => fs.readFile(filePath, "utf8");

const isExternalReference = (value) =>
  /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value);

const stripQueryAndHash = (value) => value.split(/[?#]/, 1)[0];

const decodeReference = (value, sourcePath) => {
  try {
    return decodeURIComponent(value);
  } catch {
    report(`${path.relative(root, sourcePath)} contains an invalid encoded reference: ${value}`);
    return value;
  }
};

const resolveReference = (value, sourcePath) => {
  const normalized = stripQueryAndHash(String(value || "").trim());
  if (!normalized || isExternalReference(normalized)) return null;

  const decoded = decodeReference(normalized, sourcePath);
  const resolved = decoded.startsWith("/")
    ? path.resolve(distRoot, `.${decoded}`)
    : path.resolve(path.dirname(sourcePath), decoded);

  const relativePath = path.relative(distRoot, resolved);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    report(
      `${path.relative(root, sourcePath)} references a path outside dist: ${value}`
    );
    return null;
  }

  return resolved;
};

const validateReference = async (value, sourcePath) => {
  const resolved = resolveReference(value, sourcePath);
  if (!resolved) return;

  try {
    const stat = await fs.stat(resolved);
    if (!stat.isFile()) {
      report(
        `${path.relative(root, sourcePath)} references a non-file path: ${value}`
      );
    }
  } catch {
    report(
      `${path.relative(root, sourcePath)} references a missing dist file: ${value}`
    );
  }
};

const extractHtmlReferences = (html) => {
  const references = [];

  for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    references.push(match[1]);
  }

  for (const match of html.matchAll(/\bsrcset=["']([^"']+)["']/gi)) {
    for (const candidate of match[1].split(",")) {
      const reference = candidate.trim().split(/\s+/, 1)[0];
      if (reference) references.push(reference);
    }
  }

  return references;
};

const extractCssReferences = (css) =>
  Array.from(css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi), (match) => match[1]);

const walkFiles = async (dirPath) => {
  const files = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(entryPath)));
    } else {
      files.push(entryPath);
    }
  }

  return files;
};

const validateStaticTargets = (html, fileName) => {
  for (const id of STATIC_CONTENT_TARGETS[fileName] || []) {
    const pattern = new RegExp(
      `<[a-z0-9]+\\b(?=[^>]*\\bid="${id}"(?:\\s|>|\\/))(?=[^>]*\\bdata-content-rendered="static"(?:\\s|>|\\/))[^>]*>`,
      "i"
    );
    if (!pattern.test(html)) {
      report(`${fileName} is missing statically rendered target #${id}.`);
    }
  }
};

const validateTheme = (html, fileName) => {
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter((match) => /\bdata-theme-bootstrap\b/.test(match[1]));
  if (scripts.length !== 1) {
    report(`${fileName} must contain exactly one theme bootstrap script.`);
    return;
  }

  const [script] = scripts;
  if (/\b(?:src|type|async|defer)\b/i.test(script[1]) || !script[2].trim()) {
    report(`${fileName} must inline its theme bootstrap as a synchronous classic script.`);
  }
  const charset = html.match(/<meta\b[^>]*\bcharset\s*=\s*["']?utf-8\b[^>]*>/i);
  if (!charset || charset.index > script.index || Buffer.byteLength(html.slice(0, charset.index + charset[0].length)) > 1024) {
    report(`${fileName} must declare UTF-8 before its theme script within the first 1024 bytes.`);
  }
  const firstStylesheet = html.search(/<link\b[^>]*\brel\s*=\s*["']stylesheet["'][^>]*>/i);
  const headEnd = html.search(/<\/head\s*>/i);
  if (firstStylesheet < 0 || script.index > firstStylesheet || headEnd < script.index) {
    report(`${fileName} must initialize the theme inside head before its first stylesheet.`);
  }
  const controls = [...html.matchAll(/<button\b([^>]*\bdata-theme-toggle\b[^>]*)>([\s\S]*?)<\/button>/gi)];
  if (controls.length !== 1 || !/\btype=["']button["']/i.test(controls[0][1]) || !/\baria-label=["']Switch to dark mode["']/i.test(controls[0][1])) {
    report(`${fileName} must include one accessible light/dark toggle button.`);
  } else if (/\baria-pressed\b/i.test(controls[0][1]) || !/\bhidden\b/i.test(controls[0][1]) || !/\btitle=["']Switch to dark mode["']/i.test(controls[0][1])) {
    report(`${fileName} must hide its theme button until initialized and describe its action without aria-pressed.`);
  }
};

try {
  const distStat = await fs.stat(distRoot);
  if (!distStat.isDirectory()) {
    report("dist exists but is not a directory.");
  }
} catch {
  report("dist is missing; run the production build before check:dist.");
}

if (!errors.length) {
  for (const fileName of EXPECTED_HTML_FILES) {
    const filePath = path.join(distRoot, fileName);
    let html = "";
    try {
      html = await readUtf8(filePath);
    } catch {
      report(`dist/${fileName} is missing.`);
      continue;
    }

    validateStaticTargets(html, fileName);
    validateTheme(html, fileName);
    for (const reference of extractHtmlReferences(html)) {
      await validateReference(reference, filePath);
    }
  }

  const distFiles = await walkFiles(distRoot);
  for (const filePath of distFiles) {
    if (filePath.endsWith(".css")) {
      const css = await readUtf8(filePath);
      for (const reference of extractCssReferences(css)) {
        await validateReference(reference, filePath);
      }
    }
  }
}

if (errors.length) {
  console.error("Dist check failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Dist check passed.");
