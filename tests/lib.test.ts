import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { extractImageUrls, readingStats } from "@/lib/content";
import { formatPostDate, pageNote } from "@/lib/format";
import { pageCountFor, pageHref, pageItems, parsePage } from "@/lib/pagination";
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

describe("pagination", () => {
  it.each([
    [undefined, 1],
    ["1", 1],
    ["12", 12],
    [["3", "4"], 3],
    ["0", null],
    ["-1", null],
    ["2.5", null],
    ["abc", null],
    ["007", null],
    ["", null],
    ["99999999", null],
  ])("parsePage(%j) -> %j", (input, expected) => {
    expect(parsePage(input)).toBe(expected);
  });

  it("counts pages, with one page for an empty listing", () => {
    expect([0, 1, 12, 13, 24, 25].map((total) => pageCountFor(total))).toEqual([1, 1, 1, 2, 2, 3]);
  });

  it.each([
    [1, 1, [1]],
    [1, 3, [1, 2, 3]],
    [1, 20, [1, 2, "gap", 20]],
    [3, 20, [1, 2, 3, 4, "gap", 20]],
    [4, 20, [1, 2, 3, 4, 5, "gap", 20]],
    [10, 20, [1, "gap", 9, 10, 11, "gap", 20]],
    [20, 20, [1, "gap", 19, 20]],
    [5, 7, [1, "gap", 4, 5, 6, 7]],
  ])("page %i of %i -> %j", (page, pageCount, expected) => {
    expect(pageItems(page, pageCount)).toEqual(expected);
  });

  it("builds page links, keeping other parameters and leaving page 1 bare", () => {
    expect(pageHref("/", 1)).toBe("/");
    expect(pageHref("/", 2)).toBe("/?page=2");
    expect(pageHref("/searchResult", 3, { searched: "Kiarostami & co" })).toBe(
      "/searchResult?searched=Kiarostami+%26+co&page=3",
    );
    expect(pageHref("/searchResult", 1, { searched: "x" })).toBe("/searchResult?searched=x");
  });

  it("describes a listing", () => {
    expect(pageNote({ total: 1, page: 1, pageCount: 1 })).toBe("1 post");
    expect(pageNote({ total: 30, page: 2, pageCount: 3 })).toBe("30 posts · Page 2 of 3");
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
