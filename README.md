# pdt-language

**Platform design as a language — readable by humans, checkable by machines, guided step by step.**

The [Platform Design Toolkit](https://boundaryless.io/pdt-toolkit/) (PDT) by Boundaryless is a
powerful way to look at ecosystems: who takes part, what they could give each other, which
transactions and learning services a platform should enable, and how to test and grow it. On a
wall, its canvases drift apart within a week. The same entity is spelled three ways, a
transaction appears on one canvas and not on another, and nobody notices.

pdt-language keeps a platform design the way [arc42-language](https://github.com/docToolchain/arc42-language)
keeps an architecture:

- **Human-readable first.** Markdown files (`*.pdt.md`) with prose explaining _why_, and typed
  `:::blocks` for the structure.
- **One consistent model.** Twenty-five block types, from arenas to growth loops, connected by
  references. The canvases are views over this model, not separate documents.
- **Guided by the method.** `pdt guide` walks you through PDT's three phases and twenty steps and
  shows where your design stands.

````markdown
## Farmer ↔ restaurant

High volume, planned months ahead: the relationship that lets farms sow against demand.

```pdt
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
pnpm install
pnpm pdt --dir examples/harvest-commons guide       # the method, and the example's status
pnpm pdt --dir examples/harvest-commons validate
pnpm pdt guide step D5                               # one step's brief
pnpm pdt explain transaction                         # one block type
pnpm pdt --dir my-platform init                      # start your own
```

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

`pdt validate` reports three levels, each rule with its rationale (`pdt rules`):

- **Errors: the model is broken.** Duplicate ids, references that don't resolve (references are
  mostly optional, but a reference that is set must point to an existing element of the right
  type), schema violations, unknown blocks, more than one platform.
- **Warnings: the model contradicts the method.** A transaction outside its relationship, an
  experience whose steps involve roles it doesn't list, a learning engine for a stakeholder, an MVP
  without assumptions.
- **Hints: the design has a gap the method would fill.** Incomplete portraits, peers missing from
  the motivations matrix, core relationships without transactions, experiences without a business
  model, MVPs that don't test business model, trust and attraction, orphan elements.

## For agents

`packages/skill/SKILL.md` (linked as `.agents/skills/pdt-language`) teaches coding agents the
format and the workflow.

## Development

pnpm workspace, TypeScript, [zod](https://zod.dev) schemas as the single source of truth, and
[vite-plus](https://viteplus.dev) (`vp`) for tests, lint, type-check and packaging. Work is planned
in `.vibe/` following the EPCC workflow (explore, plan, code, commit).

```bash
pnpm test            # vp test
pnpm check           # vp check: format, lint, types
pnpm build           # bundles packages/cli/dist/cli.mjs
pnpm docs:meta-model # regenerate docs/meta-model.md
```

```
packages/core   parser, zod schemas, model builder, validator, methodology data, progress
packages/cli    the pdt command
packages/skill  the agent skill
examples/       Harvest Commons, a complete design across all three phases
```

## Credits and licence

The Platform Design Toolkit is © Boundaryless SRL. Its canvases and guides are licensed
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The guidance text in this
repository is written in our own words and links to the original pages. Because the meta-model
and the guidance adapt the toolkit's structure, they carry the ShareAlike obligation; the licence
for this repository is not chosen yet. This project is not affiliated with or endorsed by
Boundaryless.

```

```
