// The AST of a pdt42 document: the nodes of @cli42/lib's parser, as every *42 language has them,
// with pdt42's fence flag on blocks. pdt42 has no `:::diagram` blocks; a diagram node is kept so
// the parser's dialect is complete.
import type {
  BareMermaidNode,
  HeadingNode,
  IgnoreNode,
  MarkdownBlockNode,
  ProseNode,
} from "@cli42/lib/parser";

export type { BareMermaidNode, HeadingNode, IgnoreNode, ProseNode };

/** Where something is: its document and line, and the heading and prose before it. */
export interface SourceLocation {
  file: string;
  line: number;
  /** The text of the nearest heading before it in its document, if any. */
  heading?: string;
  /** Prose lines between that heading and the block, if any. */
  prose?: string;
}

/** A `:::type` block; `inPdt42Fence` says whether it sat inside a ```pdt42 fence. */
export type BlockNode = MarkdownBlockNode & { inPdt42Fence: boolean };

/** A `:::diagram` block — not part of pdt42; the model builder ignores it. */
export interface DiagramNode {
  kind: "diagram";
  id: string;
  source: string;
  startLine: number;
  endLine: number;
}

export type AstNode =
  | HeadingNode
  | ProseNode
  | BlockNode
  | DiagramNode
  | BareMermaidNode
  | IgnoreNode;

export interface DocumentAst {
  filePath: string;
  nodes: AstNode[];
}
