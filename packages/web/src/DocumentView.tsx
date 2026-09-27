import {
  STEPS,
  type AstNode,
  type BlockNode,
  type IgnoreNode,
  type PayloadDocument,
} from "@pdt42/core";
import { h } from "./dom.ts";
import type { Ctx } from "./context.ts";
import { ElementCard, FindingList } from "./ElementCard.tsx";
import { CanvasFrame } from "./canvases/CanvasFrame.tsx";
import { renderMarkdown, slug } from "./markdown.ts";
import { colorOf } from "./workspace.ts";

// A chapter, rendered like arc42 renders one: prose, with every element's prose swappable for
// its model box (click the stripe), canvases in place, and the agent view showing the source.

type Group =
  | { kind: "run"; prose: string; block: BlockNode | null; ignores: IgnoreNode[] }
  | { kind: "node"; node: AstNode };

const isCanvas = (n: AstNode): n is BlockNode => n.kind === "block" && n.blockType === "canvas";
const isElement = (n: AstNode | undefined): n is BlockNode =>
  n?.kind === "block" && n.blockType !== "canvas";

/** Consecutive prose, and the element block that follows it, form one run. */
export function groupNodes(nodes: AstNode[]): Group[] {
  const groups: Group[] = [];
  let prose: string[] = [];
  let ignores: IgnoreNode[] = [];
  const flush = (block: BlockNode | null) => {
    if (!prose.length && !block) return;
    groups.push({ kind: "run", prose: prose.join("\n\n"), block, ignores: block ? ignores : [] });
    prose = [];
    if (block) ignores = [];
  };
  for (const node of nodes) {
    if (node.kind === "prose") prose.push(node.text);
    else if (node.kind === "ignore") ignores.push(node);
    else if (isElement(node)) flush(node);
    else {
      flush(null);
      for (const i of ignores) groups.push({ kind: "node", node: i });
      ignores = [];
      groups.push({ kind: "node", node });
    }
  }
  flush(null);
  for (const i of ignores) groups.push({ kind: "node", node: i });
  return groups;
}

export function blockSource(node: BlockNode): string {
  const lines = [`:::${node.blockType}`];
  for (const [key, value] of Object.entries(node.attributes)) {
    if (Array.isArray(value)) lines.push(`${key}:`, ...value.map((v) => `  - ${v}`));
    else lines.push(`${key}: ${value}`);
  }
  lines.push(":::");
  return lines.join("\n");
}

function Source({ text, lang }: { text: string; lang?: string }) {
  return (
    <pre class={["source", lang && `source--${lang}`]}>
      {lang && <span class="source__lang">{lang}</span>}
      <code>{text}</code>
    </pre>
  );
}

function Prose({ text }: { text: string }) {
  return <div class="prose" html={renderMarkdown(text)} />;
}

function ProseRun({
  ctx,
  prose,
  block,
  ignores,
}: {
  ctx: Ctx;
  prose: string;
  block: BlockNode | null;
  ignores: IgnoreNode[];
}) {
  if (!block) return <Prose text={prose} />;
  const id = String(block.attributes.id ?? "");
  const element = ctx.ix.byId.get(id);
  const toggle = () =>
    ctx.update((s) => {
      if (s.expanded.has(id)) s.expanded.delete(id);
      else s.expanded.add(id);
    });
  // Without prose there is nothing to swap with: the model box stands on its own.
  if (!prose.trim()) return <ElementCard ctx={ctx} id={id} ignores={ignores} />;
  if (ctx.state.expanded.has(id)) {
    return <ElementCard ctx={ctx} id={id} ignores={ignores} onDismiss={toggle} />;
  }
  const findings = ctx.ix.findings((d) => d.element === id);
  const role = element?.kind === "entity" ? (element.data.role as string | undefined) : undefined;
  return (
    <div class="run" id={`el-${id}`} data-element={id}>
      <button
        class="run__stripe"
        style={{ "--c": element ? colorOf(element.kind, role) : "var(--text-muted)" }}
        title={`Show the model box of ${element?.title ?? id}`}
        aria-label={`Show the model box of ${element?.title ?? id}`}
        onClick={toggle}
      >
        {findings.length > 0 && (
          <span
            class={[
              "run__mark",
              findings.some((f) => f.severity === "error") && "run__mark--error",
            ]}
          />
        )}
      </button>
      <Prose text={prose} />
    </div>
  );
}

function Heading({ level, text }: { level: number; text: string }) {
  const tag = `h${Math.min(level, 6)}`;
  return h(tag, { class: `heading heading--${level}`, id: slug(text) }, text);
}

function ChapterHeader({ ctx, doc }: { ctx: Ctx; doc: PayloadDocument }) {
  const steps = STEPS.filter((s) => doc.steps.includes(s.id));
  const loose = ctx.ix.findings(
    (d) => d.loc.file === doc.file && (!d.element || !ctx.ix.byId.has(d.element)),
  );
  return (
    <header class="chapter__header">
      <div class="chapter__steps">
        {steps.map((s) => {
          const status = ctx.ix.payload.steps.find((p) => p.id === s.id);
          return (
            <span
              class={["step-chip", `step-chip--${status?.state ?? "todo"}`]}
              style={{ "--c": `var(--c-${s.phase})` }}
              title={s.question}
            >
              <strong>{s.id}</strong> {s.title}
            </span>
          );
        })}
        <code class="chapter__file">{doc.file}</code>
      </div>
      <FindingList findings={loose} />
    </header>
  );
}

export function DocumentView({ ctx }: { ctx: Ctx }) {
  const doc = ctx.ix.document(ctx.state.file) ?? ctx.ix.payload.documents[0];
  if (!doc) {
    return (
      <div class="empty">
        No chapters yet. Run <code>pdt42 guide</code> to start with the first step.
      </div>
    );
  }
  const agent = ctx.state.mode === "agent";
  const h1 = doc.nodes.find((n) => n.kind === "heading" && n.level === 1);
  const groups = groupNodes(doc.nodes.filter((n) => n !== h1));

  return (
    <article class={["chapter", agent && "chapter--agent"]}>
      <h1 class="heading heading--1">{doc.title}</h1>
      <ChapterHeader ctx={ctx} doc={doc} />
      {groups.map((g) => {
        if (g.kind === "run") {
          if (!agent) return <ProseRun ctx={ctx} {...g} />;
          return (
            <div class="agent-run">
              {g.prose && <Source text={g.prose} />}
              {g.ignores.map((i) => (
                <Source text={`:::ignore ${i.code} ${i.reason} :::`} />
              ))}
              {g.block && <Source text={blockSource(g.block)} lang="pdt42" />}
            </div>
          );
        }
        const node = g.node;
        switch (node.kind) {
          case "heading":
            return agent ? (
              <Source text={`${"#".repeat(node.level)} ${node.text}`} />
            ) : (
              <Heading level={node.level} text={node.text} />
            );
          case "block": {
            if (!isCanvas(node)) return document.createDocumentFragment();
            const id = String(node.attributes.id ?? "");
            const drawn = ctx.ix.canvases.get(id);
            if (agent) return <Source text={blockSource(node)} lang="pdt42" />;
            if (!drawn) {
              return (
                <div class="card card--missing" id={id}>
                  <span>This canvas block is invalid — see the findings of this chapter.</span>
                </div>
              );
            }
            return <CanvasFrame ctx={ctx} drawn={drawn} />;
          }
          case "ignore":
            return agent ? (
              <Source text={`:::ignore ${node.code} ${node.reason} :::`} />
            ) : (
              document.createDocumentFragment()
            );
          case "parse-error":
            return (
              <div class="finding finding--error">
                <code>parse</code> {node.message} (line {node.line})
              </div>
            );
          default:
            return document.createDocumentFragment();
        }
      })}
    </article>
  );
}
