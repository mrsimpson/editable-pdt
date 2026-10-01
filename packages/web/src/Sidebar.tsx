import type { ReactNode } from "react";
import type { DiffDocument } from "@cli42/lib/diff";
import { changesHref } from "@cli42/lib/web";
import { ChangeCounts } from "@cli42/lib/web-react";
import { PHASES, STEPS } from "@pdt42/core";
import { css, cx } from "./react-util.ts";
import type { Ctx } from "./context.ts";
import { slug } from "./markdown.ts";

// The method as navigation: phases, their steps with progress, and the headings of the open
// chapter.

const MARK = { done: "✓", open: "●", todo: "○" } as const;

export interface SidebarProps {
  ctx: Ctx;
  onTheme: () => void;
  /** What the main area shows. */
  view: "document" | "changes" | "history";
  /** The chapters a visualized difference changes (serve/build --diff), by path. */
  changes?: Map<string, DiffDocument>;
  /** Present when there is a history (serve, build --with-history). */
  history?: { onSelect: () => void; onSelectDocuments: () => void; panel: ReactNode };
}

export function Sidebar({ ctx, onTheme, view, changes, history }: SidebarProps) {
  const { ix, state } = ctx;
  const claimed = new Set<string>();
  const counts = {
    error: ix.payload.diagnostics.filter((d) => d.severity === "error").length,
    warning: ix.payload.diagnostics.filter((d) => d.severity === "warning").length,
    hint: ix.payload.diagnostics.filter((d) => d.severity === "hint").length,
  };
  const headings = (file: string) =>
    (ix.document(file)?.nodes ?? []).filter((n) => n.kind === "heading" && n.level === 2);

  const docLink = (
    file: string,
    label: ReactNode,
    stepState?: keyof typeof MARK,
    phase?: string,
  ) => {
    const active = view === "document" && state.file === file;
    const changed = changes?.get(file);
    return (
      <li key={file} className={cx("nav__item", active && "nav__item--active")}>
        <a
          className="nav__link"
          href={ix.documentHref(file)}
          aria-current={active ? "page" : undefined}
          style={css(phase ? { "--c": `var(--c-${phase})` } : undefined)}
        >
          {stepState && (
            <span className={cx("nav__mark", `nav__mark--${stepState}`)} title={stepState}>
              {MARK[stepState]}
            </span>
          )}
          <span className="nav__label">{label}</span>
          {changed && (
            <span data-testid="doc-change-badge">
              <ChangeCounts {...changed} />
            </span>
          )}
        </a>
        {active && (
          <ul className="nav__headings">
            {headings(file).map((n, i) =>
              n.kind === "heading" ? (
                <li key={i}>
                  <a href={ix.documentHref(file, slug(n.text))}>{n.text}</a>
                </li>
              ) : null,
            )}
          </ul>
        )}
      </li>
    );
  };

  const stepItems = (phase: string) =>
    STEPS.filter((s) => s.phase === phase).map((s) => {
      const doc = ix.stepDocument(s.id);
      const status = ix.payload.steps.find((p) => p.id === s.id);
      const label = (
        <span>
          <strong className="nav__step">{s.id}</strong> {s.title}
        </span>
      );
      if (!doc || claimed.has(doc.filePath)) {
        // The step shares a chapter with another step, or has none yet.
        return (
          <li
            key={s.id}
            className="nav__item nav__item--bare"
            title={doc ? `In ${doc.title}` : "No chapter yet"}
          >
            <a
              className="nav__link"
              href={doc ? ix.documentHref(doc.filePath) : undefined}
              style={css({ "--c": `var(--c-${phase})` })}
            >
              <span className={cx("nav__mark", `nav__mark--${status?.state ?? "todo"}`)}>
                {MARK[status?.state ?? "todo"]}
              </span>
              <span className="nav__label">{label}</span>
            </a>
          </li>
        );
      }
      claimed.add(doc.filePath);
      return docLink(doc.filePath, label, status?.state ?? "todo", phase);
    });

  const phases = PHASES.map((p, idx) => (
    <li key={idx} className="nav__phase" style={css({ "--c": `var(--c-${p.id})` })}>
      <span className="nav__phase-title" title={p.question}>
        {p.title}
      </span>
      <ul className="nav__steps">{stepItems(p.id)}</ul>
    </li>
  ));
  const others = ix.payload.documents.filter((d) => !claimed.has(d.filePath) && !d.steps.length);

  return (
    <aside className={cx("sidebar", state.sidebarOpen && "sidebar--open")}>
      <header className="sidebar__header">
        <a className="logo" href="#">
          pdt<span className="logo__42">42</span>
        </a>
        <span className="sidebar__name" title={ix.payload.name}>
          {ix.payload.name}
        </span>
        <button
          className="sidebar__close"
          aria-label="Close navigation"
          onClick={() => ctx.update((s) => (s.sidebarOpen = false))}
        >
          ×
        </button>
      </header>
      <div className="sidebar__controls">
        <div className="toggle" role="group" aria-label="View">
          {(["human", "agent"] as const).map((mode, idx) => (
            <button
              key={idx}
              className={cx("toggle__option", state.mode === mode && "toggle__option--on")}
              aria-pressed={state.mode === mode}
              onClick={() => ctx.update((s) => (s.mode = mode))}
              title={
                mode === "human"
                  ? "Rendered chapters and canvases"
                  : "The source the agent reads and writes"
              }
            >
              {mode === "human" ? "Human" : "Agent"}
            </button>
          ))}
        </div>
        <button
          className="icon-button"
          onClick={onTheme}
          title="Toggle light / dark"
          aria-label="Toggle theme"
        >
          ◐
        </button>
      </div>
      {history && (
        <div className="toggle sidebar__tabs" role="tablist" aria-label="Sidebar view">
          <button
            role="tab"
            data-testid="sidebar-tab-documents"
            aria-selected={view !== "history"}
            className={cx("toggle__option", view !== "history" && "toggle__option--on")}
            onClick={history.onSelectDocuments}
          >
            Chapters
          </button>
          <button
            role="tab"
            data-testid="sidebar-tab-history"
            aria-selected={view === "history"}
            className={cx("toggle__option", view === "history" && "toggle__option--on")}
            onClick={history.onSelect}
          >
            History
          </button>
        </div>
      )}
      {view === "history" && history?.panel}
      {view !== "history" && changes && (
        <a
          className={cx("nav__link nav__changes", view === "changes" && "nav__item--active")}
          href={changesHref}
          data-testid="sidebar-changes-link"
          aria-current={view === "changes" ? "page" : undefined}
        >
          <span className="nav__label">Changes</span>
          <ChangeCounts
            {...[...changes.values()].reduce(
              (total, d) => ({
                added: total.added + d.added,
                modified: total.modified + d.modified,
                removed: total.removed + d.removed,
              }),
              { added: 0, modified: 0, removed: 0 },
            )}
          />
        </a>
      )}
      <nav hidden={view === "history"}>
        <ul className="nav">
          {phases}
          {others.length > 0 && (
            <li className="nav__phase">
              <span className="nav__phase-title">Other chapters</span>
              <ul className="nav__steps">{others.map((d) => docLink(d.filePath, d.title))}</ul>
            </li>
          )}
        </ul>
      </nav>
      <footer className="sidebar__footer">
        <span>
          {ix.payload.elements.length} elements · {ix.payload.canvases.length} canvases
        </span>
        <span className="sidebar__findings">
          <span className="count count--error">{counts.error}</span>
          <span className="count count--warning">{counts.warning}</span>
          <span className="count count--hint">{counts.hint}</span>
        </span>
      </footer>
      <p className="sidebar__credit">
        Drawn with <a href="https://github.com/mrsimpson/pdt42">pdt42</a> after the{" "}
        <a href="https://www.boundaryless.io/pdt-toolkit/">Platform Design Toolkit</a> by
        Boundaryless · <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>
      </p>
    </aside>
  );
}
