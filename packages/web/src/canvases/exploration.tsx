import type {
  ArenaScanModel,
  BriefModel,
  EcosystemScanModel,
  LayerRow,
  PatternCardsModel,
  PlatformPlaysModel,
  VrioModel,
  WardleyModel,
} from "@pdt42/core";
import { h } from "../dom.ts";
import type { Ctx } from "../context.ts";
import { Area, Empty, Notes, Sticky, Stickies } from "./parts.tsx";

export function ArenaScan({ ctx, m }: { ctx: Ctx; m: ArenaScanModel }) {
  const focus = new Set(m.focus);
  const sticky = (a: ArenaScanModel["sequence"][number]) => (
    <Sticky
      ctx={ctx}
      item={a}
      variant={focus.has(a.id) ? "strong" : undefined}
      note={focus.has(a.id) ? "focus" : undefined}
    />
  );
  return (
    <div class="cv-stack">
      <div class="cv-grid cv-grid--3">
        <Area title="Enabling arenas" hint="Layers that make other arenas possible">
          {m.enabling.length ? <div class="stickies">{m.enabling.map(sticky)}</div> : <Empty />}
        </Area>
        <Area title="Arenas in sequence" hint="Phases of the systemic interaction, in order">
          {m.sequence.length ? (
            <div class="chain">
              {m.sequence.map((a, i) => [i > 0 && <span class="chain__arrow">→</span>, sticky(a)])}
            </div>
          ) : (
            <Empty />
          )}
        </Area>
        <Area title="Enabled arenas" hint="Arenas that build on an enabling layer">
          {m.enabled.length ? <div class="stickies">{m.enabled.map(sticky)}</div> : <Empty />}
        </Area>
      </div>
      <Area title="Steps of the focus arena" class="area--wide">
        {m.steps.length ? (
          m.steps.map((s) => (
            <div class="job-map">
              <Sticky ctx={ctx} item={s.arena} variant="strong" />
              <ol class="chevrons">
                {s.steps.map((step) => (
                  <li>{step}</li>
                ))}
              </ol>
            </div>
          ))
        ) : (
          <Empty text="Mark an arena with focus: yes" />
        )}
      </Area>
    </div>
  );
}

function LayerGrid({
  ctx,
  rows,
  columns,
}: {
  ctx: Ctx;
  rows: LayerRow[];
  columns: ("entities" | "assets" | "moats")[];
}) {
  const label = { entities: "Entities", assets: "Assets", moats: "Moats" };
  return (
    <div class="layers" style={{ "--cols": String(columns.length) }}>
      <span />
      {columns.map((c) => (
        <span class="layers__col">{label[c]}</span>
      ))}
      {rows.map((row) => [
        <span class="layers__row">{row.label}</span>,
        ...columns.map((c) => (
          <div class="layers__cell">
            <Stickies ctx={ctx} items={row[c]} empty="" />
          </div>
        )),
      ])}
    </div>
  );
}

export function EcosystemScan({ ctx, m }: { ctx: Ctx; m: EcosystemScanModel }) {
  return (
    <div class="cv-grid cv-grid--scan">
      <Area
        title="Ecosystem layers"
        hint="Where the entities sit: long tail, aggregators, infrastructures"
      >
        <LayerGrid ctx={ctx} rows={m.layers} columns={["entities"]} />
        {m.unplaced.length > 0 && (
          <div class="layers__unplaced">
            <span class="relations__label">not placed on a layer</span>
            <Stickies ctx={ctx} items={m.unplaced} />
          </div>
        )}
      </Area>
      <Area title="Jobs to be done" hint="What entities try to get done, step by step">
        {m.jobs.length ? (
          <ul class="jobs">
            {m.jobs.map((j) => (
              <li>
                <Sticky ctx={ctx} item={j.job} note={j.jobStep} />
                <span class="jobs__by">
                  {j.entities.map((e) => (
                    <Sticky ctx={ctx} item={e} class="sticky--mini" />
                  ))}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
      </Area>
    </div>
  );
}

export function Vrio({ ctx, m }: { ctx: Ctx; m: VrioModel }) {
  const verdict = (a: VrioModel["assets"][number]) =>
    a.o
      ? "Sustained advantage"
      : a.i
        ? "Unused advantage"
        : a.r
          ? "Temporary advantage"
          : a.v
            ? "Parity"
            : "Disadvantage";
  const mark = (on: boolean) => <span class={["dot", on && "dot--on"]}>{on ? "●" : "○"}</span>;
  if (!m.assets.length) return <Empty text="No assets yet" />;
  return (
    <table class="cv-table">
      <thead>
        <tr>
          <th>Asset</th>
          <th title="Valuable">V</th>
          <th title="Rare">R</th>
          <th title="Inimitable">I</th>
          <th title="Organised to capture value">O</th>
          <th>Implication</th>
        </tr>
      </thead>
      <tbody>
        {m.assets.map((a) => (
          <tr>
            <td>
              <Sticky ctx={ctx} item={a.asset} note={a.layer} />
            </td>
            <td>{mark(a.v)}</td>
            <td>{mark(a.r)}</td>
            <td>{mark(a.i)}</td>
            <td>{mark(a.o)}</td>
            <td class="cv-table__verdict">{verdict(a)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Wardley({ ctx, m }: { ctx: Ctx; m: WardleyModel }) {
  const byId = new Map(m.nodes.map((n) => [n.ref.id, n]));
  const pct = (v: number) => `${(v * 100).toFixed(2)}%`;
  return (
    <div class="wardley">
      <span class="wardley__axis wardley__axis--y">Visible to the user ↑</span>
      <div class="wardley__plot">
        <svg
          class="wardley__lines"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {m.stages.slice(1).map((_s, i) => (
            <line
              x1={((i + 1) * 100) / m.stages.length}
              x2={((i + 1) * 100) / m.stages.length}
              y1="0"
              y2="100"
              class="wardley__stage-line"
            />
          ))}
          {m.links.map((l) => {
            const a = byId.get(l.from)!;
            const b = byId.get(l.to)!;
            return (
              <line
                x1={a.x * 100}
                y1={(1 - a.y) * 100}
                x2={b.x * 100}
                y2={(1 - b.y) * 100}
                class="wardley__link"
              />
            );
          })}
          {m.nodes
            .filter((n) => n.targetX !== undefined && Math.abs(n.targetX - n.x) > 0.05)
            .map((n) => (
              <line
                x1={n.x * 100}
                y1={(1 - n.y) * 100}
                x2={n.targetX! * 100}
                y2={(1 - n.y) * 100}
                class="wardley__move"
              />
            ))}
        </svg>
        {m.nodes
          .filter((n) => n.targetX !== undefined && Math.abs(n.targetX - n.x) > 0.05)
          .map((n) => (
            <span
              class="wardley__target"
              style={{ left: pct(n.targetX!), top: pct(1 - n.y) }}
              title={`${n.ref.title}: target`}
            />
          ))}
        {m.nodes.map((n) => (
          <div class="wardley__node" style={{ left: pct(n.x), top: pct(1 - n.y) }}>
            <Sticky ctx={ctx} item={n.ref} class="sticky--mini" />
          </div>
        ))}
      </div>
      <div class="wardley__stages">
        {m.stages.map((s) => (
          <span>{s}</span>
        ))}
      </div>
      <span class="wardley__axis wardley__axis--x">Evolution →</span>
    </div>
  );
}

export function PlatformPlays({ ctx, m }: { ctx: Ctx; m: PlatformPlaysModel }) {
  return (
    <div class="cv-grid cv-grid--3">
      {m.plays.map((p) => (
        <Area
          title={`${p.id.toUpperCase()} · ${p.label}`}
          class={p.applied.length ? "area--active" : "area--quiet"}
        >
          {p.applied.length ? (
            p.applied.map((a) => (
              <div class="play">
                <Sticky ctx={ctx} item={a.play} />
                {a.insight && <p class="area__text">{a.insight}</p>}
                {a.affects.length > 0 && (
                  <div class="stickies">
                    {a.affects.map((r) => (
                      <Sticky ctx={ctx} item={r} class="sticky--mini" />
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <Empty text="Not played" />
          )}
        </Area>
      ))}
    </div>
  );
}

export function PatternCards({ ctx, m }: { ctx: Ctx; m: PatternCardsModel }) {
  return (
    <div class="cv-grid cv-grid--4">
      {m.cards.map((c) => (
        <Area
          title={`${c.id.toUpperCase()} · ${c.label}`}
          class={c.scenarios.length ? "area--active" : "area--quiet"}
        >
          <Stickies ctx={ctx} items={c.scenarios} empty="" />
        </Area>
      ))}
    </div>
  );
}

export function Brief({ ctx, m }: { ctx: Ctx; m: BriefModel }) {
  const b = m.brief;
  return (
    <div class="cv-stack">
      <div class="cv-grid cv-grid--brief">
        <Area title="Layers of the ecosystem">
          <LayerGrid ctx={ctx} rows={m.layers} columns={["entities", "assets", "moats"]} />
        </Area>
        <Area title="The brief" class="area--active">
          {b ? (
            <div class="brief">
              <Sticky ctx={ctx} item={b.ref} variant="strong" />
              {b.arena && (
                <div class="relations__row">
                  <span class="relations__label">focus arena</span>
                  <Sticky ctx={ctx} item={b.arena} class="sticky--mini" />
                </div>
              )}
              <div class="relations__row">
                <span class="relations__label">for</span>
                <span class="chips">
                  {b.entities.map((e) => (
                    <Sticky ctx={ctx} item={e} class="sticky--mini" />
                  ))}
                </span>
              </div>
              <h5>Standardise</h5>
              <Notes items={b.standardize} />
              <h5>On the product side</h5>
              <Notes items={b.productSide} />
              <h5>Moats to build</h5>
              <Stickies ctx={ctx} items={b.moats} />
            </div>
          ) : (
            <Empty text="No brief yet" />
          )}
        </Area>
      </div>
      <Area title="Scenarios">
        {m.scenarios.length ? (
          <div class="cv-grid cv-grid--3">
            {m.scenarios.map((s) => (
              <div class="scenario">
                <Sticky ctx={ctx} item={s.scenario} note={s.pattern} />
                {s.impact && <p class="area__text">{s.impact}</p>}
              </div>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </Area>
    </div>
  );
}
