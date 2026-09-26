import { blockFields, blockMeta, crossReferences, type BlockType } from "./schemas.ts";
import { PHASES, STEPS } from "./methodology.ts";

// Renders docs/meta-model.md from the schemas, so the documentation cannot drift from the code.

function diagram(): string {
  const lines = ["```mermaid", "flowchart LR"];
  for (const phase of PHASES) {
    lines.push(`  subgraph ${phase.id}["${phase.title}"]`);
    for (const step of STEPS.filter((s) => s.phase === phase.id)) {
      for (const type of step.blocks) lines.push(`    ${type.replace(/-/g, "_")}["${type}"]`);
    }
    lines.push("  end");
  }
  for (const r of crossReferences()) {
    for (const to of r.to) {
      lines.push(
        `  ${r.from.replace(/-/g, "_")} ${r.required ? "==>" : "-->"}|${r.field}| ${to.replace(/-/g, "_")}`,
      );
    }
  }
  lines.push("```");
  return lines.join("\n");
}

function table(type: BlockType): string {
  const meta = blockMeta(type);
  const rows = blockFields(type)
    .filter((f) => f.name !== "id" && f.name !== "title")
    .map((f) => {
      const kind = f.target
        ? `→ ${f.target.join(" \\| ")}${f.kind === "refs" ? " (many)" : ""}`
        : f.values
          ? f.values.join(" · ")
          : f.kind;
      return `| \`${f.name}\`${f.required ? " *" : ""} | ${kind} | ${f.description} |`;
    });
  return [
    `### \`${type}\` (${meta.step})`,
    "",
    `${meta.description}${meta.singleton ? " At most one per workspace." : ""}`,
    "",
    "| Attribute | Kind | Meaning |",
    "| --------- | ---- | ------- |",
    ...rows,
    "",
  ].join("\n");
}

export function metaModelDoc(): string {
  return [
    "# The pdt meta-model",
    "",
    "<!-- Generated from packages/core/src/schemas.ts by `pnpm docs:meta-model`. Do not edit by hand. -->",
    "",
    "Block types as nodes, reference fields as edges. Thick arrows are required references; every",
    "other reference is optional — but when it is set, it must point to an existing element of the",
    "named type (rule E002). `*` marks required attributes; every block also has `id` and, where it",
    "makes sense, `title`.",
    "",
    diagram(),
    "",
    ...PHASES.flatMap((phase) => [
      `## ${phase.title}`,
      "",
      ...STEPS.filter((s) => s.phase === phase.id).flatMap((s) => s.blocks.map(table)),
    ]),
  ].join("\n");
}
