import type { Element } from "hast";
import Markdown, { type Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { sanitizeSchema } from "@/lib/markdown/sanitize-schema";
import { postStyles } from "./post-styles";

export type ImageDimensions = Record<string, { width: number | null; height: number | null }>;

/** Footnote links: `endrefN` (in the text) and `endrefNp` (in the notes) point at each other. */
function resolveLink(href: string): { href: string; id?: string } {
  if (!href.startsWith("endref")) return { href };
  return { id: href, href: href.endsWith("p") ? `#${href.slice(0, -1)}` : `#${href}p` };
}

const isBlockImage = (node: Element | undefined) => {
  const children = node?.children.filter((child) => !(child.type === "text" && child.value.trim() === ""));
  return children?.length === 1 && children[0].type === "element" && children[0].tagName === "img";
};

function createComponents(images: ImageDimensions): Components {
  return {
    h1: ({ children }) => <h1 className={postStyles.headings[1]}>{children}</h1>,
    h2: ({ children }) => (
      <h2 className={postStyles.headings[2]} style={{ color: postStyles.h2Color }}>
        {children}
      </h2>
    ),
    h3: ({ children }) => <h3 className={postStyles.headings[3]}>{children}</h3>,
    h4: ({ children }) => <h4 className={postStyles.headings[4]}>{children}</h4>,
    blockquote: ({ children }) => <blockquote style={postStyles.blockquote}>{children}</blockquote>,
    ul: ({ children }) => <ul className={postStyles.bulletList}>{children}</ul>,
    ol: ({ children, start }) => (
      <ol className={postStyles.orderedList} start={start}>
        {children}
      </ol>
    ),
    li: ({ children }) => <li className={postStyles.listItem}>{children}</li>,
    hr: () => <hr className={postStyles.horizontalRule} />,
    a: ({ children, href = "", title }) => {
      const link = resolveLink(href);
      return (
        <a id={link.id} href={link.href} title={title} target="_self" style={postStyles.link} rel="noreferrer">
          {children}
        </a>
      );
    },
    // An image on its own line is a block image (no paragraph margin), as the site always has.
    p: ({ node, children }) =>
      isBlockImage(node) ? <>{children}</> : <p className={postStyles.paragraph}>{children}</p>,
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => <i>{children}</i>,
    pre: ({ node, children }) => {
      const code = node?.children.find((child): child is Element => child.type === "element");
      const classes = code?.properties.className;
      const language = (Array.isArray(classes) ? classes : []).find((name) => String(name).startsWith("language-"));
      return <pre className={`line-numbers ${language ?? "language-none"}`}>{children}</pre>;
    },
    img: ({ src, alt, title }) => {
      const size = typeof src === "string" ? images[src] : undefined;
      return (
        // eslint-disable-next-line @next/next/no-img-element -- plain <img> keeps the original layout
        <img
          loading="lazy"
          src={src}
          width={size?.width ?? undefined}
          height={size?.height ?? undefined}
          alt={alt ?? ""}
          title={title}
        />
      );
    },
  };
}

type PostContentProps = {
  markdown: string;
  /** Known intrinsic sizes of uploaded images, keyed by URL (avoids layout shift). */
  images?: ImageDimensions;
};

/** Renders post Markdown with the site's post markup and styles. */
export default function PostContent({ markdown, images = {} }: PostContentProps) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
      components={createComponents(images)}
    >
      {markdown}
    </Markdown>
  );
}
