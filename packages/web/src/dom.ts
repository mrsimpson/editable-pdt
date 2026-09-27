// A tiny JSX factory: components are plain functions that return DOM nodes. The app re-renders
// by rebuilding the view from its state, which is fast enough for documents of this size and
// keeps the web app free of a UI framework.

export type Child = Node | string | number | boolean | null | undefined | Child[];

type Props = Record<string, unknown> & { children?: Child };
type Component = (props: Props) => Node;

const SVG_NS = "http://www.w3.org/2000/svg";
const SVG_TAGS = new Set([
  "svg",
  "g",
  "line",
  "path",
  "circle",
  "ellipse",
  "rect",
  "text",
  "defs",
  "marker",
  "polyline",
  "polygon",
]);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    type Element = Node;
    interface IntrinsicElements {
      [tag: string]: Record<string, unknown>;
    }
    interface ElementChildrenAttribute {
      children: unknown;
    }
  }
}

export function classes(...values: unknown[]): string {
  return values
    .flat()
    .filter((v) => typeof v === "string" && v)
    .join(" ");
}

function append(parent: Node, child: Child): void {
  if (child == null || child === false || child === true) return;
  if (Array.isArray(child)) {
    for (const c of child) append(parent, c);
    return;
  }
  parent.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
}

export function h(
  type: string | Component,
  props: Record<string, unknown> | null,
  ...children: Child[]
): Node {
  if (typeof type === "function") {
    return type({ ...props, children: children.length === 1 ? children[0] : children });
  }
  const el = SVG_TAGS.has(type)
    ? document.createElementNS(SVG_NS, type)
    : document.createElement(type);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value == null || value === false || key === "key") continue;
    if (key === "ref") (value as (el: Element) => void)(el);
    else if (key.startsWith("on") && typeof value === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
    } else if (key === "class" || key === "className") el.setAttribute("class", classes(value));
    else if (key === "style" && typeof value === "object") {
      for (const [prop, v] of Object.entries(value as Record<string, unknown>)) {
        if (v != null) (el as HTMLElement).style.setProperty(prop, String(v as string | number));
      }
    } else if (key === "html") el.innerHTML = String(value as string);
    else el.setAttribute(key, value === true ? "" : String(value as string | number));
  }
  append(el, children);
  return el;
}

export function Fragment(props: { children?: Child }): Node {
  const fragment = document.createDocumentFragment();
  append(fragment, props.children ?? null);
  return fragment;
}

/** Replace the content of a container with freshly rendered nodes. */
export function mount(container: Element, node: Node): void {
  container.replaceChildren(node);
}
