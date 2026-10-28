/**
 * Content-Security-Policy for HTML pages, applied per request by proxy.ts. Scripts need the
 * request's nonce (Next.js adds it to its own scripts); `'strict-dynamic'` lets those load chunks.
 * Styles stay `'unsafe-inline'`: post content and the editor use inline style attributes.
 */
export function pageCsp(nonce: string, { dev = false, https = false } = {}): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(https ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

/** For responses that never run scripts (API JSON, uploaded images). */
export const RESOURCE_CSP = "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; sandbox";
