#!/usr/bin/env node
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BLOCK_TYPES, CANVASES } from "../src/core/schema.js";
import { toJSON } from "../src/core/model.js";
import { RULES } from "../src/core/validator.js";
import { renderPage } from "../src/render/page.js";
import { loadWorkspace } from "../src/workspace.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const HELP = `pdt — the Platform Design Toolkit as a language

Usage: pdt [--dir <workspace>] <command> [options]

Commands
  validate            Check the model for consistency (exit 1 on errors)
  get [id]            List elements by type, or show one element with its relations
  rules               List every validation rule with its rationale
  explain [type]      Show the attributes of a block type
  serve               Open the canvases in the browser and edit them live
  build --out <dir>   Render all canvases into a static, self-contained index.html
  init [dir]          Start a new workspace from the starter template

Options
  --dir <path>        Workspace directory (default: $PDT_DIR or the current directory)
  --format json       Machine-readable output for validate, get, rules, explain
  --type <type>       Filter get by block type
  --port <n>          Port for serve (default 4242)
  --strict            validate: also fail on warnings
`;

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--strict" || a === "--help" || a === "-h") args[a.replace(/^-+/, "")] = true;
    else if (a.startsWith("--")) args[a.slice(2)] = argv[++i];
    else args._.push(a);
  }
  return args;
}

const color = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code, text) => (color ? `\x1b[${code}m${text}\x1b[0m` : text);
const SEVERITY = { error: (t) => paint("31;1", t), warning: (t) => paint("33;1", t), hint: (t) => paint("36", t) };

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [command, ...rest] = args._;
  if (!command || args.help || args.h) return void process.stdout.write(HELP);
  const dir = resolve(args.dir ?? process.env.PDT_DIR ?? ".");
  const json = args.format === "json";

  switch (command) {
    case "validate": {
      const { workspace, diagnostics } = await loadWorkspace(dir);
      if (json) console.log(JSON.stringify(diagnostics, null, 2));
      else {
        for (const d of diagnostics) console.log(`${SEVERITY[d.severity](d.code)} ${d.file}:${d.line}  ${d.message}`);
        const n = (s) => diagnostics.filter((d) => d.severity === s).length;
        console.log(`\n${workspace.elements.length} elements in ${workspace.documents.length} files — ${n("error")} errors, ${n("warning")} warnings, ${n("hint")} hints`);
      }
      const failing = diagnostics.some((d) => d.severity === "error" || (args.strict && d.severity === "warning"));
      process.exitCode = failing ? 1 : 0;
      return;
    }
    case "get": {
      const { workspace } = await loadWorkspace(dir);
      const [id] = rest;
      if (id) {
        const element = workspace.byId.get(id);
        if (!element) {
          console.error(`No element "${id}"`);
          process.exitCode = 1;
          return;
        }
        const incoming = workspace.elements.filter((e) => Object.values(e.attributes).some((v) => [].concat(v).includes(id)) && e.id !== id);
        if (json) return console.log(JSON.stringify({ ...strip(element), referencedBy: incoming.map((e) => e.id) }, null, 2));
        console.log(`${paint("1", element.title)}  ${paint("2", `${element.type} · ${element.file}:${element.line}`)}`);
        for (const [k, v] of Object.entries(element.attributes)) {
          if (k === "id" || k === "title") continue;
          console.log(Array.isArray(v) ? `  ${k}:\n${v.map((x) => `    - ${x}`).join("\n")}` : `  ${k}: ${v}`);
        }
        if (element.prose) console.log(`\n${element.prose.replace(/^/gm, "  ")}`);
        if (incoming.length) console.log(`\n  referenced by: ${incoming.map((e) => e.id).join(", ")}`);
        return;
      }
      const elements = workspace.elements.filter((e) => !args.type || e.type === args.type);
      if (json) return console.log(JSON.stringify(elements.map(strip), null, 2));
      for (const type of Object.keys(BLOCK_TYPES)) {
        const group = elements.filter((e) => e.type === type);
        if (!group.length) continue;
        console.log(paint("1", `${BLOCK_TYPES[type].label} (${group.length})`));
        for (const e of group) console.log(`  ${e.id.padEnd(34)} ${e.type === "motivation" ? e.attributes.gives : e.title}`);
      }
      return;
    }
    case "rules": {
      const rules = RULES.map(({ check, ...r }) => r);
      if (json) return console.log(JSON.stringify(rules, null, 2));
      for (const r of rules) console.log(`${SEVERITY[r.severity](r.code)} ${paint("1", r.title)}\n     ${r.rationale}\n`);
      return;
    }
    case "explain": {
      const [type] = rest;
      if (!type) {
        if (json) return console.log(JSON.stringify(BLOCK_TYPES, null, 2));
        for (const [name, t] of Object.entries(BLOCK_TYPES)) console.log(`${paint("1", `:::${name}`.padEnd(20))} ${t.summary}`);
        console.log(`\nCanvases:\n${CANVASES.map((c) => `  ${c.title.padEnd(22)} ${c.question}`).join("\n")}`);
        return;
      }
      const t = BLOCK_TYPES[type];
      if (!t) {
        console.error(`Unknown block type "${type}". Known: ${Object.keys(BLOCK_TYPES).join(", ")}`);
        process.exitCode = 2;
        return;
      }
      if (json) return console.log(JSON.stringify(t, null, 2));
      console.log(`${paint("1", `:::${type}`)} — ${t.summary}\n`);
      for (const [key, def] of Object.entries(t.attributes)) {
        const kind = def.kind === "enum" ? def.values.join(" | ") : def.to ? `${def.kind} → ${def.to}` : def.kind;
        console.log(`  ${(key + (def.required ? "*" : "")).padEnd(14)} ${kind.padEnd(44)} ${def.help ?? ""}`);
      }
      console.log(`\nExample:\n\n\`\`\`pdt\n:::${type}\n${exampleFor(type)}:::\n\`\`\``);
      return;
    }
    case "serve": {
      const { serve } = await import("../src/server.js");
      const port = Number(args.port ?? 4242);
      await serve(dir, { port, host: args.host ?? "127.0.0.1" });
      console.log(`Canvases for ${dir}\n→ http://${args.host ?? "localhost"}:${port}\n\nEdits in the browser are written to the .pdt.md files. Ctrl+C to stop.`);
      return;
    }
    case "build": {
      const out = resolve(args.out ?? "pdt-site");
      const { workspace, diagnostics } = await loadWorkspace(dir);
      const css = await readFile(join(ROOT, "src/render/theme.css"), "utf8");
      await mkdir(out, { recursive: true });
      await writeFile(join(out, "index.html"), renderPage(toJSON(workspace), diagnostics, { css }), "utf8");
      console.log(`Wrote ${join(out, "index.html")}`);
      return;
    }
    case "init": {
      const target = resolve(rest[0] ?? dir);
      if (existsSync(target) && (await loadWorkspace(target)).workspace.documents.length) {
        console.error(`${target} already contains .pdt.md files`);
        process.exitCode = 1;
        return;
      }
      await cp(join(ROOT, "templates/starter"), target, { recursive: true });
      console.log(`Created a starter workspace in ${target}\nNext: pdt --dir ${rest[0] ?? "."} serve`);
      return;
    }
    default:
      console.error(`Unknown command "${command}"\n\n${HELP}`);
      process.exitCode = 2;
  }
}

function strip({ raw, known, positionUnderHeading, fenceStart, fenceEnd, proseStart, proseEnd, ...rest }) {
  return rest;
}

function exampleFor(type) {
  return Object.entries(BLOCK_TYPES[type].attributes)
    .map(([key, def]) => {
      if (def.kind === "list") return `${key}:\n  - …\n  - …\n`;
      if (def.kind === "enum") return `${key}: ${def.values[0]}\n`;
      if (def.kind === "refs") return `${key}: ${def.to}-a, ${def.to}-b\n`;
      if (def.kind === "ref") return `${key}: ${def.to}-id\n`;
      return `${key}: …\n`;
    })
    .join("");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
