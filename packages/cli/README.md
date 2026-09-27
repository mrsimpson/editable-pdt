# pdt42

**Platform design as a language — readable by humans, checkable by machines, guided step by step.**

pdt42 keeps a platform design in Markdown files (`*.pdt42.md`): prose explaining _why_, and typed
blocks forming one consistent model — from arenas and entity-roles to transactions, learning
engines, experiences and growth loops. Every canvas of the
[Platform Design Toolkit](https://www.boundaryless.io/pdt-toolkit/) is drawn from that model, so
the canvases never disagree. Explore, design and grow the platform together with your agent.

```bash
npx @pdt42/cli guide            # the method, and where your design stands
npx @pdt42/cli guide step D1    # one step: file, dependencies, how-to, starter template
npx @pdt42/cli next             # what to work on next
npx @pdt42/cli validate         # consistency check (exit 1 on errors)
npx @pdt42/cli serve            # chapters, model boxes and canvases in the browser, live
npx @pdt42/cli build --out site # a static site (--single-file: one HTML page)
```

Installed globally (`npm i -g @pdt42/cli`), the command is `pdt42`. All commands accept
`--dir <workspace>` and `--format json`.

- Landing page and live example: https://mrsimpson.github.io/pdt42/
- Source, method summary and meta-model: https://github.com/mrsimpson/pdt42

## Licence

[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), like the Platform Design
Toolkit by Boundaryless it builds on. pdt42 is not affiliated with or endorsed by Boundaryless.
