const buildEducationItem = (item) => {
  const entry = item || {};

  const node = document.createElement("article");
  node.className = "education-timeline-item";

  const period = document.createElement("p");
  period.className = "education-item-period";
  period.textContent = normalizeInlineText(entry.period || "");

  const content = document.createElement("div");
  content.className = "education-item-content";

  const head = document.createElement("div");
  head.className = "education-item-head";

  const institution = document.createElement("h3");
  institution.className = "education-item-institution type-title-minor text-ink";
  institution.innerHTML = renderInlineMarkdown(entry.institution || "", {
    preserveLineBreaks: false,
  });

  const summary = document.createElement("p");
  summary.className = "education-item-summary type-body text-muted";
  const summaryParts = [entry.degree, entry.major].filter(
    (value) => normalizeInlineText(value).length
  );
  summary.innerHTML = renderInlineMarkdown(summaryParts.join(", "), {
    preserveLineBreaks: false,
  });

  const location = document.createElement("p");
  location.className = "education-item-location type-body-sm text-muted";
  location.textContent = normalizeInlineText(entry.location || "");

  const logoSrc = normalizeInlineText(entry.logo || "");
  if (logoSrc) {
    const logo = document.createElement("img");
    logo.className = "education-item-logo";
    logo.src = encodeURI(logoSrc);
    logo.alt = normalizeInlineText(entry.logoAlt || `${entry.institution || "Institution"} logo`);
    logo.loading = "lazy";
    logo.decoding = "async";
    head.appendChild(logo);
  }

  head.insertBefore(institution, head.firstChild);
  content.appendChild(head);
  if (summaryParts.length) {
    content.appendChild(summary);
  }
  if (location.textContent) {
    content.appendChild(location);
  }

  node.appendChild(period);
  node.appendChild(content);
  return node;
};

const renderBioPageIntro = async () => {
  const bioIntro = document.getElementById("bio-page-intro");
  if (!bioIntro) return;

  try {
    const markdown = await fetchTextOrThrow("contents/bio.md");
    const text = (markdown || "").trim();
    if (!text) {
      bioIntro.textContent = "";
      return;
    }
    bioIntro.innerHTML = renderInlineMarkdown(text);
  } catch {
    bioIntro.textContent = "Bio unavailable.";
  }
};

const renderEducationTimeline = async () => {
  const educationList = document.getElementById("education-list");
  if (!educationList) return;

  try {
    const items = await loadList({
      url: "contents/education.md",
    });

    if (!items.length) {
      renderEmpty(
        educationList,
        '<p class="type-body-sm text-muted">No education entries yet.</p>'
      );
      return;
    }

    renderItems({
      container: educationList,
      items,
      buildItem: buildEducationItem,
    });
  } catch {
    renderError(
      educationList,
      '<p class="type-body-sm text-muted">Education unavailable.</p>'
    );
  }
};

renderBioPageIntro();
renderEducationTimeline();
