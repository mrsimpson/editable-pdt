---
name: pdt42
description: Use when working on a platform design in *.pdt42.md files — ecosystems, entity-roles, motivations, transactions, learning engines, experiences, MVPs and growth, following the Platform Design Toolkit (PDT 2.2).
allowed-tools: Bash(pdt42:*)
---

# pdt42

A platform design lives in Markdown files (`*.pdt42.md`). Prose explains why; typed `:::blocks`
inside ` ```pdt42 ` fences form one connected model that the canvases are drawn from. The
method is the Platform Design Toolkit by Boundaryless (canvases and guides CC BY-SA 4.0).

Platform design is about the _ecosystem_, not about your idea. Keep the interaction with the
human high: entities, motivations and assumptions come from the people in the ecosystem — do not
invent them. When something is unknown, ask.

## Workflow

1. Run `pdt42 guide` to see where the design stands, and `pdt42 next` for the step to work on.
2. Before authoring a step, run `pdt42 guide step <id>` (E1–E7, D1–D8, G1–G5). It names the file
   to write, the elements it depends on, the how-to and a starter template. Create the file yourself.
3. Before writing a block, run `pdt42 explain <type>` for its attributes and an example.
4. Give every element a heading and at least one sentence of prose above its block — one block per
   heading. Start each id with its kind's prefix (`e-farmers`, `t-preorder`; `pdt42 explain <type>`
   names it). Mention other elements in prose by their id (`` `x-weekly-box` ``): the browser
   links it.
   Place the step's canvas in its chapter with a `:::canvas` block (`id`, `canvas`, and `of` for
   canvases drawn per element) — `pdt42 guide step <id>` shows the snippet. The canvas is drawn
   from the model; never describe its content by hand.
5. References are mostly optional, but a reference that is set must resolve. Prefer linking
   (`relationship:`, `motivation:`, `channel:` …) — links are what keep the canvases consistent.
6. Finish with `pdt42 validate` and fix every error. Discuss warnings and hints with the human; if
   one is intentional, put `:::ignore <CODE> <reason> :::` inside a pdt42 fence just before it:
   the directive suppresses the next finding with that code (errors cannot be ignored).
7. Before committing, run `pdt42 diff`: when a block's facts changed, update the prose that
   explains it, and the other way round.

## Commands

```bash
pdt42 guide                    # the method, and this workspace's status per step
pdt42 next                     # what to work on next
pdt42 guide step D2            # one step: file, dependencies, how-to, starter template
pdt42 guide roles              # the five platform roles
pdt42 guide canvas <id>        # which fields fill which canvas area
pdt42 explain [type]           # block reference
pdt42 validate                 # consistency check (exit 1 on errors)
pdt42 diff [<ref>] [--staged]  # a change: blocks and prose changed together? (exit 1 if not)
pdt42 get [id]                 # list elements, or one with what references it
pdt42 rules                    # every rule with its rationale
pdt42 serve                    # the design in the browser, live, with its history (for the human)
pdt42 serve --diff             # the same, showing the uncommitted change
pdt42 build --out site         # a static site; --single-file, --with-history, --diff
```

All commands accept `--dir <workspace>` and `--format json`.
