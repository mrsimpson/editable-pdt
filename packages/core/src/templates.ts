import { STEPS, type StepInfo } from "./methodology.ts";
import { blockMeta, type BlockType } from "./schemas.ts";

// Starter content for a step's file: the step's guidance and one example section per block type,
// all inside an HTML comment. The parser skips comments, so a fresh workspace holds no model
// elements until the author writes them — copy an example out of the comment to start.

function exampleSection(type: BlockType): string {
  const meta = blockMeta(type);
  const title = /(?:^|\n)title: (.*)/.exec(meta.example)?.[1] ?? type;
  return `## ${title}\n\n${meta.description} Replace this paragraph with why this element matters.\n\n\`\`\`pdt\n:::${type}\n${meta.example}\n:::\n\`\`\`\n`;
}

function guidance(step: StepInfo): string {
  return [
    `${step.id} · ${step.title}`,
    step.question,
    "",
    ...step.how.map((h) => `- ${h}`),
    "",
    `You end up with: ${step.outcome}`,
    `Source (CC BY-SA 4.0, Boundaryless): ${step.source}`,
    `Run \`pdt guide step ${step.id}\` for the full brief and the blocks' attributes.`,
  ].join("\n");
}

/** The content of a step file. Steps sharing a file (D1 + D2) are merged. */
export function starterTemplate(file: string): string {
  const steps = STEPS.filter((s) => s.file === file);
  if (!steps.length) throw new Error(`No step writes to ${file}`);
  const heading = steps.map((s) => s.title).join(" · ");
  const types = [...new Set(steps.flatMap((s) => s.blocks))];
  const examples = types.length
    ? `\nExample${types.length > 1 ? "s" : ""} — copy below the comment and adapt:\n\n${types.map(exampleSection).join("\n")}`
    : "";
  const comments = steps.map((s) => guidance(s)).join("\n\n");
  return `# ${heading}\n\n<!--\n${comments}\n${examples}-->\n`;
}
