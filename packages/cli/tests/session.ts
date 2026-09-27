import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

// The CLI session on the landing page: an agent starts a design in an empty workspace, guided by
// pdt42. Every command runs for real against the CLI from source, so the recording always shows
// what pdt42 prints today. `pnpm demo:cli` writes it to demo/cli-session.json; a test keeps it
// current.

export type SessionEntry =
  /** What the human asks the agent. */
  | { kind: "human"; text: string }
  /** What the agent does between commands. */
  | { kind: "agent"; text: string }
  /** A command the agent runs, with its output (cut to `lines`, if set). */
  | { kind: "run"; command: string; output: string }
  /** A file the agent writes or edits, with the part worth showing. */
  | { kind: "write"; file: string; excerpt: string };

const CLI = new URL("../src/cli.ts", import.meta.url).pathname;
const FILE = "2-design/d1-ecosystem.pdt42.md";

const block = (body: string) => `\`\`\`pdt42\n${body}\n\`\`\``;

const CANVAS = block(":::canvas\nid: cv-ecosystem\ncanvas: ecosystem\n:::");

const ENTITIES = [
  [
    "e-coop",
    "Harvest Commons Cooperative",
    "owner",
    "The farms own the platform; two staff run it.",
  ],
  [
    "e-farmers",
    "Small-scale farmers",
    "peer-producer",
    "Family farms within sixty kilometres. They grow well; selling is what costs them.",
  ],
  [
    "e-restaurants",
    "Restaurants",
    "peer-consumer",
    "Kitchens that want local produce, but not twenty suppliers to call.",
  ],
] as const;

const entity = ([id, title, role, prose]: (typeof ENTITIES)[number]) =>
  `## ${title}\n\n${prose}\n\n${block(`:::entity\nid: ${id}\ntitle: ${title}\nrole: ${role}\n:::`)}`;

const PLATFORM = `## Harvest Commons

A cooperative that lets small farms sell their harvest before it is sown.

${block(":::platform\nid: platform-harvest\ntitle: Harvest Commons\nowners: e-coop\n:::")}`;

const chapter = (canvas: boolean) =>
  ["# Map the ecosystem", ...(canvas ? [CANVAS] : []), PLATFORM, ...ENTITIES.map(entity)].join(
    "\n\n",
  ) + "\n";

type Step =
  | { kind: "human"; text: string }
  | { kind: "agent"; text: string }
  | { kind: "run"; args: string[]; lines?: number }
  | { kind: "write"; content: string; excerpt: string };

const SCRIPT: Step[] = [
  {
    kind: "human",
    text: "Let's design a platform that connects small farms with the city's kitchens. Use pdt42.",
  },
  { kind: "run", args: ["next"] },
  { kind: "run", args: ["guide", "step", "D1"], lines: 22 },
  {
    kind: "agent",
    text: "Asks who takes part, then writes the chapter: the platform, its owner and two entity-roles.",
  },
  { kind: "write", content: chapter(false), excerpt: entity(ENTITIES[1]) },
  { kind: "run", args: ["validate"] },
  { kind: "agent", text: "W011: the chapter lacks its canvas. Places it under the title." },
  { kind: "write", content: chapter(true), excerpt: `# Map the ecosystem\n\n${CANVAS}` },
  { kind: "run", args: ["validate"] },
  { kind: "run", args: ["next"] },
];

/** Plays the script in a fresh workspace and returns what the terminal shows. */
export function recordSession(): SessionEntry[] {
  const dir = mkdtempSync(join(tmpdir(), "pdt42-session-"));
  try {
    return SCRIPT.map((step): SessionEntry => {
      if (step.kind === "human" || step.kind === "agent") return step;
      if (step.kind === "write") {
        mkdirSync(dirname(join(dir, FILE)), { recursive: true });
        writeFileSync(join(dir, FILE), step.content);
        return { kind: "write", file: FILE, excerpt: step.excerpt };
      }
      const r = spawnSync(
        process.execPath,
        [
          "--conditions=development",
          "--experimental-strip-types",
          "--no-warnings",
          CLI,
          ...step.args,
        ],
        { cwd: dir, encoding: "utf8", env: { ...process.env, NO_COLOR: "1", PDT42_DIR: "" } },
      );
      if (r.status !== 0) throw new Error(`pdt42 ${step.args.join(" ")} failed:\n${r.stderr}`);
      let lines = r.stdout.trimEnd().split("\n");
      if (step.lines && lines.length > step.lines) lines = [...lines.slice(0, step.lines), "…"];
      return { kind: "run", command: `pdt42 ${step.args.join(" ")}`, output: lines.join("\n") };
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export const SESSION_FILE = new URL("../../../demo/cli-session.json", import.meta.url);

export const sessionJson = () => `${JSON.stringify(recordSession(), null, 2)}\n`;

export const readSession = () => readFileSync(SESSION_FILE, "utf8");
