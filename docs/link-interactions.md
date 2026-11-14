# Link interaction families

`css/styles.css` owns the shared interaction; this map describes the current build, not every HTML file in the repository. Vite's `rollupOptions.input` in `vite.config.js` publishes `index.html`, `404.html`, and project URLs from `contents/publications.js`: currently `dodgeui.html` and `contextual-recovery.html`. `publications.html`, `cv.html`, and `spatial-study.html` are not current build inputs; shared renderer consumers must still be considered when they return to use.

## Ordinary underlines

- `.inline-link`: `js/utils.js` renders inline Markdown and News venue links, while `js/renderers.js` renders Bio, News, Teaching and other lists. Project headings use `renderProjectHeadingHtml` and the same utilities for workshop links; repository-authored project details can use the class. Legacy consumers of the shared renderer inherit the same behavior.
- `.contact-link-label`: the label is underlined, but its parent `.contact-link` owns hover, press, and keyboard focus. The home page authors these in `index.html`.
- `.error404-link`: authored in `404.html`; its muted text becomes ink on hover and focus, independently of the shared decoration.

Native text decoration supports wrapped text. All three use a 1px line, rest offset `0.15em`, hover offset `0.2em` with 140ms `cubic-bezier(0.32, 0.72, 0, 1)`, and press offset `0.175em` over 100ms with immediate ink decoration. Hover and focus use the contextual underline accent when supplied, otherwise the ink decoration token; focus is immediate and has a visible outline. Venue text and hover accents in News and project workshop labels remain contextual. Reduced motion keeps the rest offset and immediate color feedback in every state.

## Deliberate exceptions

- Services links with `aria-describedby` also carry `.inline-link`, but `.service-event` draws their underline and tooltip connector as coordinated pseudo-elements. They are excluded from ordinary decoration states; their focus, press, tooltip, and reduced-motion rules remain component-owned. Other service inline links retain ordinary decoration.
- `.publication-bracket-links` own their arrow, revealed line and press treatment. `.publication-project-link` owns its preview and title treatment. Navigation and theme controls have separate roles and feedback. Do not unify these via a global `a` interaction rule.

When this family changes, verify each ordinary category and the exception boundaries on the built pages, including News and workshop accents, parent-driven contact states, 404, keyboard, pointer/touch, both themes, reduced motion, and single-line and wrapped text.
