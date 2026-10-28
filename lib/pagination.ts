/** Posts per listing page: an even number so the two-column grid always ends on a full row. */
export const POSTS_PER_PAGE = 12;

export type Page<T> = { items: T[]; page: number; pageCount: number; total: number };

/**
 * `?page=` → page number. Missing means page 1; anything that isn't a plain positive integer
 * (`0`, `-1`, `2.5`, `abc`, `007`) is `null` so the page can answer 404 instead of guessing.
 */
export function parsePage(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === undefined) return 1;
  if (!/^[1-9]\d{0,5}$/.test(value)) return null;
  return Number(value);
}

export const pageCountFor = (total: number, perPage = POSTS_PER_PAGE) => Math.max(1, Math.ceil(total / perPage));

/** Number of rows to skip for a page. */
export const offsetFor = (page: number, perPage = POSTS_PER_PAGE) => (page - 1) * perPage;

/**
 * The page links to show: always the first and last page and the current page with one
 * neighbour on each side, with "gap" where pages are left out, e.g. 1 … 4 5 6 … 20.
 * A gap never hides a single page (1 2 3 is shown rather than 1 … 3).
 */
export function pageItems(page: number, pageCount: number): (number | "gap")[] {
  const shown = new Set([1, pageCount, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pageCount));
  const sorted = [...shown].sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  for (const n of sorted) {
    const previous = items.at(-1);
    if (typeof previous === "number" && n - previous === 2) items.push(previous + 1);
    else if (typeof previous === "number" && n - previous > 2) items.push("gap");
    items.push(n);
  }
  return items;
}

/** `/category/x` + page 3 (+ other query params) → `/category/x?page=3`; page 1 has no parameter. */
export function pageHref(basePath: string, page: number, params: Record<string, string> = {}): string {
  const query = new URLSearchParams(params);
  if (page > 1) query.set("page", String(page));
  const search = query.toString();
  return search ? `${basePath}?${search}` : basePath;
}
