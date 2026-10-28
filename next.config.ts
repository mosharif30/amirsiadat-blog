import type { NextConfig } from "next";
import { RESOURCE_CSP } from "./lib/csp";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000" }]
    : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["better-sqlite3"],
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Pages get a nonce-based CSP from proxy.ts; these responses never need to run anything.
      { source: "/api/:path*", headers: [{ key: "Content-Security-Policy", value: RESOURCE_CSP }] },
      { source: "/uploads/:path*", headers: [{ key: "Content-Security-Policy", value: RESOURCE_CSP }] },
    ];
  },
};

export default nextConfig;
