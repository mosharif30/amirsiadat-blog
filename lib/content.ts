import readingTime from "reading-time";

/** Strips Markdown/HTML syntax well enough for word counts and plain-text summaries. */
export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\\([\\`*_[\]{}()#+\-.!<>~|:&])/g, "$1")
    .replace(/[*_`#>~|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function readingStats(markdown: string) {
  const stats = readingTime(markdownToPlainText(markdown));
  return { minutes: Math.max(1, Math.ceil(stats.minutes)), words: stats.words };
}

/** URLs of images referenced with Markdown image syntax or <img> tags. */
export function extractImageUrls(markdown: string): string[] {
  const urls = new Set<string>();
  for (const match of markdown.matchAll(/!\[[^\]]*\]\(\s*<?([^\s)>]+)>?/g)) urls.add(match[1]);
  for (const match of markdown.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)) urls.add(match[1]);
  return [...urls];
}
