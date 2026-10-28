/**
 * Styles of post content, shared by the public renderer (PostContent) and the visual editor so
 * the editor shows posts as they will look on the site.
 *
 * Paragraph and h1 styles are the site's original post styles; h2, blockquote and link colours
 * use the site's navy. Lists, h2–h4 sizes and dividers were added later; they're styled here so
 * they look intentional (Tailwind's reset would otherwise render them as plain text).
 */
export const postStyles = {
  paragraph: "mb-8",
  headings: {
    1: "wfafsa",
    2: "text-2xl font-semibold mb-4",
    3: "text-xl font-semibold mb-4",
    4: "text-lg font-semibold mb-4",
  } as Record<number, string | undefined>,
  h2Color: "#0a3d62",
  blockquote: {
    margin: "0 0 2rem",
    paddingLeft: "20px",
    borderLeft: "3px solid #0a3d62",
    color: "#374151",
    fontSize: "1.375rem",
    fontStyle: "italic",
    lineHeight: "1.5",
  },
  link: { color: "#0a3d62", textDecoration: "underline", textUnderlineOffset: "3px" },
  bulletList: "list-disc pl-8 mb-8",
  orderedList: "list-decimal pl-8 mb-8",
  listItem: "mb-2 [&>ol]:mb-0 [&>ol]:mt-2 [&>ul]:mb-0 [&>ul]:mt-2",
  horizontalRule: "my-8 border-gray-300",
};

/** `{ paddingLeft: "16px" }` → `"padding-left: 16px"` for HTML attributes. */
export const toStyleAttribute = (style: Record<string, string>) =>
  Object.entries(style)
    .map(([key, value]) => `${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}: ${value}`)
    .join("; ");
