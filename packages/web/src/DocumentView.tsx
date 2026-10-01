import { createElement, useMemo } from "react";
import { groupNodes as groupDocumentNodes, linkElementIds } from "@cli42/lib/web";
import type { RenderGroup } from "@cli42/lib/web";
import { ChapterDiff, headingClass } from "@cli42/lib/web-react";
import type { RenderNodesProps } from "@cli42/lib/web-react";
import {
  fieldValue,
  titleOf,
  STEPS,
  type AstNode,
  type BlockNode,
  type IgnoreNode,
  type PayloadDocument,
  type PayloadElement,
} from "@pdt42/core";
import { css, cx } from "./react-util.ts";
import type { Ctx } from "./context.ts";
import { ElementCard, FindingList } from "./ElementCard.tsx";
import { CanvasFrame } from "./canvases/CanvasFrame.tsx";
import { renderMarkdown, slug } from "./markdown.ts";
import { WorkspaceIndex, colorOf } from "./workspace.ts";

// A chapter, rendered like every *42 web view renders one: prose, with every element's prose
// swappable for its model box (click the stripe), canvases in place, the agent view showing the
// source — and, when a visualized difference touches the chapter, its changes inline.

/** Rules about a chapter rather than one element (W011: the chapter lacks its canvas). */
const CHAPTER_RULES = new Set(["W011"]);

const isCanvas = (n: { kind: string }): boolean =>
  n.kind === "block" && (n as BlockNode).blockType === "canvas";

/** Whether a node is an element's block, introduced by the prose before it (canvases are not). */
export function isElementBlock(node: { kind: string }): node is BlockNode {
  return node.kind === "block" && (node as BlockNode).inPdt42Fence && !isCanvas(node);
}

export type Group = RenderGroup<AstNode, BlockNode, IgnoreNode>;

/**
 * Prose runs and other nodes of a chapter (see `groupNodes` of @cli42/lib/web): consecutive
 * prose renders as one, and the element block that follows it belongs to it.
 */
export function groupNodes(nodes: readonly AstNode[]): Group[] {
  return groupDocumentNodes<AstNode, BlockNode, IgnoreNode>(nodes, { isBlock: isElementBlock });
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

/** Prose as HTML (rendered on the server), with the ids it mentions linked to their elements. */
function Prose({ ctx, html, text, own }: { ctx: Ctx; html?: string; text: string; own?: string }) {
  const rendered = useMemo(
    () => linkElementIds(html ?? renderMarkdown(text), ctx.ix.links, own),
    [ctx.ix, html, text, own],
  );
  return <div className="prose" dangerouslySetInnerHTML={{ __html: rendered }} />;
}

function ProseRun({
  ctx,
  text,
  html,
  block,
  ignores,
}: {
  ctx: Ctx;
  text: string;
  html?: string;
  block: BlockNode | null;
  ignores: IgnoreNode[];
}) {
  if (!block) return <Prose ctx={ctx} text={text} html={html} />;
  const id = String(block.attributes.id ?? "");
  const element = ctx.ix.byId.get(id);
  const toggle = () =>
    ctx.update((s) => {
      if (s.expanded.has(id)) s.expanded.delete(id);
      else s.expanded.add(id);
    });
  // Without prose there is nothing to swap with: the model box stands on its own.
  if (!text.trim()) return <ElementCard ctx={ctx} id={id} ignores={ignores} />;
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
      <Prose ctx={ctx} text={text} html={html} own={id} />
    </div>
  );
}

function Heading({ level, text }: { level: number; text: string }) {
  const tag = `h${Math.min(level, 6)}`;
  return createElement(
    tag,
    { className: cx(`heading heading--${level}`, headingClass(level)), id: slug(text) },
    text,
  );
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
  if (g.kind === "prose-run") {
    if (!agent) return <ProseRun ctx={ctx} html={g.renderedHtml} {...g} />;
    return (
      <div className="agent-run">
        {g.text.trim() && <Source text={g.text.trim()} />}
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
      // The chapter title is the page's heading.
      if (node.level === 1) return null;
      return agent ? (
        <Source text={`${"#".repeat(node.level)} ${node.text}`} />
      ) : (
        <Heading level={node.level} text={node.text} />
      );
    case "block": {
      if (!isCanvas(node)) {
        return agent || !node.inPdt42Fence ? (
          <Source text={blockSource(node)} lang="pdt42" />
        ) : null;
      }
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

/** Document nodes as the chapter renders them (the shared views call this for diff sections). */
export function NodesView({
  ctx,
  nodes,
  proseHtml,
  content,
  viewMode,
}: Pick<RenderNodesProps, "nodes" | "proseHtml" | "content" | "viewMode"> & { ctx: Ctx }) {
  // A diff side brings its own elements: its model boxes show that version.
  const own = useMemo<Ctx>(() => {
    if (!content) return ctx;
    const ix = new WorkspaceIndex({
      ...ctx.ix.payload,
      elements: content.elements as PayloadElement[],
    });
    return { ...ctx, ix };
  }, [ctx, content]);
  const groups = useMemo(() => groupNodes(nodes as AstNode[]), [nodes]);
  let run = 0;
  return (
    <>
      {groups.map((g, i) => {
        const group =
          g.kind === "prose-run" && proseHtml
            ? { ...g, renderedHtml: proseHtml[run++] ?? g.renderedHtml }
            : g;
        // Groups have no identity of their own; their position in the chapter is stable.
        return <GroupView key={i} ctx={own} g={group} agent={viewMode === "agent"} />;
      })}
    </>
  );
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
  const diff = ctx.diffDocuments?.get(doc.filePath);
  if (diff) {
    return (
      <ChapterDiff diff={diff} document={doc} viewMode={ctx.state.mode} targetElementId={null} />
    );
  }

  return (
    <article className={cx("chapter", agent && "chapter--agent")}>
      <h1 className={cx("heading heading--1", headingClass(1))}>{doc.title}</h1>
      <ChapterHeader ctx={ctx} doc={doc} />
      <NodesView ctx={ctx} nodes={doc.nodes} viewMode={ctx.state.mode} />
    </article>
  );
}
