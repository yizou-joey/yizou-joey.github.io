const parseListData = (text) => {
  const lines = text.replace(/\r/g, "").split("\n");
  const items = [];
  let current = null;

  const pushCurrent = () => {
    if (!current) return;
    const hasContent = Object.values(current).some((value) => value && value.trim());
    if (hasContent) items.push(current);
    current = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) continue;

    if (line.startsWith("- ")) {
      pushCurrent();
      current = {};
      const content = line.slice(2);
      const [key, ...rest] = content.split(":");
      if (key && rest.length) {
        current[key.trim()] = rest.join(":").trim();
      }
      continue;
    }

    if (!current) continue;

    const [key, ...rest] = line.split(":");
    if (!key || !rest.length) continue;
    current[key.trim()] = rest.join(":").trim();
  }

  pushCurrent();
  return items;
};

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const renderInlineMarkdown = (value) => {
  if (!value) return "";
  let html = escapeHtml(value);
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="underline underline-offset-2 decoration-muted/40 hover:decoration-ink/60">$1</a>'
  );
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/\n/g, "<br />");
  html = html.replace(/\\n/g, "<br />");
  return html;
};

const renderAuthors = (value) => {
  if (!value) return "";
  const token = "__CORR_STAR__";
  const escaped = value.replace(/\\\*/g, token);
  let html = renderInlineMarkdown(escaped);
  html = html.replace(new RegExp(token, "g"), "<sup>*</sup>");
  html = html.replace(/\*/g, "<sup>*</sup>");
  return html;
};

const buildPublicationCard = (item) => {
  const article = document.createElement("article");
  article.className =
    "w-full max-w-[833px] rounded-xl border border-line bg-white p-[24px] sm:p-[28px] md:p-[40px]";

  const container = document.createElement("div");
  container.className = "flex flex-col items-start gap-[14px]";

  const venue = document.createElement("div");
  venue.className = "w-fit rounded-[6px] px-3 py-1 text-center";
  const venueColor = item.venueColor || "#262189";
  venue.style.backgroundColor = venueColor;

  const venueText = document.createElement("span");
  venueText.className = "font-inter text-[14px] font-semibold text-paper";
  venueText.textContent = item.venue || "";
  venue.appendChild(venueText);

  const title = document.createElement("h3");
  title.className = "font-inter text-[18px] font-semibold sm:text-[20px] md:text-[24px]";
  title.innerHTML = renderInlineMarkdown(item.title || "");

  const authors = document.createElement("p");
  authors.className = "font-inter text-[14px] leading-relaxed sm:text-[15px] md:text-[16px]";
  authors.innerHTML = renderAuthors(item.authors || "");

  const description = document.createElement("p");
  description.className = "font-inter text-[14px] leading-relaxed sm:text-[15px] md:text-[16px]";
  description.innerHTML = renderInlineMarkdown(item.description || "");

  container.appendChild(venue);
  container.appendChild(title);
  container.appendChild(authors);
  container.appendChild(description);
  article.appendChild(container);
  return article;
};
