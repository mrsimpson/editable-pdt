import type { ReactNode } from "react";
import type { Ref } from "@pdt42/core";
import { css, cx } from "../react-util.ts";
import type { Ctx } from "../context.ts";
import { colorOf } from "../workspace.ts";

// Building blocks of every canvas: areas, and stickies that link to their element's section.

export function Sticky({
  ctx,
  item,
  label,
  note,
  variant,
  className: extra,
}: {
  ctx: Ctx;
  item: Ref;
  /** Text to show instead of the element's title (the title stays in the tooltip). */
  label?: string;
  note?: string;
  variant?: "dashed" | "strong";
  className?: string;
}) {
  const e = ctx.ix.byId.get(item.id);
  return (
    <a
      className={cx("sticky", variant && `sticky--${variant}`, extra)}
      href={e ? ctx.ix.elementHref(e.id) : undefined}
      style={css({ "--c": colorOf(item.kind, item.role) })}
      title={label ? `${item.title} (${item.kind} ${item.id})` : `${item.kind} ${item.id}`}
      data-ref={item.id}
    >
      <span className="sticky__title">{label ?? item.title}</span>
      {note && <span className="sticky__note">{note}</span>}
    </a>
  );
}

export function Stickies({ ctx, items, empty }: { ctx: Ctx; items: Ref[]; empty?: string }) {
  if (!items.length) return <Empty text={empty} />;
  return (
    <div className="stickies">
      {items.map((item, idx) => (
        <Sticky key={idx} ctx={ctx} item={item} />
      ))}
    </div>
  );
}

export function Area({
  title,
  hint,
  className: extra,
  style,
  children,
}: {
  title: string;
  hint?: string;
  className?: string;
  style?: Record<string, string>;
  children?: ReactNode;
}) {
  return (
    <section className={cx("area", extra)} style={css(style)}>
      <h4 className="area__title" title={hint}>
        {title}
      </h4>
      <div className="area__body">{children}</div>
    </section>
  );
}

export function Notes({ items, empty }: { items: string[]; empty?: string }) {
  if (!items.length) return <Empty text={empty} />;
  return (
    <ul className="notes">
      {items.map((i, idx) => (
        <li key={idx}>{i}</li>
      ))}
    </ul>
  );
}

export function Empty({ text }: { text?: string }) {
  return <span className="area__empty">{text ?? "—"}</span>;
}

export function Text({ value }: { value?: string }) {
  return value ? <p className="area__text">{value}</p> : <Empty />;
}
