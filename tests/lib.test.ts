import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { extractImageUrls, readingStats } from "@/lib/content";
import { formatPostDate } from "@/lib/format";
import { SLUG_PATTERN, slugify } from "@/lib/slug";

describe("slugify", () => {
  it.each([
    ["Stan & Ollie (Jon S. Baird)", "stan-ollie-jon-s-baird"],
    ["  François Truffaut’s  The Last Metro ", "francois-truffauts-the-last-metro"],
    ["سینمای ایران", "سینمای-ایران"],
    ["---", ""],
  ])("%s -> %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
    if (expected) expect(SLUG_PATTERN.test(expected)).toBe(true);
  });
});

describe("formatPostDate", () => {
  it("matches moment's MMM DD, YYYY", () => {
    expect(formatPostDate(new Date("2022-07-05T10:00:00Z"))).toBe("Jul 05, 2022");
  });
});

describe("content helpers", () => {
  it("computes reading time from plain text", () => {
    const stats = readingStats(`# Title\n\n${"word ".repeat(450)}\n\n![](/a.jpg)`);
    expect(stats.words).toBe(451);
    expect(stats.minutes).toBe(3);
  });

  it("finds Markdown and HTML images", () => {
    expect(extractImageUrls('![a](/x.jpg "t")\n<img src="/y.png">')).toEqual(["/x.jpg", "/y.png"]);
  });
});

describe("passwords", () => {
  it("hashes and verifies", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash).toMatch(/^scrypt\$/);
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});
