import { cookies } from "next/headers";
import { recordView } from "@/lib/analytics";
import { createLimiter } from "@/lib/auth/rate-limit";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/token";
import { clientIp, isCrossOrigin } from "@/lib/request";
import { isBot, parseTrackedPath, visitorKey } from "@/lib/tracking";

// Caps how many pages one address can add per hour (each row is one page per visitor per day).
const limiter = createLimiter({ windowMs: 60 * 60 * 1000, max: 120 });

const done = () => new Response(null, { status: 204 });

/** Page view beacon sent by components/ViewTracker.tsx. Always answers 204 to the browser. */
export async function POST(request: Request) {
  if (isCrossOrigin(request)) return new Response(null, { status: 403 });

  const userAgent = request.headers.get("user-agent") ?? "";
  if (isBot(userAgent)) return done();
  // The admin's own reading doesn't count.
  if (await verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value)) return done();

  const body = await request.text();
  if (body.length > 1000) return done();
  let path: unknown;
  try {
    path = (JSON.parse(body) as { path?: unknown }).path;
  } catch {
    return done();
  }
  const target = parseTrackedPath(path);
  if (!target) return done();

  const ip = clientIp(request.headers);
  if (limiter.isLimited(ip)) return done();
  limiter.record(ip);

  try {
    await recordView(target, visitorKey(ip, userAgent));
  } catch (error) {
    console.error("Failed to record page view", error);
  }
  return done();
}
