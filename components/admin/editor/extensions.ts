import { mergeAttributes, type AnyExtension } from "@tiptap/core";
import Heading from "@tiptap/extension-heading";
import Image from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";
import { postStyles, toStyleAttribute } from "@/components/post-styles";

/** Whitespace in post text is kept as written (it is significant next to formatting). */
export const parseOptions = { preserveWhitespace: true } as const;

type EditorExtensionOptions = { placeholder?: string };

/**
 * The visual editor's schema. Node styles mirror the public renderer (components/post-styles.ts)
 * so posts look the same while editing. Everything here must be serializable by
 * lib/markdown/prosemirror.ts.
 */
export function createEditorExtensions({ placeholder }: EditorExtensionOptions = {}): AnyExtension[] {
  return [
    StarterKit.configure({
      heading: false,
      // No Markdown equivalent / would add an empty paragraph (= extra space) after a final image.
      underline: false,
      trailingNode: false,
      paragraph: { HTMLAttributes: { class: postStyles.paragraph } },
      blockquote: { HTMLAttributes: { style: toStyleAttribute(postStyles.blockquote) } },
      bulletList: { HTMLAttributes: { class: postStyles.bulletList } },
      orderedList: { HTMLAttributes: { class: postStyles.orderedList } },
      listItem: { HTMLAttributes: { class: postStyles.listItem } },
      horizontalRule: { HTMLAttributes: { class: postStyles.horizontalRule } },
      link: {
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        defaultProtocol: "https",
        HTMLAttributes: { style: toStyleAttribute(postStyles.link), target: null, rel: null, class: null },
      },
    }),
    // All six levels so migrated posts (which use h5/h6) load; the toolbar offers H2/H3.
    Heading.extend({
      renderHTML({ node, HTMLAttributes }) {
        const level = Number(node.attrs.level);
        return [
          `h${level}`,
          mergeAttributes(HTMLAttributes, {
            ...(postStyles.headings[level] ? { class: postStyles.headings[level] } : {}),
            ...(level === 2 ? { style: `color: ${postStyles.h2Color}` } : {}),
          }),
          0,
        ];
      },
    }).configure({ levels: [1, 2, 3, 4, 5, 6] }),
    Image.configure({ inline: false, allowBase64: false }),
    ...(placeholder ? [Placeholder.configure({ placeholder })] : []),
  ];
}
