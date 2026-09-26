import { STEPS, stepById, type StepInfo } from "./methodology.ts";
import { blockFields, blockMeta, type BlockType } from "./schemas.ts";

// What `pdt guide step <id>` hands to an author: the step's dependencies, derived from the
// reference fields of its block types, and a starter template. Like arc42's chapter templates,
// guidance and examples sit inside an HTML comment — the parser skips comments, so copying the
// template never adds model elements by accident.

export interface StepDependency {
  /** The block type this step's blocks reference. */
  type: BlockType;
  /** The step that introduces that type. */
  step: string;
  /** The referencing fields, as `type.field`. */
  via: string[];
  /** At least one of the referencing fields is required. */
  required: boolean;
}

/** Types introduced in other steps that this step's blocks may or must reference. */
export function stepDependencies(step: StepInfo): StepDependency[] {
  const own = new Set<BlockType>([...step.blocks, ...(step.enriches ?? []).map((e) => e.type)]);
  const deps = new Map<BlockType, StepDependency>();
  for (const type of own) {
    for (const field of blockFields(type)) {
      if (!field.target) continue;
      for (const target of field.target as BlockType[]) {
        if (step.blocks.includes(target)) continue;
        const dep = deps.get(target) ?? {
          type: target,
          step: blockMeta(target).step,
          via: [],
          required: false,
        };
        dep.via.push(`${type}.${field.name}`);
        dep.required ||= field.required;
        deps.set(target, dep);
      }
    }
  }
  const order = (id: string) => STEPS.findIndex((s) => s.id === id);
  return [...deps.values()].sort(
    (a, b) => order(a.step) - order(b.step) || a.type.localeCompare(b.type),
  );
}

function exampleSection(type: BlockType): string {
  const meta = blockMeta(type);
  const title = /(?:^|\n)title: (.*)/.exec(meta.example)?.[1] ?? type;
  return `## ${title}\n\nOne or two sentences on why this element matters.\n\n\`\`\`pdt\n:::${type}\n${meta.example}\n:::\n\`\`\`\n`;
}

/** Starter content for one step. */
export function starterTemplate(stepId: string): string {
  const step = stepById(stepId);
  if (!step) throw new Error(`Unknown step "${stepId}"`);
  const firstInFile = STEPS.find((s) => s.file === step.file) === step;
  const guidance = [
    `${step.id} · ${step.title}`,
    step.question,
    "",
    ...step.how.map((h) => `- ${h}`),
  ];

  if (!step.blocks.length) {
    // Enrich-only steps (D2 portraits, E4 focus) add fields to blocks written earlier.
    const lines = (step.enriches ?? []).map(
      ({ type, fields }) => `Add to the existing :::${type} blocks: ${fields.join(", ")}.`,
    );
    const examples = (step.enriches ?? []).map(({ type }) => exampleSection(type)).join("\n");
    return `<!--\n${[...guidance, "", ...lines].join("\n")}\n\nExample:\n\n${examples}-->\n`;
  }

  const heading = firstInFile ? `# ${step.title}\n\n` : "";
  const examples = step.blocks.map(exampleSection).join("\n");
  return `${heading}<!--\n${guidance.join("\n")}\n\nOne section per element: a heading, prose, then the block. Examples:\n\n${examples}-->\n`;
}
