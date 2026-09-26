# Development Plan: editable-pdt (feat/pdt-meta-model)

*Workflow: [epcc](https://codemcp.github.io/workflows/workflows/epcc)*

## Goal

Build the foundation of **pdt-language**: a Markdown-plus-DSL format for platform designs that
follows the Platform Design Toolkit (PDT 2.2) methodology, with the same principles as
arc42-language:

- human-readable first (Markdown prose explains *why*),
- machine-verifiable second (typed `:::blocks` form one consistent model),
- guided (the CLI walks humans and agents through the methodology, step by step).

This iteration delivers **the meta-model and the guiding CLI**. Canvases, web editor and docs
site build on it in later iterations and are out of scope here.

## Key Decisions

- **Start from scratch.** The JavaScript prototype (commit `d8a6d2b`) was built without reading the
  PDT sources and its meta-model diverges from the toolkit (wrong portrait fields, no relationships,
  no value units, a learning engine without stages). It stays in history only.
- **Tech stack mirrors arc42-language.** pnpm workspace, TypeScript (strict, `nodenext`,
  `.ts` imports with a `development` condition), **zod 4** schemas as the single source of truth
  (fields, required/optional, enums, cross-references, guidance, all through `.meta()`), and
  vite-plus (`vp test`, `vp check`, `vp pack`).
- **Packages.** `@pdt/core` holds the pure library (AST, parser, schemas, model builder, validator,
  methodology content). `@pdt/cli` holds the `pdt` binary (a thin layer over core). The agent skill
  lives in `packages/skill`.
- **Syntax is the same as arc42.** Fence ```` ```pdt ````, blocks `:::type` … `:::`,
  `key: value` attributes and `:::ignore CODE reason :::`. Reference lists are comma-separated.
  Text lists (portrait gains, assumptions …) use indented `- item` lines, because sticky notes
  contain commas.
- **Entity = entity-role.** PDT clusters concrete entities into roles. The `entity` block is the
  role-cluster: `clusters:` lists the concrete entities it groups, and `role:` is one of the five
  platform roles (owner, stakeholder, peer-consumer, peer-producer, partner). `role` is optional,
  because exploration maps entities before roles are known; a hint asks for it once design starts.
- **Relationship is first-class.** PDT designs around relationships (step D4, one Transactions
  Board per relationship, network properties and liquidity *of a relationship*). Transactions,
  experiences, network properties and liquidity all reference a `relationship`.
- **Learning engine per entity-role**, with PDT's three stages as fields (entry points, then
  onboarding, getting better and new opportunity challenges). Services reference the stage they
  serve.
- **Experience steps are ordered references** to transactions (entity to entity) and services
  (platform to entity), which are PDT's bricks. The channel of each step gives the canvas its
  channel/touchpoint lanes.
- **Assumptions are blocks** that reference their MVP, one row of the MVP canvas each. `kind`
  covers PDT's three mandatory classes: business model, trust, attraction.
- **All three PDT phases are modelled** (Exploration E1–E7, Design D1–D8, Growth G1–G5).
  Design is the core. Every block type names the step that introduces it.
- **Workspace layout by phase**: `1-exploration/`, `2-design/`, `3-growth/`, one file per step
  (e.g. `2-design/d2-portraits.pdt.md`). Any `*.pdt.md` file is read; the layout is a convention
  that `pdt init` and `pdt guide` suggest.
- **Guidance is data.** Phases, steps, canvases (with their areas mapped to model fields) and
  roles live in `@pdt/core` next to the schemas. `pdt guide`, `pdt explain` and `pdt next` render
  them; later the canvases and the docs site do too.
- **Licensing.** PDT canvases and guides are CC BY-SA 4.0 (© Boundaryless SRL). All guidance text is
  written in our own words and links to the source page. Boundaryless's modern pipelines and
  techniques (all rights reserved) are not used.
- **O2A is out of scope.** It models the internal organisation (nodes, offerings, contracts,
  ledgers), which is the 3EO side. It is not PDT's ecosystem design.

## Notes

### Meta-model graph review (types as nodes, reference fields as edges)

- 4 connected components: the main graph (22 types, hubs `entity` 18 inbound, `arena` 8,
  `relationship` 5) plus three islands: `ecosystem` (no edges), `flywheel` (self-edge only),
  `growth-loop` (no edges).
- 13 types have no inbound edge. Nine are legitimate leaves (facts *about* their target:
  motivation, assumption, network, liquidity, learning-engine, play, scenario, asset,
  value-proposition). Four are gaps: `ecosystem`, `brief`, `platform` are three unconnected tops
  (exploration and design meet only through shared entity ids), and `growth-loop` floats.
- Proposed edges: `platform.ecosystem`, `platform.brief`, `flywheel.relationship`,
  `growth-loop.acquires → entity`, `growth-loop.feeds → flywheel`, optional
  `transaction.motivation` and `transaction.job` for traceability. Result: one connected graph
  rooted at `ecosystem → platform`. Open: required or optional (with hint)?

## Explore

### Tasks

*All done.*

### Completed

- [x] Read all three legacy PDT guides (Exploration v1.1, Strategy Design v2.2.1, Growth v1.0) via
      `docs.boundaryless.io/llms-full.txt`
- [x] Read the 19 PDT canvas pages (structure, steps, tips, connections) and the canvas index
- [x] Studied the official canvas artwork of the eight Design-phase canvases (field layout)
- [x] Checked licensing (canvases + legacy guides CC BY-SA 4.0; modern methodology all rights reserved)
- [x] Wrote the findings up as `docs/methodology.md`
- [x] Studied arc42-language's stack (zod `.meta()` schemas, vite-plus, `guide`/`explain` commands,
      `.vibe` plans, commit skill)

### Findings: canvas fields (from the official artwork)

| Canvas | Areas |
| ------ | ----- |
| Ecosystem | ecosystem name; nested arcs by strategic proximity: external stakeholders ⊃ peer consumers ⊃ peer producers ⊃ partners ⊃ platform owners |
| Entity-Role Portrait | role, type; potential: assets, capabilities; compressors: performance pressures, current goals; gains: convenience, access & reach, value |
| Motivations Matrix | roles × roles, "gives to"; diagonal = same-type peers |
| Transactions Board | already happening yes/no · role 1 · transaction (← / →) · role 2 · currency / value unit · channel components · notes on channel improvement |
| Learning Engine | per role (Pa/PP/PC): entry points · onboarding · getting better · catching the new opportunity, each split into challenges / services |
| Platform Experience | step grid × channel/touchpoint lanes; experience name; involved roles (A core, B–E); value proposition for core role; business model: platform activities, resources/components, value provided/cost, value captured/revenues |
| MVP | experiences in the MVP; MVP base; notes on current implementation (concierge, Wizard of Oz); rows: key assumption → how the MVP tests it → criteria for validation → notes |
| Platform Design | owners, stakeholders; enabling (→ partners), empowering (→ peer producers), other services (→ peer consumers); core & ancillary value propositions; infrastructures & core components; transactions; channels & contexts; partners, peer producers, peer consumers |

## Plan

### Meta-model: 25 block types

| Step | Block | Key attributes (→ reference) |
| ---- | ----- | ---------------------------- |
| E1 | `ecosystem` (one) | context: ecosystem-mobilization / product-service-innovation |
| E1 | `arena` | after → arena*, enables → arena*, focus, outcome, steps[] |
| E2 | `job` | arena → arena, entities → entity*, job-step (universal job map) |
| E2/D1 | `entity` | role, layer (long-tail / aggregator / infrastructure), type, clusters[]; portrait: context[], assets[], capabilities[], potential[], goals[], pressures[], convenience-gains[], reach-gains[], value-gains[] |
| E3 | `asset` | vrio: v / vr / vri / vrio, layer, relates-to → entity\|job* |
| E3 | `moat` | kind, layer, holder → entity, arena → arena |
| E5 | `component` | arena → arena, visibility 0–100, evolution, target (to-be evolution), needs → component*, entity → entity |
| E6 | `play` | play: pp1…pp6, arena → arena, affects → component*, insight |
| E7 | `scenario` | pattern: e1…e12, arena → arena, impact |
| E7 | `brief` (one) | arena → arena, entities → entity*, standardize[], product-side[], moats → moat* |
| D1 | `platform` (one) | owners → entity*, core-entity → entity, narrative, core-value, ancillary-values[], infrastructure[] |
| D3 | `motivation` | from → entity, to → entity, gives, status: current / potential, kind |
| D4 | `relationship` | between → entity × 2, core |
| D5 | `channel` | medium, components[], improvement |
| D5 | `transaction` | relationship → relationship, from, to → entity, direction, value-unit, happening, channel → channel, kind |
| D6 | `learning-engine` | entity → entity, entry[], onboarding[], getting-better[], new-opportunity[], evolves-to → entity* |
| D6 | `service` | for → entity*, stage, kind: enabling / empowering / other, supports → transaction*, channel → channel |
| D7 | `experience` | core-entity → entity, roles → entity*, relationship → relationship, value-proposition, steps → transaction\|service*, activities[], resources[], costs[], revenues[] |
| D8 | `mvp` | experiences → experience*, base[], implementation, status |
| D8 | `assumption` | mvp → mvp, kind: business-model / trust / attraction / other, riskiest, test, criteria, status |
| G1 | `value-proposition` | kind: product / marketplace / extension, customer → entity, relationship → relationship, mechanism, bundle[] |
| G2 | `network` | relationship → relationship; the seven properties; curve; tactics (10 tactic ids) |
| G3 | `flywheel` | type (direct / indirect network, scale, brand, tech, data, lock-in), reinforces → flywheel, loop[], bottleneck, metric |
| G4 | `liquidity` | relationship → relationship, canonical-unit, alternatives[], supply-threshold, demand-threshold, start-with, constraints[] |
| G5 | `growth-loop` | type: viral / paid / content / ugc / sales, equation, bottleneck, cycle-time, metric |

### Validation rules

- **Errors** (broken model): E001 duplicate id · E002 unresolved reference / wrong target type ·
  E003 schema violation (missing required, bad enum, bad number) · E004 unknown block / parse error ·
  E005 more than one singleton (`ecosystem`, `platform`, `brief`)
- **Warnings** (contradictions, each quoting the PDT rule it enforces): relationship not between two
  distinct entities · transaction parties outside its relationship · experience core entity not
  part of its relationship · experience step whose transaction involves roles outside the experience ·
  learning step service for another entity · platform owner without `role: owner` · MVP without
  assumptions · block without prose
- **Hints** (methodology gaps, each tied to a step): more than five peer roles (D1) · entity without
  role once design has started (D1) · incomplete portrait (D2) · peer role missing from the
  motivations matrix (D3) · no core relationship / no core entity (D4) · core relationship without
  transactions (D5) · transaction without value unit or channel (D5) · peer role without learning
  engine (D6) · experience without services or without business model (D7) · MVP without riskiest
  assumption or not covering business-model / trust / attraction (D8) · core relationship without
  network properties once growth has started (G2) · flywheels without a core network flywheel (G3) ·
  no focus arena / brief arena not in focus (E4/E7) · asset not fully VRIO (E3)

### CLI

```
pdt guide                  methodology overview + status of each step in this workspace
pdt guide step <E1…G5>     brief, questions, practical steps, tips, blocks, starter template, findings
pdt guide roles            the five platform roles
pdt guide canvas <id>      canvas areas and the model fields that fill them
pdt next                   the step to work on next, and why
pdt explain [type]         block reference derived from the zod schemas
pdt init [dir]             scaffold the phase/step files with guidance comments
pdt validate | get [id] | rules
```

### Tasks

*All done.*

### Completed

- [x] Meta-model, rules and CLI surface planned (above)

## Code

### Tasks

*All done.*

### Completed

- [x] Scaffold workspace: root package.json, pnpm-workspace.yaml (catalog), tsconfig, vite.config.ts
- [x] `@pdt/core`: AST + line parser (fences, blocks, `- item` lists, ignore directives)
- [x] `@pdt/core`: zod schemas with `.meta()` for all 25 block types
- [x] `@pdt/core`: model builder (normalise, validate, element index, incoming references)
- [x] `@pdt/core`: methodology data (phases, steps E1–G5, roles, canvases with areas)
- [x] `@pdt/core`: validator with rule registry (meta + rationale + step)
- [x] `@pdt/core`: step status + next-step recommendation, starter templates
- [x] Graph gaps closed as decided with the user ("like arc42: mostly optional forward edges, but a
      set reference must be valid"): added optional `platform.ecosystem`, `platform.brief`,
      `flywheel.relationship`, `growth-loop.acquires`, `growth-loop.feeds`, `transaction.motivation`,
      `transaction.job`; relaxed `job.arena`, `brief.arena`, `mvp.experiences` to optional. The
      meta-model is now one connected graph (asserted by a test).
- [x] Rules H010 orphan element, H011 unlinked phase handoff, H204 growth element without anchor
- [x] Parser skips HTML comments; starter templates keep guidance and examples inside comments,
      so `pdt init` yields an empty model that starts at D1
- [x] `@pdt/cli`: validate, get, rules, explain, guide (overview/step/roles/canvas), next, init
- [x] Example workspace Harvest Commons: 90 elements across all 20 steps, 0 findings (one hint
      suppressed on purpose to demonstrate `:::ignore`)
- [x] Tests: 33 (parser, schemas incl. connectivity, validator rules, example, templates, CLI)
- [x] Agent skill, README, `docs/meta-model.md` generated from the schemas (drift test)
- [x] `vp check`, `vp test` and `vp pack` green; bundled CLI validates the example

## Commit

### Tasks

*All done.*

### Completed

- [x] WIP commit 3f2e154 (core foundation)
- [x] Final commit: CLI, example, tests, docs; pushed to `claude/platform-meta-model-canvas-sx7u78`

### Open for the next iteration

- Canvas renderers over this model (per-canvas views, `per:` relationship/entity/experience)
- Live editor and docs site (with the side-by-side comparison against the Boundaryless canvases)
- Licence for the repository (the meta-model and guidance carry CC BY-SA's ShareAlike obligation)

---
*This plan is maintained by the LLM. Update task lists as work progresses.*
