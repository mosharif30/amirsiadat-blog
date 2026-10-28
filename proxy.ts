import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/token";
import { pageCsp } from "@/lib/csp";

const isAdminPath = (pathname: string) => pathname === "/admin" || pathname.startsWith("/admin/");

/**
 * Runs before every page:
 * - gives the response a Content-Security-Policy with a fresh script nonce (pages are rendered
 *   per request, so Next.js can add the nonce to its scripts),
 * - optimistically guards the admin area: requests without a valid session token go to the login
 *   page. Every admin page, server action and API route still verifies the session in the database.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isAdminPath(pathname) && pathname !== "/admin/login") {
    const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
    if (!session) {
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("next", pathname + search);
      return NextResponse.redirect(login);
    }
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = pageCsp(nonce, {
    dev: process.env.NODE_ENV === "development",
    https: (process.env.SITE_URL ?? "").startsWith("https://") && process.env.INSECURE_COOKIES !== "true",
  });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // API routes check the session themselves (and the proxy would buffer upload bodies);
      // static files and uploads get a fixed CSP from next.config.ts.
      source: "/((?!api/|_next/static|_next/image|uploads/|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
