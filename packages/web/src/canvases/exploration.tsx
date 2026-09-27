import { Fragment } from "react";
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
import { css, cx } from "../react-util.ts";
import type { Ctx } from "../context.ts";
import { Area, Empty, Notes, Sticky, Stickies } from "./parts.tsx";

export function ArenaScan({ ctx, m }: { ctx: Ctx; m: ArenaScanModel }) {
  const focus = new Set(m.focus);
  const sticky = (a: ArenaScanModel["sequence"][number]) => (
    <Sticky
      key={a.id}
      ctx={ctx}
      item={a}
      variant={focus.has(a.id) ? "strong" : undefined}
      note={focus.has(a.id) ? "focus" : undefined}
    />
  );
  return (
    <div className="cv-stack">
      <div className="cv-grid cv-grid--3">
        <Area title="Enabling arenas" hint="Layers that make other arenas possible">
          {m.enabling.length ? <div className="stickies">{m.enabling.map(sticky)}</div> : <Empty />}
        </Area>
        <Area title="Arenas in sequence" hint="Phases of the systemic interaction, in order">
          {m.sequence.length ? (
            <div className="chain">
              {m.sequence.map((a, i) => (
                <Fragment key={a.id}>
                  {i > 0 && <span className="chain__arrow">→</span>}
                  {sticky(a)}
                </Fragment>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Area>
        <Area title="Enabled arenas" hint="Arenas that build on an enabling layer">
          {m.enabled.length ? <div className="stickies">{m.enabled.map(sticky)}</div> : <Empty />}
        </Area>
      </div>
      <Area title="Steps of the focus arena" className="area--wide">
        {m.steps.length ? (
          m.steps.map((s, idx) => (
            <div key={idx} className="job-map">
              <Sticky ctx={ctx} item={s.arena} variant="strong" />
              <ol className="chevrons">
                {s.steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
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
    <div className="layers" style={css({ "--cols": String(columns.length) })}>
      <span />
      {columns.map((c, idx) => (
        <span key={idx} className="layers__col">
          {label[c]}
        </span>
      ))}
      {rows.map((row) => (
        <Fragment key={row.layer}>
          <span className="layers__row">{row.label}</span>
          {columns.map((c) => (
            <div key={c} className="layers__cell">
              <Stickies ctx={ctx} items={row[c]} empty="" />
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
}

export function EcosystemScan({ ctx, m }: { ctx: Ctx; m: EcosystemScanModel }) {
  return (
    <div className="cv-grid cv-grid--scan">
      <Area
        title="Ecosystem layers"
        hint="Where the entities sit: long tail, aggregators, infrastructures"
      >
        <LayerGrid ctx={ctx} rows={m.layers} columns={["entities"]} />
        {m.unplaced.length > 0 && (
          <div className="layers__unplaced">
            <span className="relations__label">not placed on a layer</span>
            <Stickies ctx={ctx} items={m.unplaced} />
          </div>
        )}
      </Area>
      <Area title="Jobs to be done" hint="What entities try to get done, step by step">
        {m.jobs.length ? (
          <ul className="jobs">
            {m.jobs.map((j, idx) => (
              <li key={idx}>
                <Sticky ctx={ctx} item={j.job} note={j.jobStep} />
                <span className="jobs__by">
                  {j.entities.map((e, idx) => (
                    <Sticky key={idx} ctx={ctx} item={e} className="sticky--mini" />
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
  const mark = (on: boolean) => (
    <span className={cx("dot", on && "dot--on")}>{on ? "●" : "○"}</span>
  );
  if (!m.assets.length) return <Empty text="No assets yet" />;
  return (
    <table className="cv-table">
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
        {m.assets.map((a, idx) => (
          <tr key={idx}>
            <td>
              <Sticky ctx={ctx} item={a.asset} note={a.layer} />
            </td>
            <td>{mark(a.v)}</td>
            <td>{mark(a.r)}</td>
            <td>{mark(a.i)}</td>
            <td>{mark(a.o)}</td>
            <td className="cv-table__verdict">{verdict(a)}</td>
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
    <div className="wardley">
      <span className="wardley__axis wardley__axis--y">Visible to the user ↑</span>
      <div className="wardley__plot">
        <svg
          className="wardley__lines"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {m.stages.slice(1).map((_s, i) => (
            <line
              key={i}
              x1={((i + 1) * 100) / m.stages.length}
              x2={((i + 1) * 100) / m.stages.length}
              y1="0"
              y2="100"
              className="wardley__stage-line"
            />
          ))}
          {m.links.map((l, i) => {
            const a = byId.get(l.from)!;
            const b = byId.get(l.to)!;
            return (
              <line
                key={i}
                x1={a.x * 100}
                y1={(1 - a.y) * 100}
                x2={b.x * 100}
                y2={(1 - b.y) * 100}
                className="wardley__link"
              />
            );
          })}
          {m.nodes
            .filter((n) => n.targetX !== undefined && Math.abs(n.targetX - n.x) > 0.05)
            .map((n, idx) => (
              <line
                key={idx}
                x1={n.x * 100}
                y1={(1 - n.y) * 100}
                x2={n.targetX! * 100}
                y2={(1 - n.y) * 100}
                className="wardley__move"
              />
            ))}
        </svg>
        {m.nodes
          .filter((n) => n.targetX !== undefined && Math.abs(n.targetX - n.x) > 0.05)
          .map((n, idx) => (
            <span
              key={idx}
              className="wardley__target"
              style={css({ left: pct(n.targetX!), top: pct(1 - n.y) })}
              title={`${n.ref.title}: target`}
            />
          ))}
        {m.nodes.map((n, idx) => (
          <div
            key={idx}
            className="wardley__node"
            style={css({ left: pct(n.x), top: pct(1 - n.y) })}
          >
            <Sticky ctx={ctx} item={n.ref} className="sticky--mini" />
          </div>
        ))}
      </div>
      <div className="wardley__stages">
        {m.stages.map((s, idx) => (
          <span key={idx}>{s}</span>
        ))}
      </div>
      <span className="wardley__axis wardley__axis--x">Evolution →</span>
    </div>
  );
}

export function PlatformPlays({ ctx, m }: { ctx: Ctx; m: PlatformPlaysModel }) {
  return (
    <div className="cv-grid cv-grid--3">
      {m.plays.map((p, idx) => (
        <Area
          key={idx}
          title={`${p.id.toUpperCase()} · ${p.label}`}
          className={p.applied.length ? "area--active" : "area--quiet"}
        >
          {p.applied.length ? (
            p.applied.map((a, idx) => (
              <div key={idx} className="play">
                <Sticky ctx={ctx} item={a.play} />
                {a.insight && <p className="area__text">{a.insight}</p>}
                {a.affects.length > 0 && (
                  <div className="stickies">
                    {a.affects.map((r, idx) => (
                      <Sticky key={idx} ctx={ctx} item={r} className="sticky--mini" />
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
    <div className="cv-grid cv-grid--4">
      {m.cards.map((c, idx) => (
        <Area
          key={idx}
          title={`${c.id.toUpperCase()} · ${c.label}`}
          className={c.scenarios.length ? "area--active" : "area--quiet"}
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
    <div className="cv-stack">
      <div className="cv-grid cv-grid--brief">
        <Area title="Layers of the ecosystem">
          <LayerGrid ctx={ctx} rows={m.layers} columns={["entities", "assets", "moats"]} />
        </Area>
        <Area title="The brief" className="area--active">
          {b ? (
            <div className="brief">
              <Sticky ctx={ctx} item={b.ref} variant="strong" />
              {b.arena && (
                <div className="relations__row">
                  <span className="relations__label">focus arena</span>
                  <Sticky ctx={ctx} item={b.arena} className="sticky--mini" />
                </div>
              )}
              <div className="relations__row">
                <span className="relations__label">for</span>
                <span className="chips">
                  {b.entities.map((e, idx) => (
                    <Sticky key={idx} ctx={ctx} item={e} className="sticky--mini" />
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
          <div className="cv-grid cv-grid--3">
            {m.scenarios.map((s, idx) => (
              <div key={idx} className="scenario">
                <Sticky ctx={ctx} item={s.scenario} note={s.pattern} />
                {s.impact && <p className="area__text">{s.impact}</p>}
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
