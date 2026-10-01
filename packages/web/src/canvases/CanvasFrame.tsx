import { CANVASES, STEPS, titleOf } from "@pdt42/core";
import { css, cx } from "../react-util.ts";
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
      className={cx("canvas", `canvas--${drawn.view.canvas}`)}
      id={drawn.view.id}
      style={css({ "--c": `var(--c-${info?.phase ?? "design"})` })}
      data-canvas={drawn.view.canvas}
    >
      <figcaption className="canvas__caption">
        <span className="canvas__kicker">
          {step ? `${step.id} · ` : ""}
          {info?.kind ?? "canvas"}
        </span>
        <span className="canvas__title">
          {info?.title ?? drawn.view.canvas}
          {of && <span className="canvas__of"> · {titleOf(of)}</span>}
        </span>
        {info && (
          <a className="canvas__source" href={info.source} target="_blank" rel="noopener">
            PDT source ↗
          </a>
        )}
      </figcaption>
      <div className="canvas__body">
        {drawn.model ? (
          renderCanvas(ctx, drawn.model)
        ) : (
          <span className="area__empty">Unknown canvas.</span>
        )}
      </div>
    </figure>
  );
}
