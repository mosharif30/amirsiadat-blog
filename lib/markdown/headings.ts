import type { Element, ElementContent, Root } from "hast";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { slugify } from "@/lib/slug";
import { sanitizeSchema } from "./sanitize-schema";

export type Heading = { id: string; text: string; level: 2 | 3 };

const textOf = (node: ElementContent): string =>
  node.type === "text" ? node.value : node.type === "element" ? node.children.map(textOf).join("") : "";

/**
 * Rehype plugin: gives h2/h3 headings ids ("the-tramp", "the-tramp-2", …) for the table of
 * contents. Runs after sanitizing, so the ids aren't prefixed like user-written ids.
 */
export function rehypeHeadingIds(options: { collect?: Heading[] } = {}) {
  return (tree: Root) => {
    const used = new Map<string, number>();
    const visit = (parent: Root | Element) => {
      for (const node of parent.children) {
        if (node.type !== "element") continue;
        if (node.tagName === "h2" || node.tagName === "h3") {
          const text = textOf(node).replace(/\s+/g, " ").trim();
          const base = slugify(text) || "section";
          const count = (used.get(base) ?? 0) + 1;
          used.set(base, count);
          const id = count === 1 ? base : `${base}-${count}`;
          node.properties.id = id;
          if (text) options.collect?.push({ id, text, level: node.tagName === "h2" ? 2 : 3 });
        } else {
          visit(node);
        }
      }
    };
    visit(tree);
  };
}

/** Same pipeline as components/PostContent.tsx, so the ids match the rendered headings. */
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSanitize, sanitizeSchema);

/** The h2/h3 outline of a post, for its table of contents. */
export function extractHeadings(markdown: string): Heading[] {
  if (!/^\s{0,3}#{2,3}\s|<h[23]\b/im.test(markdown)) return [];
  const headings: Heading[] = [];
  rehypeHeadingIds({ collect: headings })(processor.runSync(processor.parse(markdown)) as Root);
  return headings;
}
