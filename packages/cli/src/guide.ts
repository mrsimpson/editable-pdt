import {
  blockFields,
  blockMeta,
  CANVASES,
  canvasById,
  FLYWHEEL_LABELS,
  PATTERN_LABELS,
  PHASES,
  PLAY_LABELS,
  ROLES,
  STEPS,
  stepById,
  TACTIC_LABELS,
  nextStep,
  starterTemplate,
  stepDependencies,
  type BlockType,
  type StepInfo,
  type Workspace,
  type Diagnostic,
  type StepStatus,
} from "@pdt/core";

// Text renderers for `pdt guide`, `pdt next` and `pdt explain`. Output is plain Markdown so it
// reads well in a terminal and in an agent's context alike.

const STATE_MARK = { todo: "[ ]", open: "[~]", done: "[x]" } as const;

const VALUE_LABELS: Record<string, Record<string, string>> = {
  play: PLAY_LABELS,
  pattern: PATTERN_LABELS,
  tactics: TACTIC_LABELS,
  type: FLYWHEEL_LABELS,
};

function stepTypes(step: StepInfo): string {
  const created = step.blocks.map((t) => `:::${t}`);
  const enriched = (step.enriches ?? [])
    .filter((e) => !step.blocks.includes(e.type))
    .map((e) => `:::${e.type} + ${e.fields.length > 2 ? "portrait fields" : e.fields.join(", ")}`);
  return [...created, ...enriched].join(", ");
}

export function guideOverview(steps: StepStatus[]): string {
  const lines = [
    "# The Platform Design Toolkit, step by step",
    "",
    "Work through the steps in order; each one introduces a few block types.",
    "Legend: [x] done · [~] started, with open findings · [ ] not started",
    "",
  ];
  for (const phase of PHASES) {
    lines.push(`## ${phase.title} — ${phase.question}`, "");
    for (const status of steps.filter((s) => s.step.phase === phase.id)) {
      const { step } = status;
      const detail =
        status.state === "todo"
          ? ""
          : ` — ${status.count} element(s)${status.findings.length ? `, ${status.findings.length} finding(s)` : ""}`;
      lines.push(`${STATE_MARK[status.state]} ${step.id}  ${step.title}${detail}`);
      const types = stepTypes(step);
      if (types) lines.push(`        ${types}`);
    }
    lines.push("", `Guide: ${phase.guide}`, "");
  }
  lines.push(
    "Exploration is optional when the ecosystem is already known: a design may start at D1.",
    "",
  );
  const next = nextStep(steps);
  if (next)
    lines.push(
      `Next: ${next.status.step.id} ${next.status.step.title} — ${next.reason}`,
      `Run \`pdt guide step ${next.status.step.id}\` for its brief and starter template.`,
    );
  else lines.push("Every step is in place. Run `pdt validate` for anything left.");
  return lines.join("\n");
}

export function guideStep(id: string, steps: StepStatus[], workspace: Workspace): string {
  const step = stepById(id);
  if (!step) throw new Error(`Unknown step "${id}". Steps: ${STEPS.map((s) => s.id).join(", ")}`);
  const status = steps.find((s) => s.step.id === step.id)!;
  const phase = PHASES.find((p) => p.id === step.phase)!;
  const count = (type: BlockType) => workspace.elements.filter((e) => e.kind === type).length;
  const types = [...new Set([...step.blocks, ...(step.enriches ?? []).map((e) => e.type)])];
  const lines = [
    `# ${step.id} · ${step.title}`,
    "",
    `Phase: ${phase.title} · Status: ${status.state}${status.count ? ` (${status.count} element(s))` : ""}`,
    "",
    `> ${step.question}`,
    "",
    "## File",
    "",
    step.blocks.length
      ? `Write this step in \`${step.file}\` (any \`*.pdt.md\` file works; this is the convention). Wrap blocks in \`\`\`pdt fences.`
      : `This step adds fields to blocks you already wrote, usually in \`${step.file}\`.`,
    "",
    "## Dependencies",
    "",
  ];
  const deps = stepDependencies(step);
  if (!deps.length) lines.push("None — this step can start from a blank page.");
  for (const dep of deps) {
    const n = count(dep.type);
    lines.push(
      `- \`:::${dep.type}\` from ${dep.step} — ${dep.required ? "required" : "optional"} via ${dep.via.join(", ")}; ${n ? `${n} in this workspace` : "none yet"}${dep.required && !n ? " ← write these first" : ""}`,
    );
  }
  lines.push(
    "",
    "## How",
    "",
    ...step.how.map((h, i) => `${i + 1}. ${h}`),
    "",
    `**You end up with:** ${step.outcome}`,
    "",
    "## Before you write",
    "",
    "1. Read the starter template below.",
    "2. Run `pdt get` to see existing elements and their ids — reference them, don't duplicate them.",
    `3. Run the \`pdt explain\` commands below for the attributes of ${types.map((t) => `\`${t}\``).join(", ")}.`,
    "4. Confirm with the human what you don't know: entities, motivations and assumptions come from the ecosystem.",
    "",
    "## Authoring rules",
    "",
    "- One `##` section per element: a heading, prose explaining why, then one fenced `pdt` block.",
    "- References are optional unless marked `*` in `pdt explain`, but a reference you set must resolve.",
    "- Do not invent ids or values; leave an attribute out rather than guessing.",
    "- Finish with `pdt validate` and `pdt guide step " + step.id + "` to see what is still open.",
    "",
    "## Blocks",
    "",
  );
  for (const type of types) {
    const enriched = step.enriches?.find((e) => e.type === type && !step.blocks.includes(type));
    lines.push(
      `### :::${type}${enriched ? ` — add ${enriched.fields.join(", ")}` : ""}`,
      "",
      blockMeta(type).description,
      "",
      ...blockMeta(type).tips.map((t) => `- ${t}`),
      "",
    );
  }
  if (step.canvases.length) {
    lines.push(
      "## Canvases",
      "",
      ...step.canvases.map((c) => `- ${canvasById(c)?.title ?? c} — \`pdt guide canvas ${c}\``),
      "",
    );
  }
  lines.push(
    "## Relevant commands",
    "",
    ...types.map((t) => `- \`pdt explain ${t}\``),
    "- `pdt get`",
    "- `pdt validate`",
    "",
    `Source (© Boundaryless SRL, CC BY-SA 4.0): ${step.source}`,
  );
  if (status.findings.length) {
    lines.push("", "## Open findings", "", ...status.findings.map(formatDiagnostic));
  }
  lines.push(
    "",
    "## Starter template",
    "",
    "````markdown",
    starterTemplate(step.id).trimEnd(),
    "````",
  );
  return lines.join("\n");
}

export function guideRoles(): string {
  const lines = ["# The five platform roles", ""];
  for (const group of ["impact", "demand", "supply"] as const) {
    lines.push(`## ${group[0]!.toUpperCase()}${group.slice(1)} entities`, "");
    for (const role of ROLES.filter((r) => r.group === group)) {
      lines.push(`- **${role.label}** (${role.code}, \`role: ${role.id}\`) — ${role.summary}`);
    }
    lines.push("");
  }
  lines.push(
    "Cluster similar entities into one entity-role; keep at most five roles in the peer spectrum.",
    "If you can name only one or two of them, they are probably not peers.",
  );
  return lines.join("\n");
}

export function guideCanvas(id: string | undefined): string {
  if (!id) {
    const lines = ["# Canvases", ""];
    for (const phase of PHASES) {
      lines.push(`## ${phase.title}`, "");
      for (const c of CANVASES.filter((c) => c.phase === phase.id)) {
        lines.push(
          `- \`${c.id}\` — ${c.title} (${c.kind}, steps ${c.steps.join(", ")})${c.per ? `, one per ${c.per}` : ""}`,
        );
      }
      lines.push("");
    }
    lines.push("Run `pdt guide canvas <id>` to see which model fields fill each area.");
    return lines.join("\n");
  }
  const canvas = canvasById(id);
  if (!canvas)
    throw new Error(`Unknown canvas "${id}". Canvases: ${CANVASES.map((c) => c.id).join(", ")}`);
  return [
    `# ${canvas.title}`,
    "",
    `${canvas.kind} · steps ${canvas.steps.join(", ")}${canvas.per ? ` · one per ${canvas.per}` : ""}`,
    "",
    "| Area | Filled from |",
    "| ---- | ----------- |",
    ...canvas.areas.map((a) => `| ${a.title} | ${a.fills.map((f) => `\`${f}\``).join(", ")} |`),
    "",
    `Source (© Boundaryless SRL, CC BY-SA 4.0): ${canvas.source}`,
  ].join("\n");
}

export function nextText(steps: StepStatus[]): string {
  const next = nextStep(steps);
  if (!next) return "Every step is in place. Run `pdt validate` for anything left.";
  const { step } = next.status;
  return [
    `Next: ${step.id} · ${step.title}`,
    "",
    next.reason,
    "",
    `> ${step.question}`,
    "",
    `Run \`pdt guide step ${step.id}\` for the brief.`,
  ].join("\n");
}

export function explainText(type: string | undefined): string {
  if (!type) {
    const lines = ["# Block types", ""];
    for (const phase of PHASES) {
      lines.push(`## ${phase.title}`, "");
      for (const step of STEPS.filter((s) => s.phase === phase.id)) {
        for (const t of step.blocks)
          lines.push(`- \`:::${t}\` (${step.id}) — ${blockMeta(t).description}`);
      }
      lines.push("");
    }
    lines.push("Run `pdt explain <type>` for its attributes and an example.");
    return lines.join("\n");
  }
  const kind = type as BlockType;
  let meta;
  try {
    meta = blockMeta(kind);
  } catch {
    throw new Error(`Unknown block type "${type}". Run \`pdt explain\` for the list.`);
  }
  const rows = blockFields(kind).map((f) => {
    const values = f.values
      ? f.values
          .map((v) => (VALUE_LABELS[f.name]?.[v] ? `${v} (${VALUE_LABELS[f.name]![v]})` : v))
          .join(" · ")
      : "";
    const shape =
      f.kind === "ref"
        ? `→ ${f.target!.join(" | ")}`
        : f.kind === "refs"
          ? `→ ${f.target!.join(" | ")} (comma list)`
          : f.kind === "list"
            ? "`- item` lines"
            : f.kind;
    return `| \`${f.name}\`${f.required ? " *" : ""} | ${shape} | ${f.description}${values ? `. Values: ${values}` : ""} |`;
  });
  return [
    `# :::${kind}`,
    "",
    meta.description,
    "",
    `Introduced in step ${meta.step} (\`pdt guide step ${meta.step}\`).${meta.singleton ? " At most one per workspace." : ""}`,
    "",
    "| Attribute | Kind | Meaning |",
    "| --------- | ---- | ------- |",
    ...rows,
    "",
    "`*` required. A reference that is set must point to an existing element of the named type.",
    "",
    "## Tips",
    "",
    ...meta.tips.map((t) => `- ${t}`),
    "",
    "## Example",
    "",
    "```pdt",
    `:::${kind}`,
    meta.example,
    ":::",
    "```",
  ].join("\n");
}

export function formatDiagnostic(d: Diagnostic): string {
  return `- ${d.code} ${d.severity} ${d.loc.file}:${d.loc.line} — ${d.message}`;
}
