import Link from "next/link";
import { pageHref, pageItems } from "@/lib/pagination";

type PaginationProps = {
  page: number;
  pageCount: number;
  /** Listing path without query, e.g. "/" or "/category/reviews". */
  basePath: string;
  /** Other query parameters to keep on every link (the search terms). */
  params?: Record<string, string>;
};

const box = "flex h-10 min-w-10 items-center justify-center px-3 text-sm font-bold transition-colors";
const step = "flex h-10 items-center gap-2 px-3 text-sm font-bold uppercase tracking-wider transition-colors";

/** Page links under a post listing: "← Newer  1 … 4 5 6 … 20  Older →" (newest posts come first). */
export default function Pagination({ page, pageCount, basePath, params }: PaginationProps) {
  if (pageCount <= 1) return null;
  const href = (n: number) => pageHref(basePath, n, params);

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-between gap-2 border-t border-gray-200 pt-6">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={`${step} text-customBlue hover:bg-gray-100`}>
          <span aria-hidden="true">←</span> Newer
        </Link>
      ) : (
        <span aria-hidden="true" className={`${step} text-gray-300`}>
          ← Newer
        </span>
      )}

      <ol className="hidden items-center gap-1 sm:flex">
        {pageItems(page, pageCount).map((item, index) =>
          item === "gap" ? (
            <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-gray-400">
              …
            </li>
          ) : (
            <li key={item}>
              {item === page ? (
                <span aria-current="page" className={`${box} bg-customBlue text-white`}>
                  {item}
                </span>
              ) : (
                <Link
                  href={href(item)}
                  aria-label={`Page ${item}`}
                  className={`${box} text-gray-600 hover:bg-gray-100 hover:text-customBlue`}
                >
                  {item}
                </Link>
              )}
            </li>
          ),
        )}
      </ol>
      <p className="text-sm text-gray-500 sm:hidden">
        Page {page} of {pageCount}
      </p>

      {page < pageCount ? (
        <Link href={href(page + 1)} rel="next" className={`${step} text-customBlue hover:bg-gray-100`}>
          Older <span aria-hidden="true">→</span>
        </Link>
      ) : (
        <span aria-hidden="true" className={`${step} text-gray-300`}>
          Older →
        </span>
      )}
    </nav>
  );
}
