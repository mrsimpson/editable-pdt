import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, test } from "vite-plus/test";
import {
  CANVASES,
  drawCanvas,
  parseWorkspace,
  progress,
  toPayload,
  validate,
  type BoardModel,
  type EcosystemModel,
  type ExperienceModel,
  type MotivationsModel,
  type WardleyModel,
} from "../src/index.ts";

const ROOT = new URL("../../../examples/harvest-commons/", import.meta.url).pathname;
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : name.endsWith(".pdt42.md") ? [path] : [];
  });
const ws = parseWorkspace(
  files(ROOT).map((p) => ({ file: relative(ROOT, p), content: readFileSync(p, "utf8") })),
);
const diagnostics = validate(ws);
const payload = toPayload(ws, diagnostics, progress(ws, diagnostics));

describe("drawCanvas on Harvest Commons", () => {
  test("every placed canvas draws", () => {
    for (const view of payload.canvases) expect(drawCanvas(payload, view), view.id).toBeDefined();
    for (const canvas of CANVASES) {
      if (canvas.kind === "canvas" || canvas.kind === "catalog" || canvas.kind === "card deck") {
        expect(drawCanvas(payload, { canvas: canvas.id }), canvas.id).toBeDefined();
      }
    }
  });

  test("ecosystem rings run from stakeholders to owners", () => {
    const m = drawCanvas(payload, { canvas: "ecosystem" }) as EcosystemModel;
    expect(m.rings.map((r) => [r.code, r.entities.length])).toEqual([
      ["ES", 2],
      ["PC", 2],
      ["PP", 2],
      ["PA", 1],
      ["PO", 1],
    ]);
  });

  test("the transactions board orients arrows from role 1 to role 2", () => {
    const m = drawCanvas(payload, {
      canvas: "transactions-board",
      of: "r-farmer-restaurant",
    }) as BoardModel;
    expect(m.roles.map((r) => r?.id)).toEqual(["e-farmers", "e-restaurants"]);
    expect(m.rows.map((r) => [r.ref.id, r.arrow, r.happening])).toEqual([
      ["t-share-menus", "↔", false],
      ["t-preorder", "←", false],
      ["t-deliver-restaurant", "→", true],
      ["t-credit-farm", "←", false],
    ]);
    expect(m.rows[1]!.components).toContain("Standard pre-order contract");
  });

  test("experience steps sit in channel lanes, steps without a channel last", () => {
    const m = drawCanvas(payload, {
      canvas: "platform-experience",
      of: "x-chefs-table",
    }) as ExperienceModel;
    expect(m.lanes.map((l) => l.label)).toEqual(["Harvest app", "No channel"]);
    expect(m.steps.map((s) => [s.ref.id, s.brick, s.lane])).toEqual([
      ["s-storefront", "service", 0],
      ["t-share-menus", "transaction", 0],
      ["s-planning-circles", "service", 1],
      ["t-preorder", "transaction", 0],
      ["s-route-planner", "service", 0],
      ["t-deliver-restaurant", "transaction", 0],
      ["t-credit-farm", "transaction", 0],
    ]);
  });

  test("the motivations matrix orders roles by platform role", () => {
    const m = drawCanvas(payload, { canvas: "motivations-matrix" }) as MotivationsModel;
    expect(m.roles[0]!.id).toBe("e-coop");
    expect(
      m.cells.find((c) => c.from === "e-restaurants" && c.to === "e-farmers")!.items,
    ).toHaveLength(2);
  });

  test("the Wardley map links needs and keeps nodes within bounds", () => {
    const m = drawCanvas(payload, { canvas: "wardley-map", of: "ar-selling" }) as WardleyModel;
    expect(m.nodes).toHaveLength(7);
    expect(m.links).toContainEqual({ from: "c-delivery", to: "c-vans" });
    for (const n of m.nodes) expect(n.x > 0 && n.x < 1 && n.y >= 0 && n.y <= 1).toBe(true);
  });
});
