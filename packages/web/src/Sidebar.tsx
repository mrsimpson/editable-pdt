import type { ReactNode } from "react";
import { PHASES, STEPS } from "@pdt42/core";
import { css, cx } from "./react-util.ts";
import type { Ctx } from "./context.ts";
import { slug } from "./markdown.ts";

// The method as navigation: phases, their steps with progress, and the headings of the open
// chapter.

const MARK = { done: "✓", open: "●", todo: "○" } as const;

export function Sidebar({ ctx, onTheme }: { ctx: Ctx; onTheme: () => void }) {
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
    const active = state.file === file;
    return (
      <li key={file} className={cx("nav__item", active && "nav__item--active")}>
        <a
          className="nav__link"
          href={`#${file}`}
          style={css(phase ? { "--c": `var(--c-${phase})` } : undefined)}
        >
          {stepState && (
            <span className={cx("nav__mark", `nav__mark--${stepState}`)} title={stepState}>
              {MARK[stepState]}
            </span>
          )}
          <span className="nav__label">{label}</span>
        </a>
        {active && (
          <ul className="nav__headings">
            {headings(file).map((n, i) =>
              n.kind === "heading" ? (
                <li key={i}>
                  <a href={`#${file}:${slug(n.text)}`}>{n.text}</a>
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
      if (!doc || claimed.has(doc.file)) {
        // The step shares a chapter with another step, or has none yet.
        return (
          <li
            key={s.id}
            className="nav__item nav__item--bare"
            title={doc ? `In ${doc.title}` : "No chapter yet"}
          >
            <a
              className="nav__link"
              href={doc ? `#${doc.file}` : undefined}
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
      claimed.add(doc.file);
      return docLink(doc.file, label, status?.state ?? "todo", phase);
    });

  const phases = PHASES.map((p, idx) => (
    <li key={idx} className="nav__phase" style={css({ "--c": `var(--c-${p.id})` })}>
      <span className="nav__phase-title" title={p.question}>
        {p.title}
      </span>
      <ul className="nav__steps">{stepItems(p.id)}</ul>
    </li>
  ));
  const others = ix.payload.documents.filter((d) => !claimed.has(d.file) && !d.steps.length);

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
      <nav>
        <ul className="nav">
          {phases}
          {others.length > 0 && (
            <li className="nav__phase">
              <span className="nav__phase-title">Other chapters</span>
              <ul className="nav__steps">{others.map((d) => docLink(d.file, d.title))}</ul>
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
    </aside>
  );
}
