export const designPages = Object.freeze({
  "design.html": "overview",
  "design-color.html": "color",
  "design-typography.html": "type",
  "design-space.html": "space",
  "design-material.html": "material",
  "design-links.html": "links",
  "design-components.html": "components",
  "design-principles.html": "accessibility",
});

export default [
  {
    title: "Start",
    items: [
      { id: "overview", title: "Overview", href: "/design.html" },
    ],
  },
  {
    title: "Foundations",
    items: [
      { id: "color", title: "Colour", href: "/design-color.html" },
      { id: "type", title: "Typography", href: "/design-typography.html" },
      { id: "space", title: "Spacing & Shape", href: "/design-space.html" },
      { id: "material", title: "Images & Surfaces", href: "/design-material.html" },
    ],
  },
  {
    title: "Guide",
    items: [
      { id: "links", title: "Links & States", href: "/design-links.html" },
      { id: "components", title: "Academic Components", href: "/design-components.html" },
      { id: "accessibility", title: "Principles", href: "/design-principles.html" },
    ],
  },
];
