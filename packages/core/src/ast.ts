// AST produced by the line parser. The parser does not know the block types: it emits every
// block it finds, and the model builder decides what is valid.

export interface SourceLocation {
  file: string;
  line: number;
}

export interface HeadingNode {
  kind: "heading";
  level: number;
  text: string;
  line: number;
}

export interface ProseNode {
  kind: "prose";
  text: string;
  /** First and last non-blank line of the paragraph group. */
  startLine: number;
  endLine: number;
}

/** A raw attribute value: `key: value` gives a string, `key:` + `- item` lines give a list. */
export type RawValue = string | string[];

export interface BlockNode {
  kind: "block";
  blockType: string;
  attributes: Record<string, RawValue>;
  /** Line of the attribute, for precise diagnostics. */
  attributeLines: Record<string, number>;
  startLine: number;
  endLine: number;
  fenceStart: number;
}

export interface IgnoreNode {
  kind: "ignore";
  code: string;
  reason: string;
  line: number;
}

export interface ParseErrorNode {
  kind: "parse-error";
  message: string;
  line: number;
}

export type AstNode = HeadingNode | ProseNode | BlockNode | IgnoreNode | ParseErrorNode;

export interface DocumentAst {
  file: string;
  nodes: AstNode[];
}
