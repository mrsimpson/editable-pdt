import { parseWorkspace, validate, type Diagnostic, type Workspace } from "../src/index.ts";

/** Wraps blocks in a pdt42 fence under a heading with prose, so W001 stays quiet. */
export function doc(...blocks: string[]): string {
  return blocks
    .map((b, i) => `## Section ${i}\n\nWhy this matters.\n\n\`\`\`pdt42\n${b.trim()}\n\`\`\`\n`)
    .join("\n");
}

export function run(
  content: string,
  file = "model.pdt42.md",
): { ws: Workspace; diagnostics: Diagnostic[]; codes: string[] } {
  const ws = parseWorkspace([{ file, content }]);
  const diagnostics = validate(ws);
  return { ws, diagnostics, codes: diagnostics.map((d) => d.code) };
}

export const farmers = `:::entity
id: e-farmers
title: Farmers
role: peer-producer
:::`;

export const kitchens = `:::entity
id: e-kitchens
title: Kitchens
role: peer-consumer
:::`;
