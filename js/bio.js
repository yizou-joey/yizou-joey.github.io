const MONTH_SHORT_LABEL = {
  january: "Jan",
  february: "Feb",
  march: "Mar",
  april: "Apr",
  may: "May",
  june: "Jun",
  july: "Jul",
  august: "Aug",
  september: "Sep",
  october: "Oct",
  november: "Nov",
  december: "Dec",
  jan: "Jan",
  feb: "Feb",
  mar: "Mar",
  apr: "Apr",
  jun: "Jun",
  jul: "Jul",
  aug: "Aug",
  sep: "Sep",
  sept: "Sep",
  oct: "Oct",
  nov: "Nov",
  dec: "Dec",
};

const formatEducationPeriodLabel = (value) => {
  const text = normalizeInlineText(value || "");
  if (!text) return "";
  if (/present/i.test(text)) return "Present";

  const yearFirst = text.match(/^(\d{4})\s+([a-zA-Z.]+)$/);
  if (yearFirst) {
    const [, year, monthRaw] = yearFirst;
    const monthKey = monthRaw.replace(/\./g, "").toLowerCase();
    const month = MONTH_SHORT_LABEL[monthKey];
    if (month) return `${month} ${year}`;
  }

  const monthFirst = text.match(/^([a-zA-Z.]+)\s+(\d{4})$/);
  if (monthFirst) {
    const [, monthRaw, year] = monthFirst;
    const monthKey = monthRaw.replace(/\./g, "").toLowerCase();
    const month = MONTH_SHORT_LABEL[monthKey];
    if (month) return `${month} ${year}`;
  }

  return text;
};

const buildEducationItem = (item) => {
  const entry = item || {};

  const node = document.createElement("article");
  node.className = "education-timeline-vertical-item";

  const splitPeriod = (value) => {
    const text = normalizeInlineText(value || "");
    if (!text) return { start: "", end: "" };
    const parts = text.split(/\s*-\s*/);
    if (parts.length < 2) {
      return { start: "", end: text };
    }
    return {
      start: normalizeInlineText(parts[0]),
      end: normalizeInlineText(parts.slice(1).join(" - ")),
    };
  };

  const periodInfo = splitPeriod(entry.period || "");
  const endLabel = formatEducationPeriodLabel(periodInfo.end || entry.period || "");
  const startLabel = formatEducationPeriodLabel(periodInfo.start || "");
  const isCurrent = /present/i.test(endLabel);

  const period = document.createElement("div");
  period.className = "education-timeline-vertical-period";

  const periodEnd = document.createElement("span");
  periodEnd.className = "education-timeline-vertical-date";
  periodEnd.textContent = endLabel;
  if (isCurrent) {
    periodEnd.classList.add("is-current");
    node.classList.add("is-current");
  }

  period.appendChild(periodEnd);

  if (startLabel) {
    const periodStart = document.createElement("span");
    periodStart.className = "education-timeline-vertical-date-secondary";
    periodStart.textContent = startLabel;
    period.appendChild(periodStart);
  }

  const track = document.createElement("div");
  track.className = "education-timeline-vertical-track";
  track.setAttribute("aria-hidden", "true");

  const nodeDot = document.createElement("div");
  nodeDot.className = `education-timeline-vertical-node${isCurrent ? " is-active" : ""}`;

  const line = document.createElement("div");
  line.className = "education-timeline-vertical-line";

  track.appendChild(nodeDot);
  track.appendChild(line);

  const summaryParts = [entry.degree, entry.major].filter(
    (value) => normalizeInlineText(value).length
  );

  const titleText = summaryParts.join(", ");

  const center = document.createElement("div");
  center.className = "education-timeline-vertical-content";

  const title = document.createElement("h3");
  title.className = "education-timeline-vertical-title";
  title.innerHTML = renderInlineMarkdown(titleText || entry.institution || "", {
    preserveLineBreaks: false,
  });

  const subAffiliation = document.createElement("p");
  subAffiliation.className = "education-timeline-vertical-sub";
  subAffiliation.innerHTML = renderInlineMarkdown(entry.subAffiliation || "", {
    preserveLineBreaks: false,
  });

  const affiliation = document.createElement("p");
  affiliation.className = "education-timeline-vertical-affiliation";
  affiliation.innerHTML = renderInlineMarkdown(entry.institution || "", {
    preserveLineBreaks: false,
  });

  center.appendChild(title);
  if (affiliation.textContent) {
    center.appendChild(affiliation);
  }
  if (subAffiliation.textContent) {
    center.appendChild(subAffiliation);
  }

  const logoSrc = normalizeInlineText(entry.logo || "");
  const logoWrap = document.createElement("div");
  logoWrap.className = "education-timeline-vertical-logo-wrap";

  if (logoSrc) {
    const logo = document.createElement("img");
    logo.className = "education-timeline-vertical-logo";
    logo.src = encodeURI(logoSrc);
    logo.alt = normalizeInlineText(entry.logoAlt || `${entry.institution || "Institution"} logo`);
    logo.loading = "lazy";
    logo.decoding = "async";
    logoWrap.appendChild(logo);
  }

  node.appendChild(period);
  node.appendChild(track);
  node.appendChild(center);
  node.appendChild(logoWrap);
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
    bioIntro.innerHTML = renderBioCopy(text);
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
