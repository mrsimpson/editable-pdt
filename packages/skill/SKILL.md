---
name: pdt-language
description: Use when working on a platform design in *.pdt.md files — ecosystems, entity-roles, motivations, transactions, learning engines, experiences, MVPs and growth, following the Platform Design Toolkit (PDT 2.2).
allowed-tools: Bash(pdt:*)
---

# pdt-language

A platform design lives in Markdown files (`*.pdt.md`). Prose explains why; typed `:::blocks`
inside ` ```pdt ` fences form one connected model that the canvases are drawn from. The
method is the Platform Design Toolkit by Boundaryless (canvases and guides CC BY-SA 4.0).

Platform design is about the _ecosystem_, not about your idea. Keep the interaction with the
human high: entities, motivations and assumptions come from the people in the ecosystem — do not
invent them. When something is unknown, ask.

## Workflow

1. Run `pdt guide` to see where the design stands, and `pdt next` for the step to work on.
2. Before authoring a step, run `pdt guide step <id>` (E1–E7, D1–D8, G1–G5). It names the file
   to write, the elements it depends on, the how-to and a starter template. Create the file yourself.
3. Before writing a block, run `pdt explain <type>` for its attributes and an example.
4. Give every element a heading and at least one sentence of prose above its block.
5. References are mostly optional, but a reference that is set must resolve. Prefer linking
   (`relationship:`, `motivation:`, `channel:` …) — links are what keep the canvases consistent.
6. Finish with `pdt validate` and fix every error. Discuss warnings and hints with the human; if
   one is intentional, suppress it for the file with `:::ignore <CODE> <reason> :::` inside a pdt
   fence.

## Commands

```bash
pdt guide                    # the method, and this workspace's status per step
pdt next                     # what to work on next
pdt guide step D2            # one step: file, dependencies, how-to, starter template
pdt guide roles              # the five platform roles
pdt guide canvas <id>        # which fields fill which canvas area
pdt explain [type]           # block reference
pdt validate                 # consistency check (exit 1 on errors)
pdt get [id]                 # list elements, or one with what references it
pdt rules                    # every rule with its rationale
```

All commands accept `--dir <workspace>` and `--format json`.
