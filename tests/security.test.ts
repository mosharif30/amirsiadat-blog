import { describe, expect, it } from "vitest";
import { createLimiter } from "@/lib/auth/rate-limit";
import { pageCsp } from "@/lib/csp";
import { clientIp, isCrossOrigin } from "@/lib/request";
import { isBot, parseTrackedPath, visitorKey } from "@/lib/tracking";

describe("pageCsp", () => {
  it("only allows scripts carrying the nonce", () => {
    const csp = pageCsp("abc123");
    const scripts = csp.split("; ").find((directive) => directive.startsWith("script-src"));
    expect(scripts).toBe("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });

  it("adds eval for development and upgrades requests over https", () => {
    expect(pageCsp("n", { dev: true })).toContain("'unsafe-eval'");
    expect(pageCsp("n", { https: true })).toContain("upgrade-insecure-requests");
  });
});

describe("request helpers", () => {
  const post = (headers: Record<string, string>) => new Request("http://blog.test/api/x", { method: "POST", headers });

  it("prefers the IP set by Fly.io over X-Forwarded-For", () => {
    expect(clientIp(new Headers({ "fly-client-ip": "1.1.1.1", "x-forwarded-for": "6.6.6.6" }))).toBe("1.1.1.1");
    expect(clientIp(new Headers({ "x-forwarded-for": "2.2.2.2, 3.3.3.3" }))).toBe("2.2.2.2");
    expect(clientIp(new Headers())).toBe("local");
  });

  it("rejects cross-origin and opaque origins", () => {
    expect(isCrossOrigin(post({ host: "blog.test", origin: "http://blog.test" }))).toBe(false);
    expect(isCrossOrigin(post({ host: "blog.test" }))).toBe(false);
    expect(isCrossOrigin(post({ host: "blog.test", origin: "https://evil.test" }))).toBe(true);
    expect(isCrossOrigin(post({ host: "blog.test", origin: "null" }))).toBe(true);
  });
});

describe("createLimiter", () => {
  it("limits after max hits", () => {
    const limiter = createLimiter({ windowMs: 60_000, max: 2 });
    limiter.record("a");
    expect(limiter.isLimited("a")).toBe(false);
    limiter.record("a");
    expect(limiter.isLimited("a")).toBe(true);
    expect(limiter.isLimited("b")).toBe(false);
    limiter.clear("a");
    expect(limiter.isLimited("a")).toBe(false);
  });
});

describe("page view helpers", () => {
  it.each([
    ["/", { kind: "page", path: "/" }],
    ["/about/", { kind: "page", path: "/about" }],
    ["/post/stan-ollie", { kind: "post", path: "/post/stan-ollie", slug: "stan-ollie" }],
    ["/category/%D8%B3%DB%8C%D9%86%D9%85%D8%A7", { kind: "category", path: "/category/سینما", slug: "سینما" }],
  ])("tracks %s", (path, expected) => {
    expect(parseTrackedPath(path)).toEqual(expected);
  });

  it.each(["/admin", "/searchResult", "/post/", "/post/a/b", "/post/Bad_Slug", "/post/%E0%A4%A", 42, "x".repeat(400)])(
    "ignores %s",
    (path) => {
      expect(parseTrackedPath(path)).toBeNull();
    },
  );

  it("recognizes bots and empty user agents", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true);
    expect(isBot("curl/8.5.0")).toBe(true);
    expect(isBot("")).toBe(true);
    expect(isBot("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Safari/605.1.15")).toBe(false);
  });

  it("derives a visitor key that doesn't contain the IP and changes daily", () => {
    const day = new Date("2026-10-28T10:00:00Z");
    const key = visitorKey("203.0.113.9", "UA", day);
    expect(key).toHaveLength(22);
    expect(key).not.toContain("203");
    expect(visitorKey("203.0.113.9", "UA", new Date("2026-10-28T23:59:00Z"))).toBe(key);
    expect(visitorKey("203.0.113.9", "UA", new Date("2026-10-29T00:00:00Z"))).not.toBe(key);
    expect(visitorKey("203.0.113.10", "UA", day)).not.toBe(key);
  });
});
