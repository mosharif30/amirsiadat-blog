/**
 * The visitor's IP address. Fly.io sets `Fly-Client-IP` itself; `X-Forwarded-For` can be supplied
 * by the client, so it's only a fallback for other hosts.
 */
export function clientIp(headers: Headers): string {
  return (
    headers.get("fly-client-ip")?.trim() || headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
  );
}

/**
 * Route handlers don't get the Server Action origin check, so state-changing ones call this.
 * Browsers always send `Origin` on cross-site POSTs; an opaque ("null") origin is rejected too.
 */
export function isCrossOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host !== request.headers.get("host");
  } catch {
    return true;
  }
}
