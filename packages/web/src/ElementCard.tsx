import {
  blockFields,
  blockMeta,
  type BlockType,
  type Diagnostic,
  type IgnoreNode,
} from "@pdt42/core";
import { h } from "./dom.ts";
import type { Ctx } from "./context.ts";
import { canvasHref, canvasTitle, colorOf, elementHref, roleLabel } from "./workspace.ts";

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
      <span class="ref-chip ref-chip--missing" title="Not in the model">
        {id}
      </span>
    );
  }
  const role = e.kind === "entity" ? (e.data.role as string | undefined) : undefined;
  return (
    <a
      class={["ref-chip", incoming && "ref-chip--incoming"]}
      href={elementHref(e.file, e.id)}
      title={`${e.kind} ${e.id}`}
      style={{ "--c": colorOf(e.kind, role) }}
    >
      <span class="ref-chip__dot" />
      {e.title}
      {note && <span class="ref-chip__note">{note}</span>}
    </a>
  );
}

export function FindingList({ findings }: { findings: Diagnostic[] }) {
  if (!findings.length) return document.createDocumentFragment();
  return (
    <ul class="findings">
      {findings.map((f) => (
        <li class={["finding", `finding--${f.severity}`]}>
          <code>{f.code}</code>
          <span>{f.message}</span>
          <span class="finding__loc">
            {f.loc.file}:{f.loc.line}
          </span>
        </li>
      ))}
    </ul>
  );
}

function value(ctx: Ctx, kind: string, target: unknown): Node | string {
  if (target === true) return "yes";
  if (target === false) return "no";
  if (kind === "ref" && typeof target === "string") return <RefChip ctx={ctx} id={target} />;
  if (kind === "refs" && Array.isArray(target)) {
    return (
      <span class="chips">
        {target.map((id: string) => (
          <RefChip ctx={ctx} id={id} />
        ))}
      </span>
    );
  }
  if (Array.isArray(target)) {
    return (
      <ul class="field-list">
        {target.map((item) => (
          <li>{String(item)}</li>
        ))}
      </ul>
    );
  }
  if (kind === "enum" || kind === "enums") return <span class="pill">{String(target)}</span>;
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
      <div class="card card--missing" id={`el-${id}`}>
        <span>
          <code>{id}</code> is not in the model — see the findings of this chapter.
        </span>
      </div>
    );
  }
  const role = e.kind === "entity" ? (e.data.role as string | undefined) : undefined;
  const color = colorOf(e.kind, role);
  const meta = blockMeta(e.kind as BlockType);
  const fields = blockFields(e.kind as BlockType).filter(
    (f) => f.name !== "id" && f.name !== "title" && e.data[f.name] !== undefined,
  );
  const incoming = ctx.ix.incoming.get(e.id) ?? [];
  const canvases = ctx.ix.canvasesOf.get(e.id) ?? [];
  const findings = ctx.ix.findings((d) => d.element === e.id);

  return (
    <section class="card" id={`el-${e.id}`} style={{ "--c": color }} data-element={e.id}>
      {onDismiss ? (
        <button
          class="card__stripe card__stripe--button"
          title="Show the prose"
          aria-label="Show the prose"
          onClick={onDismiss}
        />
      ) : (
        <span class="card__stripe" />
      )}
      <div class="card__body">
        <header class="card__header">
          <span class="badge" title={meta.description}>
            {e.kind}
          </span>
          <span class="card__title">{e.title}</span>
          <code class="card__id">{e.id}</code>
          {role && <span class="pill pill--role">{roleLabel(role)}</span>}
        </header>
        {fields.length > 0 && (
          <dl class="fields">
            {fields.map((f) => (
              <div class="field" title={f.description}>
                <dt>{f.name}</dt>
                <dd>{value(ctx, f.kind, e.data[f.name])}</dd>
              </div>
            ))}
          </dl>
        )}
        {(incoming.length > 0 || canvases.length > 0) && (
          <div class="relations">
            {incoming.length > 0 && (
              <div class="relations__row">
                <span class="relations__label">referenced by</span>
                <span class="chips">
                  {incoming.map((r) => (
                    <RefChip ctx={ctx} id={r.from} note={r.field} incoming />
                  ))}
                </span>
              </div>
            )}
            {canvases.length > 0 && (
              <div class="relations__row">
                <span class="relations__label">on canvases</span>
                <span class="chips">
                  {canvases.map((v) => (
                    <a class="ref-chip ref-chip--canvas" href={canvasHref(v)}>
                      ▦ {canvasTitle(v.canvas)}
                      {v.of && ctx.ix.byId.get(v.of) && (
                        <span class="ref-chip__note">{ctx.ix.byId.get(v.of)!.title}</span>
                      )}
                    </a>
                  ))}
                </span>
              </div>
            )}
          </div>
        )}
        {ignores.length > 0 && (
          <ul class="ignores">
            {ignores.map((i) => (
              <li>
                <code>{i.code}</code> ignored — {i.reason}
              </li>
            ))}
          </ul>
        )}
        <FindingList findings={findings} />
      </div>
    </section>
  );
}
