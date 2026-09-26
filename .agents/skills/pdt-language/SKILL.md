---
name: pdt-language
description: Use when working on platform design files (*.pdt.md) — ecosystem entities, transactions, learning engines, experiences and MVPs following the Platform Design Toolkit logic.
allowed-tools: Bash(pdt:*), Bash(node bin/pdt.js:*)
---

# PDT Language

A platform design lives in Markdown files (`*.pdt.md`). Prose explains why; typed `:::blocks`
inside ```` ```pdt ```` fences hold the structure that the canvases are rendered from.

## Workflow

1. Inspect the current model: `pdt --dir <workspace> get` and `pdt get <id>`.
2. Before writing a block, run `pdt explain <type>` for its attributes and an example.
3. Work through the toolkit in order — each step builds on the previous one:
   ecosystem (`entity`) → portraits (entity lists) → `motivation` → `channel`/`transaction`
   → `service` + `learning-engine` → `experience` → `mvp`.
4. Give every element its own heading and at least one sentence of prose above its block.
5. Finish with `pdt --dir <workspace> validate` and fix every error. Discuss warnings and hints
   with the human rather than silencing them; if one is intentional, add
   `:::ignore <CODE> <reason> :::` inside a pdt fence in that file.

## Rules of thumb

- Ids are kebab-case with a type prefix: `e-`, `m-`, `ch-`, `t-`, `s-`, `le-`, `x-`, `mvp-`.
- List items (pressures, gains, hypotheses …) are short statements — one sticky each.
- A transaction always connects two *different* entities; `status: potential` marks what the
  platform should make possible.
- Enabling services `support` transactions; empowering services are `steps` of a learning engine.
- Do not invent facts about the ecosystem. Ask the human when pressures, gains or motivations
  are unknown — the design is theirs.

## Commands

```bash
pdt --dir <workspace> validate [--format json]
pdt --dir <workspace> get [id] [--type <type>]
pdt explain [type]
pdt rules
pdt --dir <workspace> serve     # the human watches the canvases update live
```
