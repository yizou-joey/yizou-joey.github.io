# Repository Guidelines

## Project Structure & Module Organization

This repository is a Vite-powered, multi-page academic website. Entry pages live at the root (`index.html`, `publications.html`, and `404.html`). Edit site content in `contents/*.md`; its accepted fields are defined in `js/site-contracts.js` and documented in `docs/content-schema.md`. Shared rendering and parsing code lives in `js/`, while design tokens and component styles live in `css/styles.css`; `src/styles.css` is the Vite CSS entry point. Put deployable files in `public/files/` and image sources in `assets/original-images/`. Build output is generated in `dist/` and must not be committed.

## Build, Test, and Development Commands

- `npm ci` installs the exact dependencies from `package-lock.json` (CI uses Node 26).
- `npm run dev` optimizes images, then starts the Vite development server.
- `npm run check` validates content schemas, asset paths, HTML/CSS contracts, and generated-image hygiene.
- `npm run build` optimizes images, runs all checks, and creates the production site in `dist/`.
- `npm run preview` rebuilds and serves the production output locally.
- `npm run optimize:images` regenerates optimized assets under `public/files/generated/`.

## Coding Style & Naming Conventions

Use ES modules, two-space indentation, semicolons, and double quotes in JavaScript. Prefer `camelCase` for functions and variables, `UPPER_SNAKE_CASE` for exported constants, and kebab-case for semantic CSS classes. Keep layout and colors in reusable CSS tokens or semantic classes; do not add inline styles, arbitrary Tailwind values, or raw layout utility classes to HTML. Follow `DESIGN.md` for visual decisions. Content entries use `- key: value`; use ISO `YYYY-MM-DD` dates for publications and public-relative asset paths such as `files/materials/paper.pdf`.

## Testing Guidelines

There is no unit-test framework or coverage threshold. Treat `npm run check` and `npm run build` as required regression tests. For visual or interaction changes, inspect all three pages at desktop and mobile widths, test light/dark favicon behavior when relevant, and verify `prefers-reduced-motion: reduce` states. Confirm generated `dist/*.html` contains the expected static content.

## Commit & Pull Request Guidelines

Recent history uses short, imperative summaries such as `Add Sharp image optimization pipeline` and `fix animation in reduce motion settings`. Keep each commit focused and describe the observable change; avoid vague messages such as `refine`. Pull requests should explain the intent and affected pages, link any issue, report `npm run build` results, and include before/after screenshots for visual changes. Do not commit `node_modules/`, `dist/`, temporary files, or generated images outside the designated generated directory.
