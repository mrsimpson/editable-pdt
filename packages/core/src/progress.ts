import { STEPS, type StepInfo } from "./methodology.ts";
import { elementsOf, type Workspace } from "./model.ts";
import type { Diagnostic } from "./validator.ts";

// Where a workspace stands in the methodology: per step, whether its blocks exist and whether
// the rules tied to the step are satisfied. `nextStep` recommends where to continue.

export type StepState = "todo" | "open" | "done";

export interface StepStatus {
  step: StepInfo;
  state: StepState;
  /** Elements the step created or enriched. */
  count: number;
  findings: Diagnostic[];
}

const hasValues = (value: unknown) =>
  Array.isArray(value) ? value.length > 0 : value !== undefined && value !== "";

function countFor(ws: Workspace, step: StepInfo): number {
  const created = step.blocks.reduce((n, kind) => n + elementsOf(ws, kind).length, 0);
  const enriched = (step.enriches ?? []).reduce(
    (n, { type, fields }) =>
      n +
      elementsOf(ws, type).filter((e) =>
        fields.some((f) => hasValues((e.data as Record<string, unknown>)[f])),
      ).length,
    0,
  );
  return step.blocks.length ? created : enriched;
}

export function progress(ws: Workspace, diagnostics: Diagnostic[]): StepStatus[] {
  return STEPS.map((step) => {
    const findings = diagnostics.filter((d) => d.step === step.id);
    const count = countFor(ws, step);
    const state: StepState = count === 0 ? "todo" : findings.length ? "open" : "done";
    return { step, state, count, findings };
  });
}

export interface NextStep {
  status: StepStatus;
  reason: string;
}

/**
 * The step to work on next: the earliest open step of the phase you are in, otherwise the first
 * step not started yet after the furthest step you reached. Exploration is optional — a design
 * may start at D1 when the ecosystem is already known.
 */
export function nextStep(statuses: StepStatus[]): NextStep | undefined {
  const lastStarted = statuses.reduce((i, s, index) => (s.state !== "todo" ? index : i), -1);
  if (lastStarted === -1) {
    const d1 = statuses.find((s) => s.step.id === "D1")!;
    return {
      status: d1,
      reason:
        "Nothing is modelled yet. Start with D1 — or with E1 if you still need to find the opportunity.",
    };
  }
  const phase = statuses[lastStarted]!.step.phase;
  const open = statuses.find((s) => s.step.phase === phase && s.state === "open");
  if (open)
    return {
      status: open,
      reason: `${open.findings.length} open finding(s) in a step you already started.`,
    };
  const todo = statuses.slice(lastStarted + 1).find((s) => s.state === "todo");
  if (todo)
    return {
      status: todo,
      reason: `Everything up to ${statuses[lastStarted]!.step.id} is in place.`,
    };
  const anyOpen = statuses.find((s) => s.state === "open");
  return anyOpen
    ? { status: anyOpen, reason: `${anyOpen.findings.length} open finding(s) remain.` }
    : undefined;
}
