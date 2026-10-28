import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PostContent from "@/components/PostContent";
import { extractHeadings } from "@/lib/markdown/headings";
import { blocksToMarkdown, type BlockNode, type InlineNode, type Marks } from "@/lib/markdown/serialize";

const p = (...content: InlineNode[]): BlockNode => ({ type: "paragraph", content });
const text = (value: string, marks: Marks = {}, link?: InlineNode["link"]): InlineNode => ({ text: value, marks, link });
const render = (markdown: string) => renderToStaticMarkup(createElement(PostContent, { markdown }));
const convert = (...blocks: BlockNode[]) => render(blocksToMarkdown(blocks));

describe("blocksToMarkdown", () => {
  it("converts paragraphs with italic and bold runs", () => {
    const md = blocksToMarkdown([p(text("In "), text("Faust", { italic: true }), text(" he "), text("wins", { bold: true }))]);
    expect(md).toBe("In *Faust* he **wins**\n");
    expect(render(md)).toBe('<p class="mb-8">In <i>Faust</i> he <strong>wins</strong></p>');
  });

  it("keeps spaces at the edge of a styled run inside the tag", () => {
    const md = blocksToMarkdown([p(text("In "), text("Faust ", { italic: true }), text("he"))]);
    expect(md).toBe("In <i>Faust </i>he\n");
    expect(render(md)).toBe('<p class="mb-8">In <i>Faust </i>he</p>');
  });

  it("nests bold inside italic", () => {
    expect(convert(p(text("a "), text("b", { italic: true, bold: true }), text(" c")))).toBe(
      '<p class="mb-8">a <i><strong>b</strong></i> c</p>',
    );
  });

  it("falls back to HTML tags where CommonMark would not see emphasis", () => {
    const md = blocksToMarkdown([p(text("word"), text("“Title”", { italic: true }), text("s"))]);
    expect(md).toBe("word<i>“Title”</i>s\n");
    expect(render(md)).toBe('<p class="mb-8">word<i>“Title”</i>s</p>');
  });

  it("keeps empty paragraphs and paragraphs made of line breaks", () => {
    expect(convert(p(text("")), p(text("\n\n")))).toBe('<p class="mb-8"></p>\n<p class="mb-8"><br/><br/></p>');
  });

  it("turns inner line breaks into hard breaks and edge breaks into <br>", () => {
    const md = blocksToMarkdown([p(text("\none\ntwo\n\n"))]);
    expect(md).toBe("<br>one\\\ntwo<br><br>\n");
    expect(render(md)).toBe('<p class="mb-8"><br/>one<br/>\ntwo<br/><br/></p>');
  });

  it("escapes Markdown syntax", () => {
    expect(convert(p(text("1. *not* a list <b> [x](y) ~a~ |")))).toBe(
      '<p class="mb-8">1. *not* a list &lt;b&gt; [x](y) ~a~ |</p>',
    );
    expect(convert(p(text("# not a heading")))).toBe('<p class="mb-8"># not a heading</p>');
    expect(convert(p(text("a\n- not a list")))).toBe('<p class="mb-8">a<br/>\n- not a list</p>');
  });

  it("keeps plain-text URLs as text (no GFM auto-linking)", () => {
    const md = blocksToMarkdown([p(text("see https://example.com and "), text("www.x.org", { italic: true }))]);
    expect(md).toBe("<p>see https://example.com and <i>www.x.org</i></p>\n");
    expect(render(md)).toBe('<p class="mb-8">see https://example.com and <i>www.x.org</i></p>');
  });

  it("converts footnote links to reciprocal anchors", () => {
    const html = convert(
      p(text("Claim"), text("[1]", {}, { href: "endref1" })),
      p(text("[1]", {}, { href: "endref1p" }), text(" Source")),
    );
    expect(html).toContain('<a id="endref1" href="#endref1p" target="_self" style="color:#0a3d62;text-decoration:underline;text-underline-offset:3px" rel="noreferrer">[1]</a>');
    expect(html).toContain('<a id="endref1p" href="#endref1" target="_self" style="color:#0a3d62;text-decoration:underline;text-underline-offset:3px" rel="noreferrer">[1]</a>');
  });

  it("renders images as standalone blocks and drops empty headings", () => {
    const md = blocksToMarkdown([
      { type: "heading", level: 5, content: [text("")] },
      { type: "image", src: "/uploads/a.jpg", title: "a.jpg" },
    ]);
    expect(md).toBe('![](/uploads/a.jpg "a.jpg")\n');
    expect(render(md)).toBe('<img loading="lazy" src="/uploads/a.jpg" alt="" title="a.jpg"/>');
  });

  it("serializes lists, quotes, dividers and code", () => {
    expect(
      blocksToMarkdown([
        { type: "list", ordered: false, items: [[p(text("one"))], [p(text("two")), { type: "list", ordered: true, start: 3, items: [[p(text("three"))]] }]] },
        { type: "blockquote", content: [p(text("quoted")), p(text("more"))] },
        { type: "horizontalRule" },
        { type: "codeBlock", language: "js", text: "let a = `x`;" },
        p(text("run "), text("code", { code: true }), text(" and "), text("gone", { strike: true })),
      ]),
    ).toBe("- one\n- two\n  3. three\n\n> quoted\n>\n> more\n\n---\n\n```js\nlet a = `x`;\n```\n\nrun `code` and ~~gone~~\n");
  });
});

describe("PostContent", () => {
  it("adds known image dimensions", () => {
    const html = renderToStaticMarkup(
      createElement(PostContent, { markdown: "![x](/u/a.png)", images: { "/u/a.png": { width: 640, height: 480 } } }),
    );
    expect(html).toBe('<img loading="lazy" src="/u/a.png" width="640" height="480" alt="x"/>');
  });

  it("sanitizes dangerous HTML", () => {
    const html = render('<script>alert(1)</script>\n\n<img src="x" onerror="alert(1)">\n\n[x](javascript:alert(1))');
    expect(html).not.toMatch(/<script|onerror|javascript:/);
  });

  it.each([
    '<a href="javascript:alert(1)">x</a>',
    '<a href="JaVaScRiPt:alert(1)">x</a>',
    '<a href="data:text/html;base64,PHNjcmlwdD4=">x</a>',
    "[x](vbscript:msgbox)",
    '<iframe src="https://evil.test"></iframe>',
    '<svg><script>alert(1)</script></svg>',
    '<p style="background:url(javascript:alert(1))" onclick="alert(1)">x</p>',
    '<form action="https://evil.test"><input name="q"></form>',
    '<object data="x"></object><embed src="x">',
    '<math><mi xlink:href="javascript:alert(1)">x</mi></math>',
    '<img src=x onerror=alert(1)//',
    "[x](endrefjavascript:alert(1))",
  ])("removes the attack in %s", (markdown) => {
    const html = render(markdown);
    // Escaped text (`&lt;img onerror=…`) is harmless; only real tags and attributes matter.
    expect(html).not.toMatch(/<(script|iframe|form|object|embed|svg|math)|<[^>]*\son\w+=|javascript:|vbscript:|data:text|style="background/i);
  });

  it("keeps footnote anchors and legitimate links", () => {
    const html = render("A claim.[\\[1\\]](endref1) See [Criterion](https://www.criterion.com/x) or <a href=\"mailto:a@b.c\">mail</a>.");
    expect(html).toContain('<a id="endref1" href="#endref1p"');
    expect(html).toContain('href="https://www.criterion.com/x"');
    expect(html).toContain('href="mailto:a@b.c"');
  });

  it("gives h2/h3 headings ids that match the table of contents", () => {
    const markdown = "## The Tramp\n\ntext\n\n### Early *years*\n\n## The Tramp\n\n<h2>سینمای ایران</h2>\n\n#### Not listed";
    expect(extractHeadings(markdown)).toEqual([
      { id: "the-tramp", text: "The Tramp", level: 2 },
      { id: "early-years", text: "Early years", level: 3 },
      { id: "the-tramp-2", text: "The Tramp", level: 2 },
      { id: "سینمای-ایران", text: "سینمای ایران", level: 2 },
    ]);
    const html = render(markdown);
    for (const id of ["the-tramp", "early-years", "the-tramp-2", "سینمای-ایران"]) expect(html).toContain(`id="${id}"`);
    expect(extractHeadings("No headings, just # text")).toEqual([]);
  });

  it("renders fenced code for Prism", () => {
    expect(render("```js\nlet a = 1;\n```")).toBe(
      '<pre class="line-numbers language-js"><code class="language-js">let a = 1;\n</code></pre>',
    );
  });
});
