/**
 * Serializes a neutral document model (paragraphs, headings, lists, … with bold/italic/strike/code
 * marks and links) into Markdown that `components/PostContent.tsx` renders back to the same DOM.
 * Used by the visual editor (ProseMirror JSON → see ./prosemirror.ts).
 *
 * Constructs that plain Markdown cannot express are emitted as inline HTML, which the renderer
 * allows (and sanitizes):
 * - empty paragraphs (they add vertical space after images) -> `<p></p>`
 * - line breaks at the start/end of a paragraph -> `<br>`
 * - emphasis with spaces at its edges, or whose delimiters CommonMark would not recognise
 *   -> `<i>` / `<strong>` / `<del>`
 * - paragraphs with plain-text URLs/emails (GFM would auto-link them) -> a raw `<p>…</p>` block
 */

export type Marks = { bold?: boolean; italic?: boolean; strike?: boolean; code?: boolean };

/** Inline content: text runs; `\n` inside text is a hard line break. */
export type InlineNode = { text: string; marks?: Marks; link?: { href: string; title?: string } };

export type BlockNode =
  | { type: "paragraph"; content: InlineNode[] }
  | { type: "heading"; level: number; content: InlineNode[] }
  | { type: "image"; src: string; alt?: string; title?: string }
  | { type: "blockquote"; content: BlockNode[] }
  | { type: "list"; ordered: boolean; start?: number; items: BlockNode[][] }
  | { type: "horizontalRule" }
  | { type: "codeBlock"; language?: string; text: string };

export function blocksToMarkdown(blocks: BlockNode[]): string {
  const markdown = renderBlocks(blocks);
  return markdown ? markdown + "\n" : "";
}

function renderBlocks(blocks: BlockNode[], separator = "\n\n"): string {
  return blocks
    .map(renderBlock)
    .filter((block): block is string => block !== null)
    .join(separator);
}

function renderBlock(block: BlockNode): string | null {
  switch (block.type) {
    case "paragraph": {
      const items = toItems(block.content);
      const plain = items.map((item) => (item.kind === "text" ? item.text : "x")).join("");
      if (plain.trim() === "") {
        // Kept (they add space after images); `\n` inside them became <br>.
        return `<p>${"<br>".repeat((plain.match(/\n/g) ?? []).length)}</p>`;
      }
      if (items.some((item) => item.kind === "text" && !item.code && BARE_LINK.test(item.text))) {
        return `<p>${itemsToHtml(items)}</p>`;
      }
      return renderInline(items, { singleLine: false });
    }
    case "heading": {
      const items = toItems(block.content);
      // Empty headings render nothing.
      if (items.every((item) => item.kind === "text" && item.text === "")) return null;
      const level = Math.min(6, Math.max(1, block.level));
      return `${"#".repeat(level)} ${renderInline(items, { singleLine: true })}`;
    }
    case "image": {
      const alt = (block.alt ?? "").replace(/[\\[\]]/g, "\\$&");
      const title = block.title ? ` "${block.title.replace(/["\\]/g, "\\$&")}"` : "";
      return `![${alt}](${formatDestination(block.src)}${title})`;
    }
    case "blockquote": {
      const inner = renderBlocks(block.content);
      return inner
        .split("\n")
        .map((line) => (line ? `> ${line}` : ">"))
        .join("\n");
    }
    case "list": {
      // Tight lists (one paragraph per item, plus nested lists) render without <p> in <li>.
      const tight = block.items.every((item) => item.filter((child) => child.type !== "list").length <= 1);
      const start = block.start ?? 1;
      return block.items
        .map((item, index) => {
          const marker = block.ordered ? `${start + index}. ` : "- ";
          const body = renderBlocks(item, tight ? "\n" : "\n\n") || "";
          const indent = " ".repeat(marker.length);
          return (
            marker +
            body
              .split("\n")
              .map((line, lineIndex) => (lineIndex === 0 || line === "" ? line : indent + line))
              .join("\n")
          );
        })
        .join(tight ? "\n" : "\n\n");
    }
    case "horizontalRule":
      return "---";
    case "codeBlock": {
      const longest = Math.max(2, ...(block.text.match(/`+/g) ?? []).map((run) => run.length));
      const fence = "`".repeat(longest + 1);
      return `${fence}${block.language ?? ""}\n${block.text}\n${fence}`;
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Inline content
// ---------------------------------------------------------------------------------------------

type Segment = { kind: "text"; text: string; bold: boolean; italic: boolean; strike: boolean; code: boolean };
type LinkAtom = { kind: "link"; href: string; title?: string; children: Segment[] };
type Item = Segment | LinkAtom;

type InlineContext = { singleLine: boolean };

const segment = (node: InlineNode, text: string): Segment => ({
  kind: "text",
  text,
  bold: !!node.marks?.bold,
  italic: !!node.marks?.italic,
  strike: !!node.marks?.strike,
  code: !!node.marks?.code,
});

function toItems(nodes: InlineNode[]): Item[] {
  const items: Item[] = [];
  for (const node of nodes) {
    // Line breaks can't be part of a code span.
    const parts = node.marks?.code ? node.text.split(/(\n)/) : [node.text];
    for (const part of parts) {
      const seg = part === "\n" && node.marks?.code ? { ...segment(node, part), code: false } : segment(node, part);
      if (!node.link) {
        items.push(seg);
        continue;
      }
      const prev = items[items.length - 1];
      if (prev?.kind === "link" && prev.href === node.link.href && prev.title === node.link.title) {
        prev.children.push(seg);
      } else {
        items.push({ kind: "link", href: node.link.href, title: node.link.title || undefined, children: [seg] });
      }
    }
  }
  return mergeSegments(items).map((item) =>
    item.kind === "link" ? { ...item, children: mergeSegments(item.children) as Segment[] } : item,
  );
}

const sameMarks = (a: Segment, b: Segment) =>
  a.bold === b.bold && a.italic === b.italic && a.strike === b.strike && a.code === b.code;

/** Merges adjacent text runs with equal marks. */
function mergeSegments(items: Item[]): Item[] {
  const out: Item[] = [];
  for (const item of items) {
    if (item.kind === "text" && item.text === "") continue;
    const prev = out[out.length - 1];
    if (item.kind === "text" && prev?.kind === "text" && sameMarks(prev, item)) {
      prev.text += item.text;
      continue;
    }
    out.push(item.kind === "text" ? { ...item } : item);
  }
  return out;
}

function renderInline(items: Item[], ctx: InlineContext): string {
  // Trailing spaces at the end of a paragraph/heading are ignored by Markdown anyway.
  return finalizeLineBreaks(renderItems(items), ctx).replace(/[ \t]+$/, "");
}

/** Line break placeholder, resolved once the whole paragraph is known. */
const BREAK = "\u0000BR\u0000";

type Piece = { md: string; bold: boolean; italic: boolean; strike: boolean };

function renderItems(items: Item[]): string {
  // Group consecutive pieces by italic, then bold, then strike, so delimiters nest cleanly.
  const pieces: Piece[] = items.map((item) => (item.kind === "link" ? renderLink(item) : textPiece(item)));
  return joinWithEmphasis(pieces, (piece) => piece.italic, "*", "i", (italicGroup) =>
    joinWithEmphasis(italicGroup, (piece) => piece.bold, "**", "strong", (boldGroup) =>
      joinWithEmphasis(boldGroup, (piece) => piece.strike, "~~", "del", (inner) => inner.map((p) => p.md).join("")),
    ),
  );
}

function textPiece(seg: Segment): Piece {
  return { md: seg.code ? codeSpan(seg.text) : escapeText(seg.text), bold: seg.bold, italic: seg.italic, strike: seg.strike };
}

function codeSpan(text: string): string {
  const longest = Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length));
  const fence = "`".repeat(longest + 1);
  const pad = /^`|`$/.test(text) || (/^ /.test(text) && / $/.test(text) && text.trim() !== "") ? " " : "";
  return `${fence}${pad}${text}${pad}${fence}`;
}

function renderLink(link: LinkAtom): Piece {
  const inner = renderItems(link.children);
  const title = link.title ? ` "${link.title.replace(/["\\]/g, "\\$&")}"` : "";
  return { md: `[${inner}](${formatDestination(link.href)}${title})`, bold: false, italic: false, strike: false };
}

function joinWithEmphasis(
  pieces: Piece[],
  flag: (piece: Piece) => boolean,
  delimiter: string,
  tag: string,
  renderGroup: (group: Piece[]) => string,
): string {
  // Build runs of consecutive pieces sharing the flag.
  const runs: { on: boolean; pieces: Piece[] }[] = [];
  for (const piece of pieces) {
    const on = flag(piece);
    const last = runs[runs.length - 1];
    if (last && last.on === on) last.pieces.push(piece);
    else runs.push({ on, pieces: [piece] });
  }

  const rendered = runs.map((run) => ({ on: run.on, md: renderGroup(run.pieces) }));
  let out = "";
  rendered.forEach((run, index) => {
    if (!run.on) {
      out += run.md;
      return;
    }
    const [lead, body, trail] = splitOuterWhitespace(run.md);
    // Emphasis delimiters can't sit next to spaces, and moving the spaces outside the tag shifts
    // glyph positioning slightly, so runs with edge spaces keep them inside an HTML tag.
    if (body === "" || (lead + trail).replaceAll(BREAK, "") !== "") {
      out += `<${tag}>${run.md}</${tag}>`;
      return;
    }
    const before = (out + lead).slice(-1);
    const nextRun = rendered[index + 1];
    const after = trail ? trail[0] : nextRun ? (nextRun.md[0] ?? "") : "";
    const ok = canOpen(before, body) && canClose(body, after);
    out += ok ? `${lead}${delimiter}${body}${delimiter}${trail}` : `${lead}<${tag}>${body}</${tag}>${trail}`;
  });
  return out;
}

function splitOuterWhitespace(md: string): [string, string, string] {
  const lead = md.match(/^(?:\s|\u0000BR\u0000)*/)![0];
  const rest = md.slice(lead.length);
  const trail = rest.match(/(?:\s|\u0000BR\u0000)*$/)![0];
  return [lead, rest.slice(0, rest.length - trail.length), trail];
}

const isWhitespace = (char: string) => char === "" || /\s/u.test(char) || char === "\u0000";
const isPunctuation = (char: string) => /[\p{P}\p{S}]/u.test(char);

/** CommonMark left-flanking rule for delimiter runs (`before` = char preceding the delimiter). */
function canOpen(before: string, body: string): boolean {
  const next = body[0];
  if (isWhitespace(next)) return false;
  return !isPunctuation(next) || isWhitespace(before) || isPunctuation(before);
}

/** CommonMark right-flanking rule for delimiter runs (`after` = char following the delimiter). */
function canClose(body: string, after: string): boolean {
  const prev = body[body.length - 1];
  if (isWhitespace(prev)) return false;
  return !isPunctuation(prev) || isWhitespace(after) || isPunctuation(after);
}

/**
 * Text escaping. Line breaks become BREAK placeholders; everything that could start
 * Markdown/GFM syntax is backslash-escaped.
 */
function escapeText(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/[\\`*_[\]<>~|]/g, (char) => `\\${char}`).replace(/&(?=#?[a-zA-Z0-9]+;)/g, "\\&"))
    .join(BREAK);
}

/** Escapes characters that would start a block construct at the beginning of a line. */
function escapeLineStart(line: string): string {
  const rest = line.replace(/^\s*/, "");
  // Leading whitespace is insignificant in rendered HTML but 4+ spaces would start a code block.
  return rest.replace(/^([#+\-=]|\\?>)/, (match) => (match.startsWith("\\") ? match : `\\${match}`)).replace(/^(\d+)([.)])/, "$1\\$2");
}

/**
 * Resolves BREAK placeholders. A break between two pieces of content becomes a Markdown hard
 * break (`\` + newline); leading/trailing breaks (and breaks in headings) become `<br>`.
 */
function finalizeLineBreaks(markdown: string, ctx: InlineContext): string {
  const parts = markdown.split(BREAK);
  const hasContent = (part: string) => part.replace(/<\/?(?:i|strong|del)>|\*|~~/g, "").trim() !== "";
  const firstContent = parts.findIndex(hasContent);
  const lastContent = parts.findLastIndex(hasContent);

  let out = escapeLineStart(parts[0]);
  for (let index = 1; index < parts.length; index++) {
    // Break `index - 1` sits between parts[index - 1] and parts[index].
    const between = firstContent !== -1 && firstContent < index && lastContent >= index;
    if (between && !ctx.singleLine) {
      out = out.replace(/[ \t]+$/, "") + "\\\n" + escapeLineStart(parts[index]);
    } else {
      out += "<br>" + parts[index];
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// HTML fallback
// ---------------------------------------------------------------------------------------------

/** Text GFM would turn into a link (URL, www. domain or email address). */
const BARE_LINK = /https?:\/\/|\bwww\.|[^\s@]+@[^\s@]+\.\w/i;

const escapeHtml = (value: string) =>
  value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]!);

function itemsToHtml(items: Item[]): string {
  return items
    .map((item) => {
      if (item.kind === "link") {
        const title = item.title ? ` title="${escapeHtml(item.title)}"` : "";
        return `<a href="${escapeHtml(item.href)}"${title}>${itemsToHtml(item.children)}</a>`;
      }
      let html = escapeHtml(item.text).replace(/\n/g, "<br>");
      if (item.code) html = `<code>${html}</code>`;
      if (item.strike) html = `<del>${html}</del>`;
      if (item.bold) html = `<strong>${html}</strong>`;
      if (item.italic) html = `<i>${html}</i>`;
      return html;
    })
    .join("");
}

function formatDestination(url: string): string {
  return /[\s()<>]/.test(url) ? `<${url.replace(/[<>]/g, encodeURIComponent)}>` : url;
}
