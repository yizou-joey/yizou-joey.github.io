# Repository Guidelines

## Project Structure & Module Organization

This repository is a Vite-powered, multi-page academic website. Entry pages live at the root (`index.html`, `publications.html`, and `404.html`). Edit site content in the single-section ES modules under `contents/*.js`; authoring conventions are documented in `docs/content-schema.md`. Shared rendering helpers live in `js/`, while design tokens and component styles live in `css/styles.css`; `src/styles.css` is the Vite CSS entry point. Put deployable files in `public/files/` and image sources in `assets/original-images/`. Build output is generated in `dist/` and must not be committed.

## Build, Test, and Development Commands

- `npm ci` installs the exact dependencies from `package-lock.json` (CI uses Node 26).
- `npm run dev` optimizes images, then starts the Vite development server.
- `npm run check` runs the complete production build and rendered-reference checks.
- `npm run build` optimizes images, creates the production site in `dist/`, and verifies generated pages and local asset references.
- `npm run preview` rebuilds and serves the production output locally.
- `npm run optimize:images` regenerates optimized assets under `public/files/generated/`.

## Coding Style & Naming Conventions

Use ES modules, two-space indentation, semicolons, and double quotes in JavaScript. Prefer `camelCase` for functions and variables, `UPPER_SNAKE_CASE` for exported constants, and kebab-case for semantic CSS classes. Before changing UI, inspect and reuse the tokens and semantic class families in `css/styles.css`, which is the source of truth for visual implementation; use `DESIGN.md` only for intent and boundaries. Do not add inline styles, arbitrary Tailwind values, or raw layout utility classes to HTML. Content modules export plain arrays or strings; use ISO `YYYY`, `YYYY-MM`, or `YYYY-MM-DD` dates and public-relative asset paths such as `files/materials/paper.pdf`.

## Testing Guidelines

There is no unit-test framework or coverage threshold. Run `npm run check` before merging; it includes `npm run build`, so a separate build is unnecessary unless subsequent changes require another validation. For visual or interaction changes, inspect all three pages at desktop and mobile widths, test light/dark favicon behavior when relevant, and verify `prefers-reduced-motion: reduce` states. Confirm generated `dist/*.html` contains the expected static content.

## Commit & Pull Request Guidelines

Use short-lived branches for delivery goals, not for individual requests, conversation turns, or independently reviewable steps. Before editing, inspect the current branch, working tree, and commits relative to `main`. Reuse the current branch when a task continues its unmerged goal or depends on its changes. Record meaningful development steps as separate commits within that branch. Conversation boundaries do not determine branch boundaries.

Create a new branch only when a goal needs to be merged, deferred, or abandoned independently, or when the user explicitly requests one. Start independent goals from `main` using `codex/<goal>` names. Do not create branches from unmerged feature branches by default. If dependent changes require separate delivery stages, first establish their dependencies and merge order. If unrelated work must proceed before the current goal is ready, isolate it in a separate worktree.

Read-only tasks do not require branches. Do not automatically discard, stash, or commit existing changes just to switch tasks. Small text or link fixes may go directly to `main`; fixes that continue the current branch's goal should remain on that branch.

Before merging, run the required checks and optionally consolidate trial-and-error commits while preserving meaningful development steps. Merge with `git merge --no-ff <branch>` and name the delivery goal in the merge message. Delete completed branches after confirming they are merged. Start the next goal from the updated `main`; do not rewrite existing `main` history for visual consistency. Use `git log --first-parent --oneline main` to review delivery milestones. A long-lived `develop` branch and a PR for every change are not required.

Recent history uses short, imperative summaries such as `Add Sharp image optimization pipeline` and `fix animation in reduce motion settings`. Keep each commit focused and describe the observable change; avoid vague messages such as `refine`. Pull requests should explain the intent and affected pages, link any issue, report `npm run check` results (including the production build), and include before/after screenshots for visual changes. Do not commit `node_modules/`, `dist/`, temporary files, or generated images outside the designated generated directory.
