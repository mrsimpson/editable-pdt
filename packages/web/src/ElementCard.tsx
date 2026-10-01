import type { MouseEvent, ReactNode } from "react";
import {
  blockFields,
  blockMeta,
  fieldValue,
  titleOf,
  type BlockType,
  type Diagnostic,
  type IgnoreNode,
} from "@pdt42/core";
import { css, cx } from "./react-util.ts";
import { inline } from "./markdown.ts";
import type { Ctx } from "./context.ts";
import { canvasHref, canvasTitle, colorOf, elementHref, roleLabel } from "./workspace.ts";

/** Incoming references shown before the rest fold away. */
const FOLD = 10;

// The model box: an element as the model sees it — its fields, what it points to, what points
// to it, the canvases it appears on and the findings about it.

export function RefChip({
  ctx,
  id,
  note,
  incoming,
}: {
  ctx: Ctx;
  id: string;
  note?: string;
  incoming?: boolean;
}) {
  const e = ctx.ix.byId.get(id);
  if (!e) {
    return (
      <span className="ref-chip ref-chip--missing" title="Not in the model">
        {id}
      </span>
    );
  }
  const role = e.kind === "entity" ? (fieldValue(e, "role") as string | undefined) : undefined;
  return (
    <a
      className={cx("ref-chip", incoming && "ref-chip--incoming")}
      href={elementHref(e.loc.file, e.id)}
      title={`${e.kind} ${e.id}`}
      style={css({ "--c": colorOf(e.kind, role) })}
    >
      <span className="ref-chip__dot" />
      {titleOf(e)}
      {note && <span className="ref-chip__note">{note}</span>}
    </a>
  );
}

export function FindingList({ findings }: { findings: Diagnostic[] }) {
  if (!findings.length) return null;
  return (
    <ul className="findings">
      {findings.map((f, idx) => (
        <li key={idx} className={cx("finding", `finding--${f.severity}`)}>
          <code>{f.code}</code>
          <span
            className="finding__message"
            dangerouslySetInnerHTML={{ __html: inline(f.message) }}
          />
          <span className="finding__loc">
            {f.file}:{f.line}
          </span>
        </li>
      ))}
    </ul>
  );
}

function value(ctx: Ctx, kind: string, target: unknown): ReactNode {
  if (target === true) return "yes";
  if (target === false) return "no";
  if (kind === "ref" && typeof target === "string") return <RefChip ctx={ctx} id={target} />;
  if (kind === "refs" && Array.isArray(target)) {
    return (
      <span className="chips">
        {target.map((id: string, idx) => (
          <RefChip key={idx} ctx={ctx} id={id} />
        ))}
      </span>
    );
  }
  if (Array.isArray(target)) {
    return (
      <ul className="field-list">
        {target.map((item, idx) => (
          <li key={idx}>{String(item)}</li>
        ))}
      </ul>
    );
  }
  if (kind === "enum" || kind === "enums") return <span className="pill">{String(target)}</span>;
  return String(target);
}

export function ElementCard({
  ctx,
  id,
  ignores = [],
  onDismiss,
}: {
  ctx: Ctx;
  id: string;
  ignores?: IgnoreNode[];
  onDismiss?: () => void;
}) {
  const e = ctx.ix.byId.get(id);
  if (!e) {
    return (
      <div className="card card--missing" id={`el-${id}`}>
        <span>
          <code>{id}</code> is not in the model — see the findings of this chapter.
        </span>
      </div>
    );
  }
  const role = e.kind === "entity" ? (fieldValue(e, "role") as string | undefined) : undefined;
  const color = colorOf(e.kind, role);
  const meta = blockMeta(e.kind as BlockType);
  const fields = blockFields(e.kind as BlockType).filter(
    (f) =>
      f.name !== "id" &&
      f.name !== "title" &&
      fieldValue(e, f.name) !== undefined &&
      !(Array.isArray(fieldValue(e, f.name)) && (fieldValue(e, f.name) as unknown[]).length === 0),
  );
  const incoming = ctx.ix.incoming.get(e.id) ?? [];
  const canvases = ctx.ix.canvasesOf.get(e.id) ?? [];
  const findings = ctx.ix.findings((d) => d.element === e.id);

  return (
    <section className="card" id={`el-${e.id}`} style={css({ "--c": color })} data-element={e.id}>
      {onDismiss ? (
        <button
          className="card__stripe card__stripe--button"
          title="Show the prose"
          aria-label="Show the prose"
          onClick={onDismiss}
        />
      ) : (
        <span className="card__stripe" />
      )}
      <div className="card__body">
        <header className="card__header">
          <span className="badge" title={meta.description}>
            {e.kind}
          </span>
          <span className="card__title">{titleOf(e)}</span>
          <code className="card__id">{e.id}</code>
          {role && <span className="pill pill--role">{roleLabel(role)}</span>}
        </header>
        {fields.length > 0 && (
          <dl className="fields">
            {fields.map((f, idx) => (
              <div key={idx} className="field" title={f.description}>
                <dt>{f.name}</dt>
                <dd>{value(ctx, f.kind, fieldValue(e, f.name))}</dd>
              </div>
            ))}
          </dl>
        )}
        {(incoming.length > 0 || canvases.length > 0) && (
          <div className="relations">
            {incoming.length > 0 && (
              <div className="relations__row">
                <span className="relations__label">referenced by</span>
                <span className={cx("chips", incoming.length > FOLD && "chips--folded")}>
                  {incoming.map((r, idx) => (
                    <RefChip key={idx} ctx={ctx} id={r.from} note={r.field} incoming />
                  ))}
                  {incoming.length > FOLD && (
                    <button
                      className="chips__more"
                      onClick={(event: MouseEvent<HTMLButtonElement>) => {
                        const chips = (event.currentTarget as HTMLElement).parentElement!;
                        chips.classList.remove("chips--folded");
                      }}
                    >
                      +{incoming.length - FOLD} more
                    </button>
                  )}
                </span>
              </div>
            )}
            {canvases.length > 0 && (
              <div className="relations__row">
                <span className="relations__label">on canvases</span>
                <span className="chips">
                  {canvases.map((v, idx) => (
                    <a key={idx} className="ref-chip ref-chip--canvas" href={canvasHref(v)}>
                      ▦ {canvasTitle(v.canvas)}
                      {v.of && ctx.ix.byId.get(v.of) && (
                        <span className="ref-chip__note">{titleOf(ctx.ix.byId.get(v.of)!)}</span>
                      )}
                    </a>
                  ))}
                </span>
              </div>
            )}
          </div>
        )}
        {ignores.length > 0 && (
          <ul className="ignores">
            {ignores.map((i, idx) => (
              <li key={idx}>
                <code>{i.ruleCode}</code> ignored — {i.reason}
              </li>
            ))}
          </ul>
        )}
        <FindingList findings={findings} />
      </div>
    </section>
  );
}
