"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Reports each public page view to /api/view without delaying the page (see lib/analytics.ts). */
export default function ViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const body = JSON.stringify({ path: pathname });
    // A string body is sent as text/plain, which needs no CORS preflight.
    if (navigator.sendBeacon?.("/api/view", body)) return;
    fetch("/api/view", { method: "POST", body, keepalive: true }).catch(() => {});
  }, [pathname]);

  return null;
}
