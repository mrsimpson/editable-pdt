import { STEPS, type StepInfo } from "./methodology.ts";
import { blockMeta, type BlockType } from "./schemas.ts";

// Starter content for a step's file: the step's guidance as an HTML comment (invisible when the
// Markdown is rendered) and one example section per block type the step introduces.

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
  const comments = steps.map((s) => `<!--\n${guidance(s)}\n-->`).join("\n\n");
  const types = [...new Set(steps.flatMap((s) => s.blocks))];
  return `# ${heading}\n\n${comments}\n\n${types.map(exampleSection).join("\n")}`;
}
