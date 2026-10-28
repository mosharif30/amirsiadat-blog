import { createHmac } from "node:crypto";
import { SLUG_PATTERN } from "./slug";

/**
 * Self-hosted, cookie-free page view counting.
 *
 * A view is recorded at most once per page, per visitor, per day. The visitor key is an HMAC of
 * the day, IP address and user agent (keyed with AUTH_SECRET), so no IP is stored and the same
 * person can't be linked across days.
 */

const BOT_PATTERN =
  /bot|crawl|spider|slurp|archiver|facebookexternalhit|embedly|preview|headless|lighthouse|pagespeed|pingdom|uptime|monitor|curl|wget|python|httpclient|okhttp|java\/|go-http|node-fetch|axios|scrapy/i;

export const isBot = (userAgent: string) => !userAgent || BOT_PATTERN.test(userAgent);

export type TrackedPath =
  | { kind: "page"; path: string }
  | { kind: "post"; path: string; slug: string }
  | { kind: "category"; path: string; slug: string };

const STATIC_PAGES = new Set(["/", "/about", "/curriculum-vitae"]);

/** Parses a pathname sent by the browser; only public pages are counted. */
export function parseTrackedPath(raw: unknown): TrackedPath | null {
  if (typeof raw !== "string" || raw.length > 300) return null;
  let path: string;
  try {
    path = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (path.length > 1) path = path.replace(/\/+$/, "");
  if (STATIC_PAGES.has(path)) return { kind: "page", path };

  const match = /^\/(post|category)\/([^/]+)$/.exec(path);
  if (!match || !SLUG_PATTERN.test(match[2]!)) return null;
  return { kind: match[1] as "post" | "category", path, slug: match[2]! };
}

export function visitorKey(ip: string, userAgent: string, now = new Date()): string {
  const day = now.toISOString().slice(0, 10);
  return createHmac("sha256", `page-views:${process.env.AUTH_SECRET ?? ""}`)
    .update(`${day}|${ip}|${userAgent}`)
    .digest("base64url")
    .slice(0, 22);
}
