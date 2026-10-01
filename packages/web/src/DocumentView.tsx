import { createElement } from "react";
import {
  fieldValue,
  titleOf,
  STEPS,
  type AstNode,
  type BlockNode,
  type IgnoreNode,
  type PayloadDocument,
} from "@pdt42/core";
import { css, cx } from "./react-util.ts";
import type { Ctx } from "./context.ts";
import { ElementCard, FindingList } from "./ElementCard.tsx";
import { CanvasFrame } from "./canvases/CanvasFrame.tsx";
import { renderMarkdown, slug } from "./markdown.ts";
import { colorOf } from "./workspace.ts";

// A chapter, rendered like arc42 renders one: prose, with every element's prose swappable for
// its model box (click the stripe), canvases in place, and the agent view showing the source.

/** Rules about a chapter rather than one element (W011: the chapter lacks its canvas). */
const CHAPTER_RULES = new Set(["W011"]);

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
    groups.push({
      kind: "run",
      prose: prose.join("\n").trim(),
      block,
      ignores: block ? ignores : [],
    });
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
    const items = node.lists?.[key];
    if (items) lines.push(`${key}:`, ...items.map((v) => `  - ${v}`));
    else lines.push(`${key}: ${value}`);
  }
  lines.push(":::");
  return lines.join("\n");
}

function Source({ text, lang }: { text: string; lang?: string }) {
  return (
    <pre className={cx("source", lang && `source--${lang}`)}>
      {lang && <span className="source__lang">{lang}</span>}
      <code>{text}</code>
    </pre>
  );
}

function Prose({ text }: { text: string }) {
  return <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />;
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
  const role =
    element?.kind === "entity" ? (fieldValue(element, "role") as string | undefined) : undefined;
  return (
    <div className="run" id={`el-${id}`} data-element={id}>
      <button
        className="run__stripe"
        style={css({ "--c": element ? colorOf(element.kind, role) : "var(--text-muted)" })}
        title={`Show the model box of ${element ? titleOf(element) : id}`}
        aria-label={`Show the model box of ${element ? titleOf(element) : id}`}
        onClick={toggle}
      >
        {findings.length > 0 && (
          <span
            className={cx(
              "run__mark",
              findings.some((f) => f.severity === "error") && "run__mark--error",
            )}
          />
        )}
      </button>
      <Prose text={prose} />
    </div>
  );
}

function Heading({ level, text }: { level: number; text: string }) {
  const tag = `h${Math.min(level, 6)}`;
  return createElement(tag, { className: `heading heading--${level}`, id: slug(text) }, text);
}

function ChapterHeader({ ctx, doc }: { ctx: Ctx; doc: PayloadDocument }) {
  const steps = STEPS.filter((s) => doc.steps.includes(s.id));
  // Findings about the chapter as a whole, and findings no element here can show.
  const loose = ctx.ix.findings(
    (d) =>
      d.file === doc.filePath &&
      (CHAPTER_RULES.has(d.code) || !d.element || !ctx.ix.byId.has(d.element)),
  );
  return (
    <header className="chapter__header">
      <div className="chapter__steps">
        {steps.map((s) => {
          const status = ctx.ix.payload.steps.find((p) => p.id === s.id);
          return (
            <span
              key={s.id}
              className={cx("step-chip", `step-chip--${status?.state ?? "todo"}`)}
              style={css({ "--c": `var(--c-${s.phase})` })}
              title={s.question}
            >
              <strong>{s.id}</strong> {s.title}
            </span>
          );
        })}
        <code className="chapter__file">{doc.filePath}</code>
      </div>
      <FindingList findings={loose} />
    </header>
  );
}

function GroupView({ ctx, g, agent }: { ctx: Ctx; g: Group; agent: boolean }) {
  if (g.kind === "run") {
    if (!agent) return <ProseRun ctx={ctx} {...g} />;
    return (
      <div className="agent-run">
        {g.prose && <Source text={g.prose} />}
        {g.ignores.map((i, idx) => (
          <Source key={idx} text={`:::ignore ${i.ruleCode} ${i.reason ?? ""} :::`} />
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
      if (!isCanvas(node)) return null;
      const id = String(node.attributes.id ?? "");
      const drawn = ctx.ix.canvases.get(id);
      if (agent) return <Source text={blockSource(node)} lang="pdt42" />;
      if (!drawn) {
        return (
          <div className="card card--missing" id={id}>
            <span>This canvas block is invalid — see the findings of this chapter.</span>
          </div>
        );
      }
      return <CanvasFrame ctx={ctx} drawn={drawn} />;
    }
    case "ignore":
      return agent ? <Source text={`:::ignore ${node.ruleCode} ${node.reason ?? ""} :::`} /> : null;
    default:
      return null;
  }
}

export function DocumentView({ ctx }: { ctx: Ctx }) {
  const doc = ctx.ix.document(ctx.state.file) ?? ctx.ix.payload.documents[0];
  if (!doc) {
    return (
      <div className="empty">
        No chapters yet. Run <code>pdt42 guide</code> to start with the first step.
      </div>
    );
  }
  const agent = ctx.state.mode === "agent";
  const h1 = doc.nodes.find((n) => n.kind === "heading" && n.level === 1);
  const groups = groupNodes(doc.nodes.filter((n) => n !== h1));

  return (
    <article className={cx("chapter", agent && "chapter--agent")}>
      <h1 className="heading heading--1">{doc.title}</h1>
      <ChapterHeader ctx={ctx} doc={doc} />
      {groups.map((g, i) => (
        // Groups have no identity of their own; their position in the chapter is stable.
        <GroupView key={i} ctx={ctx} g={g} agent={agent} />
      ))}
    </article>
  );
}
