import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { extractImageUrls } from "./content";
import { db } from "./db";
import type { ImageDimensions } from "@/components/PostContent";

/** Published and not scheduled for later. */
const visible = (): Prisma.PostWhereInput => ({ status: "PUBLISHED", publishedAt: { lte: new Date() } });

const orderByNewest = [{ publishedAt: "desc" }, { createdAt: "desc" }] satisfies Prisma.PostOrderByWithRelationInput[];

const cardSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  publishedAt: true,
  featuredImage: { select: { url: true, width: true, height: true } },
  categories: { select: { name: true, slug: true }, orderBy: { position: "asc" } },
} satisfies Prisma.PostSelect;

export type PostCardData = Prisma.PostGetPayload<{ select: typeof cardSelect }>;

export const getCategories = cache(() =>
  db.category.findMany({ select: { name: true, slug: true }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] }),
);

export function getPublishedPosts(): Promise<PostCardData[]> {
  return db.post.findMany({ where: visible(), select: cardSelect, orderBy: orderByNewest });
}

export const getCategory = cache((slug: string) =>
  db.category.findUnique({ where: { slug }, select: { name: true, slug: true } }),
);

export function getCategoryPosts(slug: string): Promise<PostCardData[]> {
  return db.post.findMany({
    where: { ...visible(), categories: { some: { slug } } },
    select: cardSelect,
    orderBy: orderByNewest,
  });
}

/**
 * Full-text search across title, excerpt, content and category (case-insensitive for ASCII on
 * SQLite). Every term must match; results are ranked title > excerpt/category > body, then newest.
 */
export async function searchPosts(query: string): Promise<PostCardData[]> {
  const terms = query.trim().slice(0, 100).split(/\s+/).filter(Boolean).slice(0, 8);
  const posts = await db.post.findMany({
    where: {
      ...visible(),
      AND: terms.map((term) => ({
        OR: [
          { title: { contains: term } },
          { excerpt: { contains: term } },
          { content: { contains: term } },
          { categories: { some: { name: { contains: term } } } },
        ],
      })),
    },
    select: cardSelect,
    orderBy: orderByNewest,
    take: 100,
  });

  const lowerTerms = terms.map((term) => term.toLowerCase());
  const score = (post: PostCardData) =>
    lowerTerms.reduce((sum, term) => {
      if (post.title.toLowerCase().includes(term)) return sum + 3;
      if (post.excerpt.toLowerCase().includes(term)) return sum + 2;
      if (post.categories.some((category) => category.name.toLowerCase().includes(term))) return sum + 2;
      return sum + 1;
    }, 0);
  // Array.prototype.sort is stable, so equal scores keep the newest-first order.
  return posts.map((post) => ({ post, score: score(post) })).sort((a, b) => b.score - a.score).map(({ post }) => post);
}

export const getPostBySlug = cache(async (slug: string) => {
  const post = await db.post.findFirst({
    where: { ...visible(), slug },
    select: {
      ...cardSelect,
      content: true,
      updatedAt: true,
      readingMinutes: true,
      wordCount: true,
      seoTitle: true,
      seoDescription: true,
      featuredImage: { select: { url: true, width: true, height: true, alt: true } },
      author: { select: { name: true } },
    },
  });
  if (!post) return null;
  return { ...post, images: await getImageDimensions(extractImageUrls(post.content)) };
});

export type PostDetailData = NonNullable<Awaited<ReturnType<typeof getPostBySlug>>>;

/** Intrinsic sizes of uploaded images referenced in a post, keyed by URL. */
export async function getImageDimensions(urls: string[]): Promise<ImageDimensions> {
  if (urls.length === 0) return {};
  const media = await db.media.findMany({
    where: { url: { in: urls } },
    select: { url: true, width: true, height: true },
  });
  return Object.fromEntries(media.map(({ url, width, height }) => [url, { width, height }]));
}

export function getSitemapEntries() {
  return Promise.all([
    db.post.findMany({ where: visible(), select: { slug: true, updatedAt: true }, orderBy: orderByNewest }),
    db.category.findMany({ select: { slug: true, updatedAt: true } }),
  ]);
}

export function getFeedPosts(limit = 50) {
  return db.post.findMany({
    where: visible(),
    select: {
      ...cardSelect,
      updatedAt: true,
      featuredImage: { select: { url: true, mimeType: true, size: true } },
    },
    orderBy: orderByNewest,
    take: limit,
  });
}
