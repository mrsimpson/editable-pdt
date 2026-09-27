# pdt42

**Platform design as a language — readable by humans, checkable by machines, guided step by step.**

The [Platform Design Toolkit](https://boundaryless.io/pdt-toolkit/) (PDT) by Boundaryless is a
powerful way to look at ecosystems: who takes part, what they could give each other, which
transactions and learning services a platform should enable, and how to test and grow it. On a
wall, its canvases drift apart within a week. The same entity is spelled three ways, a
transaction appears on one canvas and not on another, and nobody notices.

pdt42 keeps a platform design the way [arc42-language](https://github.com/docToolchain/arc42-language)
keeps an architecture:

- **Human-readable first.** Markdown files (`*.pdt42.md`) with prose explaining _why_, and typed
  `:::blocks` for the structure.
- **One consistent model.** Twenty-five block types, from arenas to growth loops, connected by
  references. The canvases are views over this model, not separate documents.
- **Guided by the method.** `pdt42 guide` walks you through PDT's three phases and twenty steps and
  shows where your design stands.
- **Canvases drawn from the model.** Every chapter places its step's canvas with a `:::canvas`
  block; `pdt42 serve` draws it from the model, and every sticky links to its element.

````markdown
## Farmer ↔ restaurant

High volume, planned months ahead: the relationship that lets farms sow against demand.

```pdt42
:::relationship
id: r-farmer-restaurant
title: Farmer ↔ restaurant
between: e-farmers, e-restaurants
core: yes
:::
```
````

## Try it

```bash
npm install -g @pdt42/cli       # or run any command with npx @pdt42/cli …
pdt42 guide                     # the method, and where your design stands
pdt42 next                      # the step to work on next, and why
pdt42 guide step D1             # one step: file, dependencies, how-to, starter template
pdt42 explain transaction       # one block type
pdt42 validate                  # consistency check
pdt42 serve                     # read it in the browser, live
```

pdt42 keeps no state of its own. `guide` and `next` work out where the design stands from the
Markdown files on every run: which blocks exist, and which findings are still open. Change a
file and the next step changes with it; the files you commit are the whole design and its
progress.

From a clone, `pnpm install && pnpm build`, then `pnpm pdt42 --dir examples/harvest-commons guide`
runs the CLI from source on the example.

## See it

`pdt42 serve` renders the workspace in the browser and reloads on every change;
`pdt42 build --out site` writes the same as a static site (`--single-file`: one HTML page).

- **Chapters** follow the method: the sidebar lists the phases and steps with their status.
- **Prose and model box.** Click the stripe beside an element's prose to swap it for its model
  box — attributes, incoming references, findings, and every canvas the element appears on.
- **Coming from the PDT?** The site's `canvases/` page puts each original canvas next to
  pdt42's and lists the block and field behind every area of it.
- **Canvases** are drawn from the model, in PDT's colours (yellow services, blue transactions,
  one colour per platform role). Every sticky is a link to its element; `#<file>:el-<id>` opens
  the model box.
- **Agent view** shows the chapter as the source the agent reads and writes.

A chapter without its canvas gets a warning (W011) naming the `:::canvas` block to add:

````markdown
```pdt42
:::canvas
id: cv-board-restaurant
canvas: transactions-board
of: r-farmer-restaurant
:::
```
````

## The method, in the model

| Phase                                              | Steps                                                                                                                                 | Blocks                                                                                                                              |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Exploration — _is there an opportunity?_           | E1 arenas · E2 scan · E3 assets & moats · E4 focus · E5 value chain · E6 platform plays · E7 brief                                    | `ecosystem` `arena` `job` `asset` `moat` `component` `play` `scenario` `brief`                                                      |
| Strategy Design — _how do we design the platform?_ | D1 ecosystem · D2 portraits · D3 motivations · D4 core relationships · D5 transactions · D6 learning engine · D7 experiences · D8 MVP | `platform` `entity` `motivation` `relationship` `channel` `transaction` `learning-engine` `service` `experience` `mvp` `assumption` |
| Growth — _how do we launch and grow it?_           | G1 strategy model · G2 network properties · G3 flywheels · G4 liquidity · G5 growth loops                                             | `value-proposition` `network` `flywheel` `liquidity` `growth-loop`                                                                  |

- [`docs/methodology.md`](docs/methodology.md) summarises the PDT as this project reads it.
- [`docs/meta-model.md`](docs/meta-model.md) is generated from the schemas: every block, attribute
  and reference.

## Validation

`pdt42 validate` reports three levels, each rule with its rationale (`pdt42 rules`):

- **Errors: the model is broken.** Duplicate ids, references that don't resolve (references are
  mostly optional, but a reference that is set must point to an existing element of the right
  type), schema violations, unknown blocks, more than one platform.
- **Warnings: the model contradicts the method.** A transaction outside its relationship, an
  experience whose steps involve roles it doesn't list, a learning engine for a stakeholder, an MVP
  without assumptions, a chapter without its canvas.
- **Hints: the design has a gap the method would fill.** Incomplete portraits, peers missing from
  the motivations matrix, core relationships without transactions, experiences without a business
  model, MVPs that don't test business model, trust and attraction, orphan elements.

## For agents

pdt42 is built to be driven by a coding agent, with a human in the conversation.
`packages/skill/SKILL.md` (linked as `.agents/skills/pdt42`) teaches coding agents the
format and the workflow; the CLI hands them the method one step at a time (`next`,
`guide step`, `explain`, `validate`, most with `--format json`).

A session looks like this: `next` names D1, `guide step D1` briefs it, the agent writes the
chapter, `validate` reports the missing canvas, the agent adds it, and `next` moves on to D2.

## Development

pnpm workspace, TypeScript, [zod](https://zod.dev) schemas as the single source of truth, and
[vite-plus](https://viteplus.dev) (`vp`) for tests, lint, type-check and packaging. Work is planned
in `.vibe/` following the EPCC workflow (explore, plan, code, commit).

```bash
pnpm test            # vp test
pnpm check           # vp check: format, lint, types
pnpm build           # web app, CLI bundle (with the web app beside it), landing page
pnpm docs:meta-model # regenerate docs/meta-model.md
pnpm demo            # the demo: walkthrough video, screenshots and CLI session into demo/
pnpm demo:cli        # only the recorded CLI session (demo/cli-session.json)
pnpm site            # landing page + the example, in packages/site/dist
```

The site is served by GitHub Pages from the `gh-pages` branch: `main` at the root, and every pull
request that changes the site (landing page, web app, example or demo) as a preview under
`pr-preview/pr-<number>/`. The preview's link is commented on the pull request and it is removed
when the pull request closes.

The web app mirrors arc42-language's: React, marked for prose, vite-plugin-singlefile for
`--single-file`. `pnpm demo` is a Playwright project: it records the walkthrough (`demo/demo.webm`)
and takes the site's screenshots.

```
packages/core   parser, zod schemas, model builder, validator, methodology data, progress
packages/cli    the pdt42 command
packages/web    the browser view: chapters, model boxes, canvases (pdt42 serve / build)
packages/site   the landing page
packages/skill  the agent skill
demo/           video and screenshots of the demo (packages/web/tests/demo.spec.ts) and the recorded
                CLI session (packages/cli/tests/session.ts), used by the site
examples/       Harvest Commons, a complete design across all three phases
```

## Credits and licence

pdt42 builds on the [Platform Design Toolkit](https://www.boundaryless.io/pdt-toolkit/) (PDT) by
Boundaryless SRL, whose canvases and guides are licensed
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The meta-model, the guidance
and the canvas renderings adapt the toolkit, so pdt42 is shared under the same licence:
**[CC BY-SA 4.0](LICENSE)** — code, documentation, example and site alike.

- **Attribution.** When you share pdt42 or something adapted from it, credit the Platform Design
  Toolkit by Boundaryless and pdt42, link the licence, and say what you changed. The pages that
  `pdt42 serve` and `pdt42 build` render carry this attribution.
- **ShareAlike.** Adaptations must be shared under CC BY-SA 4.0 (or a compatible licence).
- The guidance text is written in our own words and links to the original pages; the canvases
  are pdt42's own renderings of the method, not copies of the Boundaryless artwork.
- The site's [PDT canvases page](packages/site/canvases/) shows each original canvas next to
  pdt42's, for readers who know the toolkit. The originals are Boundaryless's images, resized
  (`packages/site/canvases/originals/`), © Boundaryless SRL, CC BY-SA 4.0, credited on the page
  and linked to their source.

pdt42 is not affiliated with or endorsed by Boundaryless.
