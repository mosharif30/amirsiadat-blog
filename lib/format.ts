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
