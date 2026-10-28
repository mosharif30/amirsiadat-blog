import type { Metadata } from "next";
import { site } from "./site";

type OpenGraph = NonNullable<Metadata["openGraph"]>;

/** The branded preview from app/opengraph-image.tsx, for pages without their own image. */
export const defaultOgImage = { url: "/opengraph-image", width: 1200, height: 630, alt: site.name };

/**
 * A page's `openGraph` replaces the root layout's instead of merging with it, so every page builds
 * it with the site-wide defaults.
 */
export const openGraph = (page: OpenGraph): OpenGraph =>
  ({ type: "website", siteName: site.name, locale: site.locale, images: [defaultOgImage], ...page }) as OpenGraph;
