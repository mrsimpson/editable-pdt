// A deliberately small Markdown renderer for element prose: paragraphs,
// bullet lists, emphasis, inline code and links. Enough for explanatory
// text; anything richer stays readable as plain text.

export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

export function inline(text) {
  return esc(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

export function markdown(text) {
  const blocks = String(text ?? "").trim().split(/\n\s*\n/);
  return blocks
    .filter((b) => b.trim())
    .map((block) => {
      const lines = block.split("\n");
      if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
        return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ""))}</li>`).join("")}</ul>`;
      }
      if (/^>\s?/.test(lines[0])) return `<blockquote>${inline(lines.map((l) => l.replace(/^>\s?/, "")).join(" "))}</blockquote>`;
      return `<p>${inline(lines.join(" "))}</p>`;
    })
    .join("");
}

// First sentence of the prose, for captions on the canvases.
export function firstSentence(text, max = 160) {
  const plain = String(text ?? "").replace(/\s+/g, " ").replace(/[*`]/g, "").trim();
  const sentence = plain.match(/^.*?[.!?](\s|$)/)?.[0].trim() ?? plain;
  return sentence.length > max ? `${sentence.slice(0, max - 1).trimEnd()}…` : sentence;
}
