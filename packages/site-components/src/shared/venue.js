const VENUE_REGISTRY = Object.freeze({
  "ieee-vr": Object.freeze({ className: "venue-ieee-vr" }),
  mmsys: Object.freeze({ className: "venue-mmsys" }),
  ismar: Object.freeze({ className: "venue-ismar" }),
});

export const getVenueConfig = (venueKey) => {
  const normalizedKey = String(venueKey || "").trim().toLowerCase();
  return VENUE_REGISTRY[normalizedKey] || null;
};

export const normalizeVenueKey = (entry) => {
  const explicit = String(entry?.venueKey || "").trim().toLowerCase();
  if (explicit) return explicit;
  return String(entry?.venue || "").trim().toLowerCase().includes("ieee vr") ? "ieee-vr" : "";
};
