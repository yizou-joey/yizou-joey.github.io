const isEducationMobileLayout = () => window.matchMedia("(max-width: 767px)").matches;

const updatePeriodConnector = (period) => {
  if (!period) return;

  const connector = period.querySelector(".education-item-period-connector");
  const periodEnd = period.querySelector(".education-item-period-end");
  const periodStart = period.querySelector(".education-item-period-start");

  if (!connector || !periodEnd || !periodStart || !periodStart.textContent.trim()) {
    return;
  }

  if (isEducationMobileLayout()) {
    connector.style.width = "0";
    connector.style.left = "0";
    connector.style.top = "0";
    connector.style.transform = "rotate(0deg)";
    return;
  }

  const periodRect = period.getBoundingClientRect();
  const endRect = periodEnd.getBoundingClientRect();
  const startRect = periodStart.getBoundingClientRect();

  const x1 = endRect.left - periodRect.left + endRect.width / 2;
  const y1 = endRect.bottom - periodRect.top;
  const x2 = startRect.left - periodRect.left + startRect.width / 2;
  const y2 = startRect.top - periodRect.top;

  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  const length = Math.hypot(deltaX, deltaY);

  if (length < 1) {
    connector.style.width = "0";
    return;
  }

  const angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
  connector.style.left = `${x1}px`;
  connector.style.top = `${y1}px`;
  connector.style.width = `${length}px`;
  connector.style.transform = `rotate(${angle}deg)`;
};

const updateAllPeriodConnectors = () => {
  const periods = document.querySelectorAll(".education-item-period");
  periods.forEach(updatePeriodConnector);
};

let periodConnectorResizeBound = false;

const ensurePeriodConnectorAutoLayout = () => {
  if (periodConnectorResizeBound) return;
  window.addEventListener("resize", () => {
    updateAllPeriodConnectors();
  });
  periodConnectorResizeBound = true;
};

const buildEducationItem = (item) => {
  const entry = item || {};

  const node = document.createElement("article");
  node.className = "education-timeline-item";

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

  const period = document.createElement("div");
  period.className = "education-item-period";

  const periodEnd = document.createElement("p");
  periodEnd.className = "education-item-period-end";
  periodEnd.textContent = periodInfo.end || normalizeInlineText(entry.period || "");
  if (/present/i.test(periodEnd.textContent)) {
    periodEnd.classList.add("is-current");
  }

  const periodStart = document.createElement("p");
  periodStart.className = "education-item-period-start";
  periodStart.textContent = periodInfo.start || "";

  const periodConnector = document.createElement("span");
  periodConnector.className = "education-item-period-connector";

  period.appendChild(periodEnd);
  period.appendChild(periodConnector);
  if (periodStart.textContent) {
    period.appendChild(periodStart);
  }

  const summaryParts = [entry.degree, entry.major].filter(
    (value) => normalizeInlineText(value).length
  );

  const titleText = summaryParts.join(", ");

  const center = document.createElement("div");
  center.className = "education-item-center";

  const title = document.createElement("h3");
  title.className = "education-item-title";
  title.innerHTML = renderInlineMarkdown(titleText || entry.institution || "", {
    preserveLineBreaks: false,
  });

  const subAffiliation = document.createElement("p");
  subAffiliation.className = "education-item-subaffiliation";
  subAffiliation.innerHTML = renderInlineMarkdown(entry.subAffiliation || "", {
    preserveLineBreaks: false,
  });

  const affiliation = document.createElement("p");
  affiliation.className = "education-item-affiliation";
  affiliation.innerHTML = renderInlineMarkdown(entry.institution || "", {
    preserveLineBreaks: false,
  });

  center.appendChild(title);
  if (subAffiliation.textContent) {
    center.appendChild(subAffiliation);
  }
  if (affiliation.textContent) {
    center.appendChild(affiliation);
  }

  const logoSrc = normalizeInlineText(entry.logo || "");
  const logoWrap = document.createElement("div");
  logoWrap.className = "education-item-logo-wrap";

  if (logoSrc) {
    const logo = document.createElement("img");
    logo.className = "education-item-logo";
    logo.src = encodeURI(logoSrc);
    logo.alt = normalizeInlineText(entry.logoAlt || `${entry.institution || "Institution"} logo`);
    logo.loading = "lazy";
    logo.decoding = "async";
    logoWrap.appendChild(logo);
  }

  node.appendChild(period);
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

    ensurePeriodConnectorAutoLayout();
    requestAnimationFrame(() => {
      updateAllPeriodConnectors();
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        requestAnimationFrame(() => {
          updateAllPeriodConnectors();
        });
      });
    }
  } catch {
    renderError(
      educationList,
      '<p class="type-body-sm text-muted">Education unavailable.</p>'
    );
  }
};

renderBioPageIntro();
renderEducationTimeline();
