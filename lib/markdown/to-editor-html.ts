import type { Element, ElementContent, Root, RootContent } from "hast";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { sanitizeSchema } from "./sanitize-schema";

const BLOCK_CONTAINERS = new Set(["blockquote", "ul", "ol", "li"]);
const BLOCK_TAGS = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "blockquote", "pre", "hr", "img"]);

const isBlankText = (node: RootContent | ElementContent) => node.type === "text" && node.value.trim() === "";

/**
 * Adapts the rendered HTML for the editor's HTML parser:
 * - an image alone in a paragraph becomes a block image (as on the public site),
 * - whitespace between blocks is dropped (it would otherwise become text),
 * - the newline after a hard break is dropped, other newlines in text become spaces, and the
 *   final newline of a code block is dropped (the editor would keep them as visible breaks).
 */
function rehypeEditorCleanup() {
  const visit = (parent: Root | Element) => {
    const isBlockParent =
      parent.type === "root" ||
      (BLOCK_CONTAINERS.has(parent.tagName) &&
        (parent.tagName !== "li" ||
          parent.children.some((child) => child.type === "element" && BLOCK_TAGS.has(child.tagName))));

    const children: (RootContent | ElementContent)[] = [];
    parent.children.forEach((child, index) => {
      if (isBlockParent && isBlankText(child)) return;
      if (child.type === "element" && child.tagName === "p") {
        const meaningful = child.children.filter((grandchild) => !isBlankText(grandchild));
        if (meaningful.length === 1 && meaningful[0]!.type === "element" && meaningful[0]!.tagName === "img") {
          children.push(meaningful[0]!);
          return;
        }
      }
      const previous = parent.children[index - 1];
      if (child.type === "text" && previous?.type === "element" && previous.tagName === "br") {
        child.value = child.value.replace(/^\n/, "");
      }
      // Soft line breaks render as spaces (the editor would keep them as line breaks).
      if (child.type === "text" && !(parent.type === "element" && (parent.tagName === "pre" || parent.tagName === "code"))) {
        child.value = child.value.replace(/\n/g, " ");
      }
      // Fenced code ends with a newline that would become an extra empty line in the editor.
      if (child.type === "text" && parent.type === "element" && parent.tagName === "code" && index === parent.children.length - 1) {
        child.value = child.value.replace(/\n$/, "");
      }
      if (child.type === "element") visit(child);
      children.push(child);
    });
    parent.children = children as typeof parent.children;
  };
  return (tree: Root) => visit(tree);
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSanitize, sanitizeSchema)
  .use(rehypeEditorCleanup)
  .use(rehypeStringify);

/** Post Markdown → sanitized HTML for loading into the visual editor. */
export function markdownToEditorHtml(markdown: string): string {
  return String(processor.processSync(markdown));
}
