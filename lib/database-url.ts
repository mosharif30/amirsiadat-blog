import { mkdirSync } from "node:fs";
import path from "node:path";

/**
 * Resolves a relative SQLite `file:` URL against the working directory so the Prisma CLI,
 * the Next.js server and scripts all point at the same file, and makes sure its folder exists.
 * Non-SQLite URLs are returned unchanged.
 */
export function resolveDatabaseUrl(url: string | undefined = process.env.DATABASE_URL): string {
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env and adjust it.");
  if (!url.startsWith("file:")) return url;

  const file = url.slice("file:".length);
  const absolute = path.isAbsolute(file) ? file : path.resolve(/* turbopackIgnore: true */ process.cwd(), file);
  mkdirSync(path.dirname(absolute), { recursive: true });
  return `file:${absolute}`;
}
