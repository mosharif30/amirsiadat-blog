// @vitest-environment happy-dom
import { Editor } from "@tiptap/core";
import { describe, expect, it } from "vitest";
import { createEditorExtensions, parseOptions } from "@/components/admin/editor/extensions";
import { prosemirrorToMarkdown, type PMNode } from "@/lib/markdown/prosemirror";
import { markdownToEditorHtml } from "@/lib/markdown/to-editor-html";
import content from "@/prisma/seed-data/content.json";

/** Markdown → editor (as the browser loads it) → Markdown (as the editor saves it). */
function roundTrip(markdown: string): string {
  const editor = new Editor({ extensions: createEditorExtensions(), content: markdownToEditorHtml(markdown), parseOptions });
  const json = editor.getJSON() as PMNode;
  editor.destroy();
  return prosemirrorToMarkdown(json);
}

describe("visual editor round trip", () => {
  it.each(content.posts.map((post) => [post.slug, post.content] as const))(
    "%s survives load + save unchanged",
    (_slug, markdown) => {
      expect(roundTrip(markdown)).toBe(markdown);
    },
  );

  it.each([
    ["headings", "## Heading two\n\n### Heading *three*\n"],
    ["marks", "**bold** *italic* ~~strike~~ `code` ***both***\n"],
    ["edge spaces", "a <i>spaced </i>word and <strong> bold</strong>\n"],
    ["links", "[a **link**](https://example.com \"Title\") and [\\[1\\]](endref1)\n"],
    ["breaks", "<br>first\\\nsecond<br>\n"],
    ["spacer paragraphs", "![](/uploads/a.jpg \"a.jpg\")\n\n<p></p>\n\n<p><br><br></p>\n\ntext\n"],
    ["bullet list", "- one\n- two\n  - nested\n- three\n"],
    ["ordered list", "3. three\n4. four\n"],
    ["loose list", "- para one\n\n  para two\n\n- next\n"],
    ["blockquote", "> quoted *text*\n>\n> second paragraph\n"],
    ["divider", "before\n\n---\n\nafter\n"],
    ["code block", "```js\nconst a = 1;\n```\n"],
    ["escapes", "1\\. not a list, \\*not emphasis\\*, \\<tag\\>\n"],
    ["bare url", "<p>see https://example.com</p>\n"],
    ["image with alt", "![A cat](/uploads/cat.png)\n"],
  ])("%s", (_name, markdown) => {
    expect(roundTrip(markdown)).toBe(markdown);
  });

  it("serializes an empty document as an empty string", () => {
    expect(roundTrip("")).toBe("");
  });
});
