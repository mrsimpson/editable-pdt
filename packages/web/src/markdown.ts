import { Marked } from "marked";

// Chapter prose through marked, as in arc42. Headings and pdt42 blocks never reach it — the parser
// takes them. Raw HTML in prose is shown as text, and only web, mail and relative links become
// links.

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const SAFE_URL = /^(https?:|mailto:|#|\.{0,2}\/|[\w-]+(\.[\w-]+)*(\/|$|#))/i;

const marked = new Marked({
  gfm: true,
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
    link({ href, tokens }) {
      const label = this.parser.parseInline(tokens);
      return SAFE_URL.test(href) ? `<a href="${escapeHtml(href)}">${label}</a>` : label;
    },
  },
});

export function renderMarkdown(text: string): string {
  return marked.parse(text, { async: false });
}

export function inline(text: string): string {
  return marked.parseInline(text, { async: false });
}

export function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
