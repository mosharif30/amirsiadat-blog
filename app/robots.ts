import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// SITE_URL is only known at runtime (Fly.io sets it, the Docker build doesn't).
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
