// A small Markdown renderer for chapter prose: paragraphs, lists, block quotes, tables, code
// and the usual inline marks. Headings and pdt42 blocks never reach it — the parser takes them.
// Everything is escaped first; only the marks below produce HTML.

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const SAFE_URL = /^(https?:|mailto:|#|\.{0,2}\/|[\w-]+(\.[\w-]+)*(\/|$|#))/i;

export function inline(text: string): string {
  // Code spans are set aside behind private-use markers, so no other mark applies inside them.
  const codes: string[] = [];
  let out = text.replace(/`([^`]+)`/g, (_m, code: string) => {
    codes.push(`<code>${escapeHtml(code)}</code>`);
    return `\uE000${codes.length - 1}\uE000`;
  });
  out = escapeHtml(out)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label: string, url: string) =>
      SAFE_URL.test(url) ? `<a href="${url}">${label}</a>` : m,
    )
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2">$2</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*\w])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
    .replace(/(^|[^_\w])_([^_\s][^_]*)_(?!\w)/g, "$1<em>$2</em>");
  return out.replace(/\uE000(\d+)\uE000/g, (_m, i: string) => codes[Number(i)]!);
}

const LIST_ITEM = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const TABLE_ROW = /^\s*\|.*\|\s*$/;
const TABLE_RULE = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function cells(row: string): string[] {
  return row
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
}

export function renderMarkdown(text: string): string {
  const lines = text.split("\n");
  const html: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (!line.trim()) {
      i++;
      continue;
    }
    // Fenced code
    const fence = /^\s*(```|~~~)/.exec(line);
    if (fence) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.trim().startsWith(fence[1]!)) body.push(lines[i++]!);
      i++;
      html.push(`<pre><code>${escapeHtml(body.join("\n"))}</code></pre>`);
      continue;
    }
    // Table
    if (TABLE_ROW.test(line) && TABLE_RULE.test(lines[i + 1] ?? "")) {
      const head = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && TABLE_ROW.test(lines[i]!)) rows.push(cells(lines[i++]!));
      html.push(
        `<table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>` +
          rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("") +
          "</tbody></table>",
      );
      continue;
    }
    // Block quote
    if (/^\s*>/.test(line)) {
      const body: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i]!)) {
        body.push(lines[i++]!.replace(/^\s*>\s?/, ""));
      }
      html.push(`<blockquote>${renderMarkdown(body.join("\n"))}</blockquote>`);
      continue;
    }
    // Horizontal rule
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      html.push("<hr>");
      i++;
      continue;
    }
    // List (one level of nesting is enough for prose)
    const item = LIST_ITEM.exec(line);
    if (item) {
      const ordered = /\d/.test(item[2]!);
      const indent = item[1]!.length;
      const items: string[] = [];
      while (i < lines.length) {
        const m = LIST_ITEM.exec(lines[i]!);
        if (m && m[1]!.length === indent) {
          items.push(m[3]!);
          i++;
        } else if (lines[i]!.trim() && /^\s+/.test(lines[i]!) && items.length) {
          // Continuation or nested item: keep it with the current item.
          items[items.length - 1] += "\n" + lines[i++]!.slice(indent + 2);
        } else break;
      }
      const tag = ordered ? "ol" : "ul";
      html.push(
        `<${tag}>${items
          .map((it) => {
            const [first, ...rest] = it.split("\n");
            return `<li>${inline(first!)}${rest.length ? renderMarkdown(rest.join("\n")) : ""}</li>`;
          })
          .join("")}</${tag}>`,
      );
      continue;
    }
    // Paragraph
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i]!.trim() &&
      !LIST_ITEM.test(lines[i]!) &&
      !/^\s*(>|```|~~~)/.test(lines[i]!) &&
      !(TABLE_ROW.test(lines[i]!) && TABLE_RULE.test(lines[i + 1] ?? ""))
    ) {
      para.push(lines[i++]!.trim());
    }
    html.push(`<p>${inline(para.join("\n")).replace(/ {2,}\n/g, "<br>")}</p>`);
  }
  return html.join("\n");
}

export function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
