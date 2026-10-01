// Prose rendering and heading anchors, as every *42 web view has them (@cli42/lib): raw HTML is
// shown as text, and only web, mail and relative links become links.
export { escapeHtml, renderMarkdown, renderMarkdownInline as inline } from "@cli42/lib/markdown";
export { slug } from "@cli42/lib/web";
