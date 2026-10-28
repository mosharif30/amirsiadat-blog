import { site } from "./site";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
  timeZone: site.timeZone,
});

/** Formats a date as "MMM DD, YYYY" (e.g. "Jul 05, 2022"), the format the site has always used. */
export function formatPostDate(date: Date | string): string {
  const parts = Object.fromEntries(
    dateFormatter.formatToParts(new Date(date)).map((part) => [part.type, part.value]),
  );
  return `${parts.month} ${parts.day}, ${parts.year}`;
}

/** "1 post", "12 posts" */
export const postCount = (count: number) => `${count} ${count === 1 ? "post" : "posts"}`;

/** Heading note for a listing: "15 posts", or "15 posts · Page 2 of 2" once there are several pages. */
export const pageNote = ({ total, page, pageCount }: { total: number; page: number; pageCount: number }) =>
  pageCount > 1 ? `${postCount(total)} · Page ${page} of ${pageCount}` : postCount(total);
