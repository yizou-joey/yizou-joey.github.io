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

## Remote Preview and UI Verification

- Follow `docs/remote-preview.md`. Default to direct HTTP via the server's Tailscale IP and explicit port; label loopback URLs as development-machine-only. Serve HTTPS was rolled back after Mac-side access/resource issues; do not reintroduce it without a request.
- Run Vite with `--host 0.0.0.0` in a named tmux session and a fixed `--strictPort` port. Use separate ports for concurrent worktrees; page resources and WebSocket hot updates share that origin.
- Before reusing a port, inspect its process and working directory. Keep the requested preview running; do not stop other sessions' servers. Record current machine/port assignments in `/home/joey/dev/website/README.md`.
- Confirm page routes, assets and hot updates through the shared remote URL. Distinguish server-side verification from actual Mac browser verification; a localhost HTTP 200 is not sufficient.
- Before tuning UI spacing, inspect computed styles and element bounds. Check baselines, image occupancy and the entire surrounding row at desktop/mobile widths, rather than judging an icon or label in isolation.

## Coding Style & Naming Conventions

Use ES modules, two-space indentation, semicolons, and double quotes in JavaScript. Prefer `camelCase` for functions and variables, `UPPER_SNAKE_CASE` for exported constants, and kebab-case for semantic CSS classes. Before changing UI, inspect and reuse the tokens and semantic class families in `css/styles.css`, which is the source of truth for visual implementation; use `DESIGN.md` only for intent and boundaries. Do not add inline styles, arbitrary Tailwind values, or raw layout utility classes to HTML. Content modules export plain arrays or strings; use ISO `YYYY`, `YYYY-MM`, or `YYYY-MM-DD` dates and public-relative asset paths such as `files/materials/paper.pdf`.

Before changing a style, inventory its semantic behavior family across source entries, renderers, shared styles and overrides, and final build pages. Promote an accepted experiment back to its shared primitive and remove temporary scopes; document exceptions by responsibility rather than copying states into each page. See `docs/link-interactions.md` for the current link family map.

## Testing Guidelines

There is no unit-test framework or coverage threshold. Run `npm run check` before merging; it includes `npm run build`, so a separate build is unnecessary unless subsequent changes require another validation. For visual or interaction changes, inspect all published pages at desktop and mobile widths, test light/dark favicon behavior when relevant, and verify `prefers-reduced-motion: reduce` states. Confirm generated `dist/*.html` contains the expected static content.

For a shared behavior, verify each kind of instance across affected pages, single and wrapped lines, input methods, themes, and reduced motion as applicable; a screenshot of the current page alone is not family-wide acceptance.

## Commit & Pull Request Guidelines

Use short-lived branches for delivery goals, not for individual requests, conversation turns, or independently reviewable steps. Before editing, inspect the current branch, working tree, and commits relative to `main`. Reuse the current branch when a task continues its unmerged goal or depends on its changes. Record meaningful development steps as separate commits within that branch. Conversation boundaries do not determine branch boundaries.

Create a new branch only when a goal needs to be merged, deferred, or abandoned independently, or when the user explicitly requests one. Start independent goals from the latest `main` using `codex/<goal>` names; check remote updates before branching. Do not create branches from unmerged feature branches by default. If dependent changes require separate delivery stages, first establish their dependencies and merge order. If unrelated work must proceed before the current goal is ready, isolate it in a separate worktree.

Chinese-site work is deferred. Preserve `codex/chinese-typography` for future reference, but do not resume it, merge its changes, or include Chinese-site updates in ordinary tasks unless the user explicitly requests them. The deferred branch is not a starting point for new work.

Read-only tasks do not require branches. Do not automatically discard, stash, or commit existing changes just to switch tasks. Small text or link fixes may go directly to `main`; fixes that continue the current branch's goal should remain on that branch.

Before merging, run the required checks and optionally consolidate trial-and-error commits while preserving meaningful development steps. Merge with `git merge --no-ff <branch>` and name the delivery goal in the merge message. Delete completed branches after confirming they are merged. Start the next goal from the updated `main`; do not rewrite existing `main` history for visual consistency. Use `git log --first-parent --oneline main` to review delivery milestones. A long-lived `develop` branch and a PR for every change are not required.

Recent history uses short, imperative summaries such as `Add Sharp image optimization pipeline` and `fix animation in reduce motion settings`. Keep each commit focused and describe the observable change; avoid vague messages such as `refine`. Pull requests should explain the intent and affected pages, link any issue, report `npm run check` results (including the production build), and include before/after screenshots for visual changes. Do not commit `node_modules/`, `dist/`, temporary files, or generated images outside the designated generated directory.
