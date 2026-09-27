import { CANVASES, STEPS } from "@pdt42/core";
import { h } from "../dom.ts";
import type { Ctx } from "../context.ts";
import type { DrawnCanvas } from "../workspace.ts";
import { renderCanvas } from "./index.tsx";

// The frame around a canvas: its PDT name, what it is drawn for, and where it comes from.

export function CanvasFrame({ ctx, drawn }: { ctx: Ctx; drawn: DrawnCanvas }) {
  const info = CANVASES.find((c) => c.id === drawn.view.canvas);
  const of = drawn.view.of ? ctx.ix.byId.get(drawn.view.of) : undefined;
  const step =
    STEPS.find((s) => s.canvas === drawn.view.canvas) ??
    STEPS.find((s) => info?.steps.includes(s.id));
  return (
    <figure
      class={["canvas", `canvas--${drawn.view.canvas}`]}
      id={drawn.view.id}
      style={{ "--c": `var(--c-${info?.phase ?? "design"})` }}
      data-canvas={drawn.view.canvas}
    >
      <figcaption class="canvas__caption">
        <span class="canvas__kicker">
          {step ? `${step.id} · ` : ""}
          {info?.kind ?? "canvas"}
        </span>
        <span class="canvas__title">
          {info?.title ?? drawn.view.canvas}
          {of && <span class="canvas__of"> · {of.title}</span>}
        </span>
        {info && (
          <a class="canvas__source" href={info.source} target="_blank" rel="noopener">
            PDT source ↗
          </a>
        )}
      </figcaption>
      <div class="canvas__body">
        {drawn.model ? (
          renderCanvas(ctx, drawn.model)
        ) : (
          <span class="area__empty">Unknown canvas.</span>
        )}
      </div>
    </figure>
  );
}
