import { describe, expect, test } from "vite-plus/test";
import { parseWorkspace, RULES, validate } from "../src/index.ts";
import { doc, farmers, kitchens, run } from "./helpers.ts";

describe("errors", () => {
  test("E001 duplicate ids", () => {
    expect(run(doc(farmers, farmers)).codes).toContain("E001");
  });

  test("E002 references must resolve to the right type — when set", () => {
    const missing = run(
      doc(farmers, ":::relationship\nid: r\ntitle: R\nbetween: e-farmers, e-nobody\n:::"),
    ).diagnostics;
    expect(missing.find((d) => d.code === "E002")?.message).toBe(
      'between: "e-nobody" does not exist',
    );
    const wrongType = run(doc(farmers, ":::learning-engine\nid: le\nentity: le\n:::")).diagnostics;
    expect(wrongType.find((d) => d.code === "E002")?.message).toContain(
      "is a learning-engine, expected entity",
    );
    // Optional forward references may be left out entirely.
    expect(run(doc(farmers, ":::platform\nid: p\ntitle: P\n:::")).codes).not.toContain("E002");
  });

  test("E003 schema violations point at the attribute line", () => {
    const { diagnostics } = run(doc(":::entity\nid: e\ntitle: E\nrole: customer\n:::"));
    const d = diagnostics.find((x) => x.code === "E003")!;
    expect(d.message).toMatch(/^role:/);
    expect(d.loc.line).toBe(9);
  });

  test("E003 unknown attributes; E004 unknown block types", () => {
    expect(run(doc(":::entity\nid: e\ntitle: E\ncolour: red\n:::")).codes).toContain("E003");
    expect(run(doc(":::persona\nid: p\n:::")).codes).toContain("E004");
  });

  test("E005 at most one platform", () => {
    expect(
      run(doc(":::platform\nid: p1\ntitle: A\n:::", ":::platform\nid: p2\ntitle: B\n:::")).codes,
    ).toContain("E005");
  });
});

describe("method rules", () => {
  test("W003 a transaction stays inside its relationship", () => {
    const other = ":::entity\nid: e-other\ntitle: Other\nrole: partner\n:::";
    const content = doc(
      farmers,
      kitchens,
      other,
      ":::relationship\nid: r\ntitle: R\nbetween: e-farmers, e-kitchens\n:::",
      ":::transaction\nid: t\ntitle: T\nrelationship: r\nfrom: e-other\nto: e-farmers\n:::",
    );
    expect(run(content).codes).toContain("W003");
  });

  test("W006 experience steps may only involve its roles", () => {
    const content = doc(
      farmers,
      kitchens,
      ":::transaction\nid: t\ntitle: T\nfrom: e-kitchens\nto: e-farmers\n:::",
      ":::experience\nid: x\ntitle: X\ncore-entity: e-farmers\nsteps: t\n:::",
    );
    expect(run(content).diagnostics.find((d) => d.code === "W006")?.message).toContain(
      "e-kitchens",
    );
  });

  test("H104 portraits need potential, compressors and gains", () => {
    expect(run(doc(farmers)).diagnostics.find((d) => d.code === "H104")?.message).toBe(
      "Farmers's portrait lacks potential, goals or pressures, gains",
    );
  });

  test("H114 an MVP tests business model, trust and attraction", () => {
    const content = doc(
      ":::mvp\nid: m\ntitle: M\n:::",
      ":::assumption\nid: a\ntitle: A\nmvp: m\nkind: attraction\nriskiest: yes\ntest: x\ncriteria: y\n:::",
    );
    expect(run(content).diagnostics.find((d) => d.code === "H114")?.message).toBe(
      "M tests no business-model, trust assumption",
    );
  });

  test("H010 orphans are reported, roots are not", () => {
    const { diagnostics } = run(doc(farmers, ":::platform\nid: p\ntitle: P\n:::"));
    expect(diagnostics.filter((d) => d.code === "H010").map((d) => d.element)).toEqual([
      "e-farmers",
    ]);
  });

  test("ignore directives suppress a rule for their file", () => {
    const content = doc(`:::ignore H104 portrait comes later :::\n\n${farmers}`);
    expect(run(content).codes).not.toContain("H104");
  });

  test("every rule is self-describing and step-tagged rules name a known step", () => {
    const codes = RULES.map((r) => r.meta.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const r of RULES) {
      expect(r.meta.rationale.length, r.meta.code).toBeGreaterThan(20);
      if (r.meta.step) expect(r.meta.step).toMatch(/^[EDG]\d$/);
    }
  });
});

describe("canvases", () => {
  const board = (of?: string) =>
    `:::canvas\nid: cv-board\ncanvas: transactions-board\n${of ? `of: ${of}\n` : ""}:::`;
  const relationship = ":::relationship\nid: r\ntitle: R\nbetween: e-farmers, e-kitchens\n:::";
  const transaction =
    ":::transaction\nid: t\ntitle: T\nrelationship: r\nfrom: e-kitchens\nto: e-farmers\n:::";

  test("are views, not elements", () => {
    const { ws } = run(doc(farmers, kitchens, relationship, transaction, board("r")));
    expect(ws.canvases.map((c) => c.id)).toEqual(["cv-board"]);
    expect(ws.byId.has("cv-board")).toBe(false);
  });

  test("E006 unknown canvas, missing or wrong `of`, `of` on a workspace canvas", () => {
    const messages = (content: string) =>
      run(content)
        .diagnostics.filter((d) => d.code === "E006")
        .map((d) => d.message);
    expect(messages(doc(":::canvas\nid: c\ncanvas: poster\n:::"))[0]).toMatch(/^:::canvas canvas:/);
    expect(messages(doc(board()))[0]).toContain("add `of: <relationship id>`");
    expect(messages(doc(farmers, board("e-farmers")))[0]).toBe(
      'of: "e-farmers" is a entity, expected relationship',
    );
    expect(messages(doc(":::canvas\nid: c\ncanvas: ecosystem\nof: x\n:::"))[0]).toContain(
      "remove `of`",
    );
  });

  test("W011 a started step's chapter shows its canvas, per element where the canvas says so", () => {
    const missing = run(doc(farmers, kitchens, relationship, transaction)).diagnostics.filter(
      (d) => d.code === "W011",
    );
    expect(missing.map((d) => [d.step, d.message])).toEqual([
      [
        "D1",
        "model.pdt42.md (D1 Map the ecosystem) shows no Ecosystem Canvas — add a `:::canvas` block with `canvas: ecosystem`",
      ],
      [
        "D5",
        "No Transactions Board for R in model.pdt42.md — add a `:::canvas` block with `canvas: transactions-board` and `of: r`",
      ],
    ]);
    const placed = run(
      doc(
        farmers,
        kitchens,
        relationship,
        transaction,
        board("r"),
        ":::canvas\nid: cv-eco\ncanvas: ecosystem\n:::",
      ),
    ).codes;
    expect(placed).not.toContain("W011");
  });

  test("W011 wants the canvas in the step's own chapter file", () => {
    const ws = parseWorkspace([
      { file: "d1.pdt42.md", content: doc(farmers) },
      { file: "elsewhere.pdt42.md", content: doc(":::canvas\nid: cv-eco\ncanvas: ecosystem\n:::") },
    ]);
    expect(validate(ws).some((d) => d.code === "W011" && d.step === "D1")).toBe(true);
  });
});
