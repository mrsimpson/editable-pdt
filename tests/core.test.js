import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, cp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseDocument } from "../src/core/parser.js";
import { parseWorkspace } from "../src/core/model.js";
import { validate } from "../src/core/validator.js";
import { updateElement, appendElement, removeElement } from "../src/core/writer.js";
import { renderCanvas } from "../src/render/canvases.js";
import { toJSON } from "../src/core/model.js";
import { CANVASES } from "../src/core/schema.js";
import { loadWorkspace, createElement, editElement, deleteElement } from "../src/workspace.js";

const EXAMPLE = new URL("../examples/local-food-network/", import.meta.url).pathname;

const doc = `# Ecosystem

## Farmers

They grow things.

\`\`\`pdt
:::entity
id: e-farmers
title: Farmers
role: peer-producer
pressures:
  - Weather
  - Prices, costs
:::
\`\`\`

## Eaters

\`\`\`pdt
:::entity
id: e-eaters
title: Eaters
role: peer-consumer
:::

:::transaction
id: t-buy
title: Buy
from: e-eaters
to: e-farmers
flow: money
:::
\`\`\`
`;

test("parses blocks, list attributes and the prose above them", () => {
  const ws = parseWorkspace([{ file: "02.pdt.md", content: doc }]);
  const farmers = ws.byId.get("e-farmers");
  assert.deepEqual(farmers.attributes.pressures, ["Weather", "Prices, costs"]);
  assert.equal(farmers.prose, "They grow things.");
  assert.equal(ws.byId.get("t-buy").attributes.from, "e-eaters");
});

test("flags unresolved references, bad enums and unknown types", () => {
  const broken = doc.replace("from: e-eaters", "from: e-nobody").replace("flow: money", "flow: vibes").replace(":::entity\nid: e-eaters", ":::entitty\nid: e-eaters");
  const codes = validate(parseWorkspace([{ file: "x.pdt.md", content: broken }])).map((d) => d.code);
  assert.ok(codes.includes("E002"));
  assert.ok(codes.includes("E004"));
  assert.ok(codes.includes("E005"));
});

test("ignore directives suppress a rule for the file", () => {
  const ignored = doc.replace("```pdt\n:::entity\nid: e-farmers", "```pdt\n:::ignore H001 portrait comes later :::\n\n:::entity\nid: e-farmers");
  const codes = validate(parseWorkspace([{ file: "x.pdt.md", content: ignored }])).map((d) => d.code);
  assert.ok(!codes.includes("H001"));
});

test("updating an element rewrites only its block, prose and heading", () => {
  const ws = parseWorkspace([{ file: "x.pdt.md", content: doc }]);
  const next = updateElement(doc, ws.byId.get("e-farmers"), {
    attributes: { ...ws.byId.get("e-farmers").attributes, title: "Growers", pressures: ["Weather"] },
    prose: "They grow food.",
  });
  assert.match(next, /^## Growers$/m);
  assert.match(next, /^They grow food\.$/m);
  assert.ok(!next.includes("Prices, costs"));
  assert.ok(next.includes("## Eaters\n\n```pdt\n:::entity\nid: e-eaters"));
  assert.equal(next.split("\n").length, doc.split("\n").length - 1);
});

test("append and remove round-trip", () => {
  const added = appendElement(doc, "channel", { id: "ch-app", title: "App", medium: "digital" }, "The app.");
  const ws = parseWorkspace([{ file: "x.pdt.md", content: added }]);
  assert.equal(ws.byId.get("ch-app").prose, "The app.");
  assert.equal(removeElement(added, ws.byId.get("ch-app")).trim(), doc.trim());
  const second = parseWorkspace([{ file: "x.pdt.md", content: doc }]).byId.get("t-buy");
  const without = removeElement(doc, second);
  assert.ok(!without.includes("t-buy") && without.includes("e-eaters"));
});

test("the example workspace is free of errors and warnings", async () => {
  const { diagnostics } = await loadWorkspace(EXAMPLE);
  assert.deepEqual(diagnostics.filter((d) => d.severity !== "hint"), []);
});

test("every canvas renders the example", async () => {
  const { workspace } = await loadWorkspace(EXAMPLE);
  for (const canvas of CANVASES) {
    const html = renderCanvas(toJSON(workspace), canvas.id);
    assert.match(html, new RegExp(`data-canvas="${canvas.id}"`));
    assert.ok(html.includes("data-id="), canvas.id);
  }
});

test("renderers escape user text", () => {
  const evil = doc.replace("title: Farmers", 'title: <img src=x onerror="alert(1)">');
  const html = renderCanvas(toJSON(parseWorkspace([{ file: "x.pdt.md", content: evil }])), "ecosystem");
  assert.ok(!html.includes("<img src=x"));
});

test("workspace edits: create, rename with references, delete", async () => {
  const dir = await mkdtemp(join(tmpdir(), "pdt-"));
  await cp(EXAMPLE, dir, { recursive: true });
  const id = await createElement(dir, { type: "channel", attributes: { title: "Farm Shop", medium: "physical" }, prose: "A shop." });
  assert.equal(id, "ch-farm-shop");

  const { workspace } = await loadWorkspace(dir);
  const farmers = workspace.byId.get("e-farmers");
  await editElement(dir, "e-farmers", { attributes: { ...farmers.attributes, id: "e-growers" }, prose: farmers.prose });
  const after = await loadWorkspace(dir);
  assert.equal(after.diagnostics.filter((d) => d.severity === "error").length, 0);
  assert.equal(after.workspace.byId.get("t-subscribe-box").attributes.to, "e-growers");
  assert.ok(after.workspace.byId.get("x-weekly-box").attributes.entities.includes("e-growers"));

  await deleteElement(dir, "ch-farm-shop");
  assert.ok(!(await readFile(join(dir, "04-transactions.pdt.md"), "utf8")).includes("Farm Shop"));
});

test("parser reports unclosed blocks", () => {
  const nodes = parseDocument("x", "```pdt\n:::entity\nid: a\n").nodes;
  assert.ok(nodes.some((n) => n.kind === "error"));
});
