import { blocksToMarkdown, type BlockNode, type InlineNode, type Marks } from "./serialize";

/** ProseMirror/TipTap document JSON (`editor.getJSON()`). */
export type PMNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PMNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

const str = (value: unknown) => (typeof value === "string" && value !== "" ? value : undefined);

/** Converts the visual editor's document to Markdown. */
export function prosemirrorToMarkdown(doc: PMNode): string {
  const content = doc.content ?? [];
  // A new, untouched editor holds a single empty paragraph.
  if (content.length === 1 && content[0]!.type === "paragraph" && !content[0]!.content?.length) return "";
  return blocksToMarkdown(toBlocks(content));
}

function toBlocks(nodes: PMNode[]): BlockNode[] {
  return nodes.flatMap((node): BlockNode[] => {
    switch (node.type) {
      case "paragraph":
        return [{ type: "paragraph", content: toInline(node.content ?? []) }];
      case "heading":
        return [{ type: "heading", level: Number(node.attrs?.level ?? 2), content: toInline(node.content ?? []) }];
      case "image":
        return node.attrs?.src
          ? [{ type: "image", src: String(node.attrs.src), alt: str(node.attrs.alt), title: str(node.attrs.title) }]
          : [];
      case "blockquote":
        return [{ type: "blockquote", content: toBlocks(node.content ?? []) }];
      case "bulletList":
      case "orderedList":
        return [
          {
            type: "list",
            ordered: node.type === "orderedList",
            start: node.type === "orderedList" ? Number(node.attrs?.start ?? 1) : undefined,
            items: (node.content ?? []).map((item) => toBlocks(item.content ?? [])),
          },
        ];
      case "horizontalRule":
        return [{ type: "horizontalRule" }];
      case "codeBlock":
        return [
          {
            type: "codeBlock",
            language: str(node.attrs?.language),
            text: (node.content ?? []).map((child) => child.text ?? "").join(""),
          },
        ];
      default:
        // Unknown block: keep its text rather than dropping it.
        return node.content ? toBlocks(node.content) : [];
    }
  });
}

function marksOf(node: PMNode | undefined): { marks: Marks; link?: InlineNode["link"] } {
  const marks: Marks = {};
  let link: InlineNode["link"];
  for (const mark of node?.marks ?? []) {
    if (mark.type === "bold") marks.bold = true;
    else if (mark.type === "italic") marks.italic = true;
    else if (mark.type === "strike") marks.strike = true;
    else if (mark.type === "code") marks.code = true;
    else if (mark.type === "link" && mark.attrs?.href) {
      link = { href: String(mark.attrs.href), title: str(mark.attrs.title) };
    }
  }
  return { marks, link };
}

function toInline(nodes: PMNode[]): InlineNode[] {
  return nodes.flatMap((node, index): InlineNode[] => {
    if (node.type === "text") return [{ text: node.text ?? "", ...marksOf(node) }];
    if (node.type === "hardBreak") {
      // A break inside formatted text takes the formatting both neighbours share, so
      // `<i>a<br>b</i>` stays one italic run instead of two.
      if (node.marks?.length) return [{ text: "\n", ...marksOf(node) }];
      const prev = marksOf(nodes[index - 1]);
      const next = marksOf(nodes[index + 1]);
      return [
        {
          text: "\n",
          marks: {
            bold: prev.marks.bold && next.marks.bold,
            italic: prev.marks.italic && next.marks.italic,
            strike: prev.marks.strike && next.marks.strike,
          },
          link: prev.link && next.link && prev.link.href === next.link.href ? prev.link : undefined,
        },
      ];
    }
    return [];
  });
}
