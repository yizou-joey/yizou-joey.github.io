tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        serifSc: ["Noto Serif SC", "serif"],
      },
      colors: {
        ink: "#15120f",
        muted: "#787774",
        paper: "#f7f4ef",
        stone: "#f6f5f4",
        line: "#e9e7e3",
        chip: "#262189",
      },
      boxShadow: {
        card: "1px 1px 1px 0px rgba(0,0,0,0.25)",
      },
      spacing: {
        section: "60px",
        "section-md": "80px",
        "section-py": "50px",
        "section-py-md": "60px",
      },
    },
  },
};
