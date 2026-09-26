import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { BLOCK_TYPES } from "./core/schema.js";
import { parseWorkspace, targetFileFor } from "./core/model.js";
import { validate } from "./core/validator.js";
import { appendElement, removeElement, suggestId, updateElement } from "./core/writer.js";

// File-system access for a PDT workspace: every *.pdt.md file below `dir`.

const SKIP = new Set(["node_modules", ".git", "dist"]);

async function discover(dir, base = dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name) || entry.name.startsWith(".")) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await discover(path, base)));
    else if (entry.name.endsWith(".pdt.md")) out.push(relative(base, path).split(sep).join("/"));
  }
  return out.sort();
}

export async function loadWorkspace(dir) {
  const files = await discover(dir);
  const loaded = await Promise.all(files.map(async (file) => ({ file, content: await readFile(join(dir, file), "utf8") })));
  const workspace = parseWorkspace(loaded);
  return { workspace, diagnostics: validate(workspace) };
}

function safePath(dir, file) {
  const path = resolve(dir, file);
  if (!path.startsWith(resolve(dir) + sep)) throw new EditError(400, `Refusing to write outside the workspace: ${file}`);
  return path;
}

export class EditError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function read(dir, file) {
  try {
    return await readFile(safePath(dir, file), "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return "";
    throw error;
  }
}

export async function createElement(dir, { type, attributes = {}, prose = "" }) {
  if (!BLOCK_TYPES[type]) throw new EditError(400, `Unknown block type ${type}`);
  const { workspace } = await loadWorkspace(dir);
  const attrs = { ...attributes };
  if (!attrs.id) attrs.id = suggestId(type, attrs.title || attrs.gives, new Set(workspace.byId.keys()));
  if (workspace.byId.has(attrs.id)) throw new EditError(409, `Id "${attrs.id}" already exists`);
  if (BLOCK_TYPES[type].singleton && workspace.elements.some((e) => e.type === type)) throw new EditError(409, `There can only be one ${type}`);
  const file = targetFileFor(workspace, type);
  const content = await read(dir, file);
  const header = content ? "" : `# ${chapterTitle(type)}\n`;
  await writeFile(safePath(dir, file), appendElement(header + content, type, attrs, prose), "utf8");
  return attrs.id;
}

export async function editElement(dir, id, { attributes, prose }) {
  const { workspace } = await loadWorkspace(dir);
  const element = workspace.byId.get(id);
  if (!element) throw new EditError(404, `No element with id "${id}"`);
  const newId = attributes.id || id;
  if (newId !== id && workspace.byId.has(newId)) throw new EditError(409, `Id "${newId}" already exists`);
  const content = await read(dir, element.file);
  await writeFile(safePath(dir, element.file), updateElement(content, element, { attributes: { ...attributes, id: newId }, prose }), "utf8");
  if (newId !== id) await renameReferences(dir, id, newId);
  return newId;
}

// Renaming an id keeps every reference to it intact.
async function renameReferences(dir, from, to) {
  for (;;) {
    const { workspace } = await loadWorkspace(dir);
    const referrer = workspace.elements.find((e) => refKeys(e).some((k) => [].concat(e.attributes[k]).includes(from)));
    if (!referrer) return;
    const attributes = { ...referrer.attributes };
    for (const key of refKeys(referrer)) {
      attributes[key] = Array.isArray(attributes[key]) ? attributes[key].map((v) => (v === from ? to : v)) : attributes[key] === from ? to : attributes[key];
    }
    const content = await read(dir, referrer.file);
    await writeFile(safePath(dir, referrer.file), updateElement(content, referrer, { attributes }), "utf8");
  }
}

function refKeys(element) {
  const schema = BLOCK_TYPES[element.type];
  if (!schema) return [];
  return Object.entries(schema.attributes)
    .filter(([key, def]) => (def.kind === "ref" || def.kind === "refs") && element.attributes[key] !== undefined)
    .map(([key]) => key);
}

export async function deleteElement(dir, id) {
  const { workspace } = await loadWorkspace(dir);
  const element = workspace.byId.get(id);
  if (!element) throw new EditError(404, `No element with id "${id}"`);
  const content = await read(dir, element.file);
  await writeFile(safePath(dir, element.file), removeElement(content, element), "utf8");
}

function chapterTitle(type) {
  return { 1: "Platform", 2: "Ecosystem", 3: "Motivations", 4: "Transactions", 5: "Learning Engine", 6: "Experiences", 7: "MVP" }[BLOCK_TYPES[type].chapter];
}
