import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import {
  parseWorkspace,
  progress,
  validate,
  type Diagnostic,
  type StepStatus,
  type Workspace,
} from "@pdt/core";

const SKIP = new Set(["node_modules", "dist", ".git"]);

/** Every `*.pdt.md` file below `dir`, workspace-relative with forward slashes, sorted. */
export async function discover(dir: string, base = dir): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const entry of entries) {
    if (SKIP.has(entry.name) || entry.name.startsWith(".")) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await discover(path, base)));
    else if (entry.name.endsWith(".pdt.md")) out.push(relative(base, path).split(sep).join("/"));
  }
  return out.sort();
}

export interface Loaded {
  workspace: Workspace;
  diagnostics: Diagnostic[];
  steps: StepStatus[];
}

export async function load(dir: string): Promise<Loaded> {
  const files = await discover(dir);
  const workspace = parseWorkspace(
    await Promise.all(
      files.map(async (file) => ({ file, content: await readFile(join(dir, file), "utf8") })),
    ),
  );
  const diagnostics = validate(workspace);
  return { workspace, diagnostics, steps: progress(workspace, diagnostics) };
}
