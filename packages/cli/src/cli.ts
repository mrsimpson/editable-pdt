#!/usr/bin/env node
import { resolve } from "node:path";
import {
  BLOCK_TYPES,
  blockFields,
  fieldValue,
  incoming,
  nextStep,
  proseOf,
  titleOf,
  RULES,
  type Diagnostic,
} from "@pdt42/core";
import { load } from "./discover.ts";
import { build, serve } from "./serve.ts";
import {
  explainJson,
  explainText,
  formatDiagnostic,
  guideCanvas,
  guideOverview,
  guideRoles,
  guideStep,
  nextText,
} from "./guide.ts";

const HELP = `pdt42 — the Platform Design Toolkit as a language

Usage: pdt42 [--dir <workspace>] <command> [options]

Commands
  guide                    The methodology, and where this workspace stands in it
  guide step <E1…G5>       One step: file, dependencies, how-to, blocks, starter template
  guide roles              The five platform roles
  guide canvas [id]        The canvases, and the model fields that fill each area
  next                     The step to work on next, and why
  explain [type]           The block types, or one type's attributes and an example
  validate [--strict]      Check the model (exit 1 on errors, or on warnings with --strict)
  get [id] [--type <t>]    List elements, or show one with what references it
  rules                    Every validation rule with its rationale
  serve [--port <n>]       Render the workspace in the browser, reloading on every change
  build --out <dir>        Render the workspace as a static site [--single-file: one HTML file]

Options
  --dir <path>             Workspace directory (default: $PDT42_DIR or the current directory)
  --format json            Machine-readable output (validate, get, rules, guide, next)

The methodology is the Platform Design Toolkit 2.2 by Boundaryless SRL, whose canvases and
guides are licensed CC BY-SA 4.0 — https://docs.boundaryless.io/methodology/legacy/pdt
`;

interface Args {
  _: string[];
  [key: string]: string | boolean | string[];
}

function parseArgs(argv: string[]): Args {
  const args: Args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--strict" || a === "--single-file" || a === "--help" || a === "-h")
      args[a.replace(/^-+/, "")] = true;
    else if (a.startsWith("--")) args[a.slice(2)] = argv[++i] ?? "";
    else args._.push(a);
  }
  return args;
}

const color = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code: string, t: string) => (color ? `\x1b[${code}m${t}\x1b[0m` : t);
const SEVERITY = { error: "31;1", warning: "33;1", hint: "36" } as const;

function print(text: string) {
  process.stdout.write(`${text}\n`);
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  const [command, ...rest] = args._;
  if (!command || args.help || args.h) {
    print(HELP);
    return 0;
  }
  const dir = resolve(String(args.dir || process.env.PDT42_DIR || "."));
  const json = args.format === "json";

  switch (command) {
    case "guide": {
      const [topic, arg] = rest;
      if (topic === "roles") return (print(guideRoles()), 0);
      if (topic === "canvas") return (print(guideCanvas(arg)), 0);
      const { steps, workspace } = await load(dir);
      if (json) {
        print(
          JSON.stringify(
            steps.map((s) => ({
              step: s.step.id,
              title: s.step.title,
              state: s.state,
              elements: s.count,
              findings: s.findings,
            })),
            null,
            2,
          ),
        );
        return 0;
      }
      if (topic === "step") {
        if (!arg) throw new UsageError("pdt42 guide step <id> — e.g. pdt42 guide step D2");
        print(guideStep(arg, steps, workspace));
        return 0;
      }
      if (topic) throw new UsageError(`Unknown guide topic "${topic}". Use step, roles or canvas.`);
      print(guideOverview(steps));
      return 0;
    }
    case "next": {
      const { steps } = await load(dir);
      if (json) {
        const next = nextStep(steps);
        print(
          JSON.stringify(
            next
              ? {
                  step: next.status.step.id,
                  title: next.status.step.title,
                  question: next.status.step.question,
                  reason: next.reason,
                  state: next.status.state,
                  findings: next.status.findings,
                }
              : null,
            null,
            2,
          ),
        );
        return 0;
      }
      print(nextText(steps));
      return 0;
    }
    case "explain": {
      if (json) {
        const type = rest[0];
        print(JSON.stringify(type ? explainJson(type) : BLOCK_TYPES.map(explainJson), null, 2));
        return 0;
      }
      print(explainText(rest[0]));
      return 0;
    }
    case "serve": {
      const port = Number(args.port || 4242);
      const host = String(args.host || "127.0.0.1");
      await serve(dir, { port, host });
      print(`pdt42 serve  →  http://${host === "0.0.0.0" ? "localhost" : host}:${port}`);
      print(`Watching ${dir} — the browser reloads on every change. Ctrl+C to stop.`);
      return new Promise<number>(() => {});
    }
    case "build": {
      if (!args.out) throw new UsageError("pdt42 build --out <dir> [--single-file]");
      const target = await build(dir, resolve(String(args.out)), Boolean(args["single-file"]));
      print(`Wrote ${target}`);
      return 0;
    }
    case "validate": {
      const { workspace, diagnostics } = await load(dir);
      if (json) print(JSON.stringify(diagnostics, null, 2));
      else {
        for (const d of diagnostics)
          print(`${paint(SEVERITY[d.severity], d.code)} ${d.file}:${d.line}  ${d.message}`);
        const n = (s: Diagnostic["severity"]) => diagnostics.filter((d) => d.severity === s).length;
        print(
          `\n${workspace.elements.length} elements in ${workspace.documents.length} files — ${n("error")} errors, ${n("warning")} warnings, ${n("hint")} hints`,
        );
      }
      return diagnostics.some(
        (d) => d.severity === "error" || (args.strict && d.severity === "warning"),
      )
        ? 1
        : 0;
    }
    case "get": {
      const { workspace, diagnostics } = await load(dir);
      const [id] = rest;
      if (id) {
        const element = workspace.byId.get(id);
        if (!element) {
          process.stderr.write(`No element "${id}"\n`);
          return 1;
        }
        const refs = incoming(workspace, id).map((r) => ({
          id: r.from.id,
          kind: r.from.kind,
          field: r.field,
        }));
        if (json) {
          print(JSON.stringify({ ...element, referencedBy: refs }, null, 2));
          return 0;
        }
        print(
          `${paint("1", titleOf(element))}  ${paint("2", `${element.kind} · ${element.loc.file}:${element.loc.line}`)}`,
        );
        for (const { name: key } of blockFields(element.kind)) {
          const value = fieldValue(element, key);
          if (
            key === "id" ||
            key === "title" ||
            value === undefined ||
            (Array.isArray(value) && !value.length)
          )
            continue;
          print(
            Array.isArray(value)
              ? `  ${key}:\n${value.map((v) => `    - ${String(v)}`).join("\n")}`
              : `  ${key}: ${String(value as string | number | boolean)}`,
          );
        }
        if (proseOf(element)) print(`\n${proseOf(element).replace(/^/gm, "  ")}`);
        if (refs.length)
          print(`\n  referenced by: ${refs.map((r) => `${r.id} (${r.field})`).join(", ")}`);
        const own = diagnostics.filter((d) => d.element === id);
        if (own.length) print(`\n${own.map(formatDiagnostic).join("\n")}`);
        return 0;
      }
      const type = args.type ? String(args.type) : undefined;
      const elements = workspace.elements.filter((e) => !type || e.kind === type);
      if (json) {
        print(
          JSON.stringify(
            elements.map((e) => ({ kind: e.kind, id: e.id, title: titleOf(e), loc: e.loc })),
            null,
            2,
          ),
        );
        return 0;
      }
      for (const kind of BLOCK_TYPES) {
        const group = elements.filter((e) => e.kind === kind);
        if (!group.length) continue;
        print(paint("1", `${kind} (${group.length})`));
        for (const e of group) print(`  ${e.id.padEnd(30)} ${titleOf(e)}`);
      }
      return 0;
    }
    case "rules": {
      const rules = RULES.map((r) => r.meta);
      if (json) print(JSON.stringify(rules, null, 2));
      else
        for (const r of rules)
          print(
            `${paint(SEVERITY[r.severity], r.code)} ${paint("1", r.title)}${r.step ? `  (${r.step})` : ""}\n     ${r.rationale}\n`,
          );
      return 0;
    }
    default:
      throw new UsageError(`Unknown command "${command}"\n\n${HELP}`);
  }
}

class UsageError extends Error {}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = error instanceof UsageError ? 2 : 1;
  },
);
