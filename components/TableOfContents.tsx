import type { Heading } from "@/lib/markdown/headings";

/** Collapsible outline for long posts with at least three h2/h3 sections. */
export default function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length < 3) return null;

  return (
    <details className="mb-8 text-gray-700">
      <summary className="cursor-pointer select-none font-medium transition-colors hover:text-gray-900">Contents</summary>
      <ol className="mt-3 space-y-2 border-l border-gray-200 pl-4">
        {headings.map((heading) => (
          <li key={heading.id} className={heading.level === 3 ? "pl-4" : undefined}>
            <a href={`#${heading.id}`} className="text-gray-600 transition-colors hover:text-gray-900">
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}
