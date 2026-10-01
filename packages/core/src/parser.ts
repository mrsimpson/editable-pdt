import { parseMarkdown as parseLanguage } from "@cli42/lib/parser";
import type { DslDialect } from "@cli42/lib/parser";
import type { DiagramNode, DocumentAst } from "./ast.ts";

// `.pdt42.md` documents are read by the parser every *42 language shares (@cli42/lib/parser):
//
//   # Heading                    headings of any level
//   ```pdt42 … ```               a fence holding one or more typed blocks
//   :::type / key: value / :::   a typed block inside a pdt42 fence
//   key:                         followed by indented `- item` lines: a list
//   :::ignore CODE reason :::    suppresses the next finding with that code
//   <!-- … -->                   HTML comments are skipped entirely (templates keep guidance and
//                                examples there, so they never become part of the model)
//
// Everything else is prose, one node per line.

export const PDT_DIALECT: DslDialect<DiagramNode, "inPdt42Fence"> = {
  fences: ["pdt42"],
  fenceFlag: "inPdt42Fence",
  createDiagram: ({ attributes, startLine }, source, endLine) => ({
    kind: "diagram",
    id: attributes["id"] ?? "",
    source,
    startLine,
    endLine,
  }),
};

export function parseMarkdown(filePath: string, content: string): DocumentAst {
  return parseLanguage(filePath, content.replace(/\r\n?/g, "\n"), PDT_DIALECT) as DocumentAst;
}
