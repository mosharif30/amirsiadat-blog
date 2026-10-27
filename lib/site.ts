export const site = {
  name: "Amir Siadat",
  author: "Amir Siadat",
  description:
    "Articles and film reviews by Amir Siadat, film critic, journalist and curator of cinema from Iran.",
  locale: "en_US",
  url: (process.env.SITE_URL || "http://localhost:3000").replace(/\/+$/, ""),
  /** Time zone used when printing post dates. */
  timeZone: process.env.SITE_TIMEZONE || "UTC",
};

export const absoluteUrl = (pathname: string) =>
  /^https?:\/\//.test(pathname) ? pathname : `${site.url}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
