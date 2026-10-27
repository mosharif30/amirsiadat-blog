/**
 * Styles of post content, shared by the public renderer (PostContent) and the visual editor so
 * the editor shows posts as they will look on the site.
 *
 * Paragraph, h1, h2 colour, blockquote and link styles are the site's original post styles.
 * Lists, h2–h4 sizes and dividers were added later; they're styled here so
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
  h2Color: "darkcyan",
  blockquote: { paddingLeft: "16px", borderLeft: "4px solid blue", fontSize: "26px" },
  link: { color: "blue" },
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
