import type {
  BoardModel,
  EcosystemModel,
  ExperienceModel,
  LearningModel,
  MotivationsModel,
  MvpModel,
  PlatformDesignModel,
  PortraitModel,
  Ref,
} from "@pdt42/core";
import { h } from "../dom.ts";
import type { Ctx } from "../context.ts";
import { ROLE_COLORS } from "../workspace.ts";
import { Area, Empty, Notes, Sticky, Stickies, Text } from "./parts.tsx";

// ─── Ecosystem canvas: the roles as rings around the platform owner ──────────

const RINGS: Record<string, { size: number; radius: number; from: number; to: number }> = {
  stakeholder: { size: 100, radius: 43, from: -90, to: 270 },
  "peer-consumer": { size: 74, radius: 30.5, from: -55, to: 55 },
  "peer-producer": { size: 74, radius: 30.5, from: 125, to: 235 },
  partner: { size: 48, radius: 18, from: 90, to: 450 },
  owner: { size: 22, radius: 0, from: 0, to: 0 },
};

export function Ecosystem({ ctx, m }: { ctx: Ctx; m: EcosystemModel }) {
  const placed = m.rings.flatMap((ring) => {
    const geo = RINGS[ring.role]!;
    const n = ring.entities.length;
    const full = geo.to - geo.from >= 300;
    return ring.entities.map((e, i) => {
      if (geo.radius === 0) return { e, left: 50, top: 50 + (i - (n - 1) / 2) * 7 };
      const t = full ? i / n : n === 1 ? 0.5 : i / (n - 1);
      // Screen angles: 0° points right, 90° down.
      const deg = geo.from + (geo.to - geo.from) * t;
      const rad = (deg * Math.PI) / 180;
      return { e, left: 50 + geo.radius * Math.cos(rad), top: 50 + geo.radius * Math.sin(rad) };
    });
  });
  const circles = ["stakeholder", "peer-consumer", "partner", "owner"];
  return (
    <div class="eco-wrap">
      <div class="eco">
        {circles.map((role) => {
          const geo = RINGS[role]!;
          return (
            <div
              class={["eco__ring", `eco__ring--${role}`]}
              style={{ width: `${geo.size}%`, height: `${geo.size}%` }}
            />
          );
        })}
        {placed.map(({ e, left, top }) => (
          <div class="eco__item" style={{ left: `${left}%`, top: `${top}%` }}>
            <Sticky ctx={ctx} item={e} />
          </div>
        ))}
      </div>
      <ul class="legend">
        {m.rings.map((r) => (
          <li style={{ "--c": ROLE_COLORS[r.role]! }}>
            <span class="legend__dot" />
            {r.code} · {r.label}
          </li>
        ))}
      </ul>
      {m.unassigned.length > 0 && (
        <Area title="Without a role yet">
          <Stickies ctx={ctx} items={m.unassigned} />
        </Area>
      )}
    </div>
  );
}

export function Portrait({ ctx, m }: { ctx: Ctx; m: PortraitModel }) {
  return (
    <div class="cv-stack">
      <div class="portrait__head">
        {m.entity ? <Sticky ctx={ctx} item={m.entity} variant="strong" note={m.type} /> : <Empty />}
        {m.clusters.length > 0 && (
          <span class="chips">
            {m.clusters.map((c) => (
              <span class="pill">{c}</span>
            ))}
          </span>
        )}
      </div>
      <div class="cv-grid cv-grid--3">
        <Area title="Context">
          <Notes items={m.context} />
        </Area>
        <Area title="Assets & capabilities">
          <Notes items={[...m.assets, ...m.capabilities]} />
        </Area>
        <Area title="Goals">
          <Notes items={m.goals} />
        </Area>
        <Area title="Pressures">
          <Notes items={m.pressures} />
        </Area>
        <Area title="Potential" hint="What the entity could bring to the ecosystem">
          <Notes items={m.potential} />
        </Area>
        <Area title="Gains expected" class="area--active">
          <h5>Convenience</h5>
          <Notes items={m.convenience} />
          <h5>Reach</h5>
          <Notes items={m.reach} />
          <h5>Value</h5>
          <Notes items={m.value} />
        </Area>
      </div>
    </div>
  );
}

export function Motivations({ ctx, m }: { ctx: Ctx; m: MotivationsModel }) {
  if (!m.roles.length) return <Empty text="No motivations yet" />;
  const cell = (from: string, to: string) =>
    m.cells.find((c) => c.from === from && c.to === to)?.items ?? [];
  return (
    <div class="matrix-wrap">
      <table class="cv-table matrix">
        <thead>
          <tr>
            <th class="matrix__corner">gives ↓ to →</th>
            {m.roles.map((r) => (
              <th>
                <Sticky ctx={ctx} item={r} class="sticky--mini" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {m.roles.map((from) => (
            <tr>
              <th>
                <Sticky ctx={ctx} item={from} class="sticky--mini" />
              </th>
              {m.roles.map((to) => (
                <td class={from.id === to.id ? "matrix__self" : undefined}>
                  {cell(from.id, to.id).map((item) => (
                    <Sticky
                      ctx={ctx}
                      item={item.ref}
                      label={item.gives || item.ref.title}
                      note={item.kind}
                      variant={item.status === "potential" ? "dashed" : undefined}
                      class="sticky--note"
                    />
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Board({ ctx, m }: { ctx: Ctx; m: BoardModel }) {
  const [a, b] = m.roles;
  const name = (r: Ref | undefined) => r?.title ?? "?";
  // Each channel once, with the components that make its transactions easier.
  const channels = m.rows.filter(
    (row, i) => row.channel && m.rows.findIndex((r) => r.channel?.id === row.channel!.id) === i,
  );
  return (
    <div class="cv-stack">
      <div class="board__head">
        {a ? <Sticky ctx={ctx} item={a} /> : <Empty />}
        {m.relationship && <Sticky ctx={ctx} item={m.relationship} class="sticky--mini" />}
        {b ? <Sticky ctx={ctx} item={b} /> : <Empty />}
      </div>
      {m.rows.length ? (
        <table class="cv-table board">
          <thead>
            <tr>
              <th>Transaction</th>
              <th class="board__dir">
                {name(a)} · {name(b)}
              </th>
              <th>Value unit</th>
              <th>Channel</th>
            </tr>
          </thead>
          <tbody>
            {m.rows.map((row) => (
              <tr class={row.happening ? undefined : "board__row--potential"}>
                <td>
                  <Sticky
                    ctx={ctx}
                    item={row.ref}
                    variant={row.happening ? undefined : "dashed"}
                    note={row.happening ? undefined : "not happening yet"}
                  />
                </td>
                <td class="board__arrow" title={row.kind}>
                  {row.arrow}
                </td>
                <td>{row.valueUnit ?? ""}</td>
                <td>
                  {row.channel && <Sticky ctx={ctx} item={row.channel} class="sticky--mini" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <Empty text="No transactions on this relationship yet" />
      )}
      {channels.length > 0 && (
        <div class="cv-grid cv-grid--2">
          {channels.map((row) => (
            <Area title={`${row.channel!.title} makes it easier`}>
              <Notes items={row.components} empty="" />
              {row.improvement && <p class="area__text">{row.improvement}</p>}
            </Area>
          ))}
        </div>
      )}
    </div>
  );
}

export function Learning({ ctx, m }: { ctx: Ctx; m: LearningModel }) {
  if (!m.rows.length) return <Empty text="No learning engines yet" />;
  return (
    <div class="matrix-wrap">
      <table class="cv-table learning">
        <thead>
          <tr>
            <th>Entity</th>
            <th>Entry</th>
            {m.stages.map((s) => (
              <th>{s.label}</th>
            ))}
            <th>Evolves to</th>
          </tr>
        </thead>
        <tbody>
          {m.rows.map((row) => (
            <tr>
              <th>
                {row.entity ? (
                  <Sticky ctx={ctx} item={row.entity} />
                ) : (
                  <Sticky ctx={ctx} item={row.engine} />
                )}
              </th>
              <td>
                <Notes items={row.entry} empty="" />
              </td>
              {row.stages.map((s) => (
                <td>
                  <Notes items={s.challenges} empty="" />
                  <div class="stickies">
                    {s.services.map((sv) => (
                      <Sticky ctx={ctx} item={sv} class="sticky--mini" />
                    ))}
                  </div>
                </td>
              ))}
              <td>
                <Stickies ctx={ctx} items={row.evolvesTo} empty="" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Experience({ ctx, m }: { ctx: Ctx; m: ExperienceModel }) {
  return (
    <div class="cv-stack">
      <div class="cv-grid cv-grid--xp">
        <Area title="Value proposition" class="area--active">
          <Text value={m.valueProposition} />
        </Area>
        <Area title="Core relationship">
          {m.relationship ? <Sticky ctx={ctx} item={m.relationship} /> : <Empty />}
          {m.core && (
            <div class="relations__row">
              <span class="relations__label">core entity</span>
              <Sticky ctx={ctx} item={m.core} class="sticky--mini" />
            </div>
          )}
        </Area>
        <Area title="Roles involved">
          <Stickies ctx={ctx} items={m.roles} />
        </Area>
      </div>
      {m.steps.length ? (
        <div class="lanes" style={{ "--steps": String(m.steps.length) }}>
          {m.lanes.map((lane, i) => (
            <div class="lanes__label" style={{ "grid-row": String(i + 1) }}>
              {lane.channel ? (
                <Sticky ctx={ctx} item={lane.channel} class="sticky--mini" />
              ) : (
                lane.label
              )}
            </div>
          ))}
          {m.lanes.map((_lane, i) => (
            <div class="lanes__lane" style={{ "grid-row": String(i + 1) }} />
          ))}
          {m.steps.map((s, i) => (
            <div
              class="lanes__step"
              style={{ "grid-row": String(Math.max(s.lane, 0) + 1), "grid-column": String(i + 2) }}
            >
              <span class="lanes__n">{i + 1}</span>
              <Sticky
                ctx={ctx}
                item={s.ref}
                note={
                  s.brick === "transaction"
                    ? s.from && s.to
                      ? `${s.from.title} → ${s.to.title}`
                      : undefined
                    : s.for.length
                      ? `for ${s.for.map((f) => f.title).join(", ")}`
                      : undefined
                }
              />
            </div>
          ))}
        </div>
      ) : (
        <Empty text="No steps yet" />
      )}
      <div class="cv-grid cv-grid--4">
        <Area title="Key activities">
          <Notes items={m.activities} />
        </Area>
        <Area title="Key resources">
          <Notes items={m.resources} />
        </Area>
        <Area title="Costs">
          <Notes items={m.costs} />
        </Area>
        <Area title="Revenues">
          <Notes items={m.revenues} />
        </Area>
      </div>
    </div>
  );
}

export function Mvp({ ctx, m }: { ctx: Ctx; m: MvpModel }) {
  return (
    <div class="cv-stack">
      <div class="cv-grid cv-grid--3">
        <Area title="MVP" class="area--active">
          {m.mvp ? <Sticky ctx={ctx} item={m.mvp} variant="strong" note={m.status} /> : <Empty />}
          <Text value={m.implementation} />
        </Area>
        <Area title="Experiences it tests">
          <Stickies ctx={ctx} items={m.experiences} />
        </Area>
        <Area title="Built on">
          <Notes items={m.base} />
        </Area>
      </div>
      {m.assumptions.length ? (
        <table class="cv-table">
          <thead>
            <tr>
              <th>Assumption</th>
              <th>Kind</th>
              <th>Test</th>
              <th>Success when</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {m.assumptions.map((a) => (
              <tr>
                <td>
                  <Sticky
                    ctx={ctx}
                    item={a.ref}
                    variant={a.riskiest ? "strong" : undefined}
                    note={a.riskiest ? "riskiest" : undefined}
                  />
                </td>
                <td>{a.kind ?? ""}</td>
                <td>{a.test ?? ""}</td>
                <td>{a.criteria ?? ""}</td>
                <td>{a.status && <span class={["pill", `pill--${a.status}`]}>{a.status}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <Empty text="No assumptions yet" />
      )}
    </div>
  );
}

export function PlatformDesign({ ctx, m }: { ctx: Ctx; m: PlatformDesignModel }) {
  return (
    <div class="pdc">
      <Area title="Platform owners" class="pdc__owners">
        <Stickies ctx={ctx} items={m.owners} />
      </Area>
      <Area title="Stakeholders" class="pdc__stakeholders">
        <Stickies ctx={ctx} items={m.stakeholders} />
      </Area>
      <Area title="Enabling services" class="pdc__enabling">
        <Stickies ctx={ctx} items={m.enabling} />
      </Area>
      <Area title="Core value" class="pdc__core area--active">
        <Text value={m.coreValue} />
        {m.ancillary.length > 0 && <h5>Ancillary value</h5>}
        <Notes items={m.ancillary} empty="" />
        {m.infrastructure.length > 0 && <h5>Infrastructure</h5>}
        <Notes items={m.infrastructure} empty="" />
      </Area>
      <Area title="Empowering services" class="pdc__empowering">
        <Stickies ctx={ctx} items={[...m.empowering, ...m.other]} />
      </Area>
      <Area title="Transactions" class="pdc__transactions">
        <Stickies ctx={ctx} items={m.transactions} />
      </Area>
      <Area title="Channels" class="pdc__channels">
        <Stickies ctx={ctx} items={m.channels} />
      </Area>
      <Area title="Partners" class="pdc__partners">
        <Stickies ctx={ctx} items={m.partners} />
      </Area>
      <Area title="Peer producers" class="pdc__producers">
        <Stickies ctx={ctx} items={m.producers} />
      </Area>
      <Area title="Peer consumers" class="pdc__consumers">
        <Stickies ctx={ctx} items={m.consumers} />
      </Area>
    </div>
  );
}
