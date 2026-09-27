import type { CSSProperties } from "react";

/** Join the truthy class names. */
export function cx(...values: unknown[]): string {
  return values.filter((v): v is string => typeof v === "string" && v !== "").join(" ");
}

/** Inline styles that may set CSS custom properties (`--c`), which CSSProperties does not type. */
export function css(
  style: Record<string, string | number | undefined> | undefined,
): CSSProperties | undefined {
  return style as CSSProperties | undefined;
}
