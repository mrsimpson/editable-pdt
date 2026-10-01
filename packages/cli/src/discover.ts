import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { loadWorkspaceFromFiles, type LoadedWorkspace } from "@pdt42/core";

const SKIP = new Set(["node_modules", "dist", ".git"]);

/** Every `*.pdt42.md` file below `dir`, workspace-relative with forward slashes, sorted. */
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
    else if (entry.name.endsWith(".pdt42.md")) out.push(relative(base, path).split(sep).join("/"));
  }
  return out.sort();
}

export type Loaded = LoadedWorkspace;

/** Load the workspace below `dir`: every `*.pdt42.md` file, prose rendered, validated. */
export async function load(dir: string): Promise<Loaded> {
  const files = await discover(dir);
  return loadWorkspaceFromFiles(
    await Promise.all(
      files.map(async (path) => ({ path, content: await readFile(join(dir, path), "utf8") })),
    ),
  );
}
