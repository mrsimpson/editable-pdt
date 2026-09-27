import type {
  FlywheelModel,
  GrowthModel,
  LiquidityModel,
  NetworkModel,
  StrategyModel,
  ValuePropositionItem,
} from "@pdt42/core";
import { h } from "../dom.ts";
import type { Ctx } from "../context.ts";
import { Area, Empty, Notes, Sticky, Text } from "./parts.tsx";

function Proposition({ ctx, vp }: { ctx: Ctx; vp: ValuePropositionItem }) {
  return (
    <div class="vp">
      <Sticky ctx={ctx} item={vp.ref} />
      <div class="relations__row">
        {vp.customer && <Sticky ctx={ctx} item={vp.customer} class="sticky--mini" />}
        {vp.relationship && <Sticky ctx={ctx} item={vp.relationship} class="sticky--mini" />}
      </div>
      {vp.mechanism && <p class="area__text">{vp.mechanism}</p>}
      <Notes items={vp.bundle} empty="" />
    </div>
  );
}

export function Strategy({ ctx, m }: { ctx: Ctx; m: StrategyModel }) {
  const column = (title: string, hint: string, items: ValuePropositionItem[]) => (
    <Area title={title} hint={hint} class={items.length ? "area--active" : "area--quiet"}>
      {items.length ? items.map((vp) => <Proposition ctx={ctx} vp={vp} />) : <Empty />}
    </Area>
  );
  return (
    <div class="cv-grid cv-grid--3 strategy">
      {column("Products", "Help one entity get better on its own", m.product)}
      {column("Marketplaces", "Connect entities so they transact", m.marketplaces)}
      {column("Extension platforms", "Let others build on the platform", m.extension)}
    </div>
  );
}

export function Network({ ctx, m }: { ctx: Ctx; m: NetworkModel }) {
  return (
    <div class="cv-stack">
      <div class="board__head">
        {m.relationship && <Sticky ctx={ctx} item={m.relationship} />}
        {m.network && <Sticky ctx={ctx} item={m.network} class="sticky--mini" />}
      </div>
      <table class="cv-table network">
        <tbody>
          {m.properties.map((p) => (
            <tr>
              <th>{p.label}</th>
              <td>
                <span class="scale">
                  {p.options.map((o) => (
                    <span class={["scale__option", o === p.value && "scale__option--on"]}>{o}</span>
                  ))}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div class="cv-grid cv-grid--2">
        <Area title="Network effect curve">
          <Text value={m.curve} />
        </Area>
        <Area title="Tactics" class="area--active">
          {m.tactics.length ? (
            <span class="chips">
              {m.tactics.map((t) => (
                <span class="pill" title={t.id}>
                  {t.label}
                </span>
              ))}
            </span>
          ) : (
            <Empty />
          )}
        </Area>
      </div>
    </div>
  );
}

function Loop({ steps: written }: { steps: string[] }) {
  // A loop written back to its start (a → b → c → a) is drawn once round.
  const steps =
    written.length > 2 && written.at(-1) === written[0] ? written.slice(0, -1) : written;
  if (!steps.length) return <Empty />;
  const n = steps.length;
  return (
    <div class="loop">
      <svg class="loop__circle" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="36" />
      </svg>
      <span class="loop__spin">↻</span>
      {steps.map((s, i) => {
        const rad = ((-90 + (360 * i) / n) * Math.PI) / 180;
        return (
          <span
            class="loop__step"
            style={{ left: `${50 + 36 * Math.cos(rad)}%`, top: `${50 + 36 * Math.sin(rad)}%` }}
          >
            {s}
          </span>
        );
      })}
    </div>
  );
}

export function Flywheels({ ctx, m }: { ctx: Ctx; m: FlywheelModel }) {
  if (!m.flywheels.length) return <Empty text="No flywheels yet" />;
  return (
    <div class="cv-grid cv-grid--2">
      {m.flywheels.map((f) => (
        <Area title={f.typeLabel || "Flywheel"} class={f.core ? "area--active" : undefined}>
          <Sticky
            ctx={ctx}
            item={f.ref}
            variant={f.core ? "strong" : undefined}
            note={f.core ? "network effect" : undefined}
          />
          <Loop steps={f.loop} />
          <dl class="facts">
            {f.metric && [<dt>metric</dt>, <dd>{f.metric}</dd>]}
            {f.bottleneck && [<dt>bottleneck</dt>, <dd>{f.bottleneck}</dd>]}
          </dl>
          <div class="relations__row">
            {f.relationship && <Sticky ctx={ctx} item={f.relationship} class="sticky--mini" />}
            {f.reinforces && [
              <span class="relations__label">reinforces</span>,
              <Sticky ctx={ctx} item={f.reinforces} class="sticky--mini" />,
            ]}
          </div>
        </Area>
      ))}
    </div>
  );
}

export function Liquidity({ ctx, m }: { ctx: Ctx; m: LiquidityModel }) {
  return (
    <div class="cv-stack">
      <div class="board__head">
        {m.relationship && <Sticky ctx={ctx} item={m.relationship} />}
        {m.plan && <Sticky ctx={ctx} item={m.plan} class="sticky--mini" />}
      </div>
      <div class="cv-grid cv-grid--3">
        <Area title="Alternatives today" hint="What the peers use when the platform is not there">
          <Notes items={m.alternatives} />
        </Area>
        <Area title="Canonical unit" class="area--active">
          <Text value={m.canonicalUnit} />
        </Area>
        <Area title="Constraints">
          <Notes items={m.constraints} />
        </Area>
        <Area title="Supply threshold">
          <Text value={m.supplyThreshold} />
        </Area>
        <Area title="Demand threshold">
          <Text value={m.demandThreshold} />
        </Area>
        <Area title="Start with" class="area--active">
          <Text value={m.startWith} />
        </Area>
      </div>
    </div>
  );
}

export function Growth({ ctx, m }: { ctx: Ctx; m: GrowthModel }) {
  if (!m.loops.length) return <Empty text="No growth loops yet" />;
  return (
    <div class="cv-grid cv-grid--2">
      {m.loops.map((g) => (
        <Area title={g.type ? `${g.type} loop` : "Growth loop"}>
          <Sticky ctx={ctx} item={g.ref} />
          {g.equation && <code class="equation">{g.equation}</code>}
          <dl class="facts">
            {g.cycleTime && [<dt>cycle time</dt>, <dd>{g.cycleTime}</dd>]}
            {g.metric && [<dt>metric</dt>, <dd>{g.metric}</dd>]}
            {g.bottleneck && [<dt>bottleneck</dt>, <dd>{g.bottleneck}</dd>]}
          </dl>
          {(g.acquires || g.feeds) && (
            <div class="relations__row">
              {g.acquires && [
                <span class="relations__label">acquires</span>,
                <Sticky ctx={ctx} item={g.acquires} class="sticky--mini" />,
              ]}
              {g.feeds && [
                <span class="relations__label">feeds</span>,
                <Sticky ctx={ctx} item={g.feeds} class="sticky--mini" />,
              ]}
            </div>
          )}
        </Area>
      ))}
    </div>
  );
}
