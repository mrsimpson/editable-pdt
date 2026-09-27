import type { Ref } from "@pdt42/core";
import { h, type Child } from "../dom.ts";
import type { Ctx } from "../context.ts";
import { colorOf, elementHref } from "../workspace.ts";

// Building blocks of every canvas: areas, and stickies that link to their element's section.

export function Sticky({
  ctx,
  item,
  label,
  note,
  variant,
  class: extra,
}: {
  ctx: Ctx;
  item: Ref;
  /** Text to show instead of the element's title (the title stays in the tooltip). */
  label?: string;
  note?: string;
  variant?: "dashed" | "strong";
  class?: string;
}) {
  const e = ctx.ix.byId.get(item.id);
  return (
    <a
      class={["sticky", variant && `sticky--${variant}`, extra]}
      href={e ? elementHref(e.file, e.id) : undefined}
      style={{ "--c": colorOf(item.kind, item.role) }}
      title={label ? `${item.title} (${item.kind} ${item.id})` : `${item.kind} ${item.id}`}
      data-ref={item.id}
    >
      <span class="sticky__title">{label ?? item.title}</span>
      {note && <span class="sticky__note">{note}</span>}
    </a>
  );
}

export function Stickies({ ctx, items, empty }: { ctx: Ctx; items: Ref[]; empty?: string }) {
  if (!items.length) return <Empty text={empty} />;
  return (
    <div class="stickies">
      {items.map((item) => (
        <Sticky ctx={ctx} item={item} />
      ))}
    </div>
  );
}

export function Area({
  title,
  hint,
  class: extra,
  style,
  children,
}: {
  title: string;
  hint?: string;
  class?: string;
  style?: Record<string, string>;
  children?: Child;
}) {
  return (
    <section class={["area", extra]} style={style}>
      <h4 class="area__title" title={hint}>
        {title}
      </h4>
      <div class="area__body">{children}</div>
    </section>
  );
}

export function Notes({ items, empty }: { items: string[]; empty?: string }) {
  if (!items.length) return <Empty text={empty} />;
  return (
    <ul class="notes">
      {items.map((i) => (
        <li>{i}</li>
      ))}
    </ul>
  );
}

export function Empty({ text }: { text?: string }) {
  return <span class="area__empty">{text ?? "—"}</span>;
}

export function Text({ value }: { value?: string }) {
  return value ? <p class="area__text">{value}</p> : <Empty />;
}
