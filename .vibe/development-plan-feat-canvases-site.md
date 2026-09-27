# Development Plan: pdt42 (feat/canvases-site)

*Workflow: [epcc](https://codemcp.github.io/workflows/workflows/epcc)*

## Goal

Make the platform design visible and readable, the way arc42-language makes an architecture
readable — and build the landing page on it.

1. **Rename to pdt42** everywhere inside the repository (the GitHub repository is renamed by the
   owner afterwards).
2. **Web renderer** (`pdt42 serve`, `pdt42 build`): the workspace as a navigable document where every
   element's prose can be swapped with its **model box** (element card), as in arc42.
3. **Canvases on every chapter**: a `:::canvas` block places the step's PDT canvas in its chapter;
   the canvas is drawn from the model, and every element on it links to its section in the
   rendered Markdown. A new warning flags chapters without their canvas.
4. **Landing page** in arc42's style with an orange highlight, illustrated with screenshots captured
   by a Playwright demo scenario on the Harvest Commons example.

Drift detection is out of scope: tracked as issue #2.

## Key Decisions

- **Names.** Brand `pdt42`; CLI `pdt42`; fence ```` ```pdt42 ````; files `*.pdt42.md`; packages
  `@pdt42/core`, `@pdt42/cli`, `@pdt42/web`, `@pdt42/site`; skill `pdt42`.
- **Canvases are views, not elements.** `:::canvas` blocks (`id`, `canvas`, optional `of`) are parsed
  like arc42's `:::diagram` blocks into workspace views, not into the element model — they would
  otherwise distort the meta-model graph, orphan rule and step progress. They have no source:
  the canvas is generated from the model, which is the whole point (no drift between canvas and
  model). `of` scopes canvases that exist once per element (portrait → entity, transactions board →
  relationship, experience → experience, MVP → mvp, Wardley map → arena, network properties and
  liquidity → relationship).
- **Which canvas a chapter needs** is data on the step (`StepInfo.canvas`), with the scoping rule for
  per-element canvases (e.g. one board per core relationship, one portrait per peer role).
  D4 has no PDT canvas. The Pattern Cards and Platform Design Canvas are optional.
- **Rules.** E006 invalid canvas (unknown canvas, `of` missing/unresolved/wrong type);
  W011 chapter without its canvas (step has elements but its canvas is not placed, or a scoped
  element has no canvas of its own).
- **Web structure mirrors arc42's `packages/web`** (Sidebar, DocumentView with prose runs,
  ElementCard, hash router), with a payload built by `@pdt42/core` (`toPayload`) and served at
  `/api/workspace` or injected as `window.__WORKSPACE__` by `build`. Hash routing
  `#<file>:el-<id>` auto-expands the target element's model box, exactly like arc42. Human/agent
  view toggle shows the DSL source.
- **No React (deviation).** The environment's network policy blocks the npm registry, so React,
  marked and the vite plugins could not be installed. The web app uses a tiny JSX factory building
  DOM nodes (`src/dom.ts`), its own small Markdown renderer, and an inline single-file plugin —
  only packages already in the lockfile. Components keep React's shape, so switching later is
  mechanical. The landing page is static HTML with a small script (theme, method map from core).
- **Canvas renderers** are components, one per canvas, drawing stickies coloured by platform
  role and flow; every sticky is an anchor to `#<file>:el-<id>`. The model box lists the canvases
  an element appears on, so links go both ways.
- **W011 shows in the chapter header** as well as on the element it is anchored to.
- **Demo** is a plain script (`scripts/demo.ts`) using `playwright` (global install via
  `PLAYWRIGHT_MODULE`), not a `@playwright/test` project: screenshots only, no video.
- **Colour.** Accent burnt orange `#E8590C` (bright, for accents, dark mode links) and `#C2410C`
  (text links on white, WCAG AA) — related to, but distinct from, the Boundaryless coral.
- **Site mirrors arc42's `packages/site`** (Nav, Hero, story, features, getting started, live example,
  footer). Screenshots come from a Playwright demo spec (`pnpm demo`) run against
  `pdt42 serve examples/harvest-commons`, stored in `demo/`.
- **Agent positioning** on the site: agents spar, research and keep method and model in order;
  innovation stays human.

## Explore

### Completed

- [x] arc42 web: ProseRun stripe toggles prose ↔ ElementCard; agent view shows source;
      diagrams link nodes to `#file:el-id`; hash router auto-expands the target card
- [x] arc42 CLI: `serve` (http server, `/api/workspace`, SSE reload, SPA fallback) and `build`
      (`window.__WORKSPACE__` injection, single-file variant via vite-plugin-singlefile)
- [x] arc42 site: React + vite, components Nav/Hero/GettingStarted/FeatureStrip/LiveSection/Footer,
      design tokens in styles.css, light/dark theme
- [x] arc42 demo: Playwright project `demo` (headed, video), cursor overlay, screenshots per moment
- [x] Drift detection issue created: mrsimpson/editable-pdt#2

## Plan

### Tasks

*All done.*

## Code

### Tasks

- [ ] Side-by-side comparison with the official Boundaryless canvases (earlier request; needs the
      canvas images and attribution — not started)
- [ ] Move the web app to React once the npm registry is reachable (optional)

### Completed

- [x] Rename to pdt42 (packages, bin, fence, extension, skill, docs, example files, tests)
- [x] Core: `:::canvas` views (CanvasBlockSchema, `canvasScope`), `StepInfo.canvas`, rules E006 invalid
      canvas and W011 chapter without its canvas (per element for per-element canvases, in the
      step's own chapter file), canvas snippet in starter templates, `toPayload()`
- [x] Example: 28 canvases placed across the 18 chapters; all Wardley components in the focus arena
- [x] Web: app shell (sidebar by phase/step with status, chapter view, findings), prose ↔ model box,
      agent view, hash routing, theme, live reload; canvas renderers for all 20 canvases
- [x] CLI: `pdt42 serve` (live reload) and `pdt42 build [--single-file]`; web app copied into the
      CLI bundle
- [x] Demo: `pnpm demo` captures nine moments and every canvas into `demo/`
- [x] Site: landing page with the story, agent positioning, method map, canvases, getting started
- [x] Workflows: CI (build, check, test, validate the example) and GitHub Pages (site + example)
- [x] `vp check`, `vp test` (59 tests), build green

## Commit

### Tasks

### Completed

- [x] Commit per milestone (rename · canvases in core · CLI serve/build · web · demo + site), pushed
