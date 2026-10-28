import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { defaultOgImage, openGraph } from "@/lib/metadata";
import { site } from "@/lib/site";
import "../styles/globals.scss";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.author }],
  icons: { icon: "/favicon.ico" },
  alternates: { types: { "application/rss+xml": [{ url: "/feed.xml", title: site.name }] } },
  openGraph: openGraph({}),
  twitter: { card: "summary_large_image", images: [defaultOgImage.url] },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// Every page is rendered per request so proxy.ts's CSP nonce reaches Next.js's inline scripts.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
