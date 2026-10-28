import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { extractImageUrls } from "./content";
import { db } from "./db";
import { offsetFor, pageCountFor, POSTS_PER_PAGE, type Page } from "./pagination";
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
  readingMinutes: true,
  featuredImage: { select: { url: true, width: true, height: true } },
  categories: { select: { name: true, slug: true }, orderBy: { position: "asc" } },
} satisfies Prisma.PostSelect;

export type PostCardData = Prisma.PostGetPayload<{ select: typeof cardSelect }>;

export const getCategories = cache(() =>
  db.category.findMany({ select: { name: true, slug: true }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] }),
);

/** One page of visible posts matching `where`, newest first. */
async function listPosts(where: Prisma.PostWhereInput, page: number): Promise<Page<PostCardData>> {
  const [total, items] = await Promise.all([
    db.post.count({ where }),
    db.post.findMany({ where, select: cardSelect, orderBy: orderByNewest, skip: offsetFor(page), take: POSTS_PER_PAGE }),
  ]);
  return { items, page, pageCount: pageCountFor(total), total };
}

export function getPublishedPosts(page = 1): Promise<Page<PostCardData>> {
  return listPosts(visible(), page);
}

export const getCategory = cache((slug: string) =>
  db.category.findUnique({ where: { slug }, select: { name: true, slug: true } }),
);

export function getCategoryPosts(slug: string, page = 1): Promise<Page<PostCardData>> {
  return listPosts({ ...visible(), categories: { some: { slug } } }, page);
}

/** Ranking needs every match in memory, so search looks at this many of the newest matches. */
const SEARCH_LIMIT = 500;

/**
 * Full-text search across title, excerpt, content and category (case-insensitive for ASCII on
 * SQLite). Every term must match; results are ranked title > excerpt/category > body, then newest,
 * and returned a page at a time.
 */
export async function searchPosts(query: string, page = 1): Promise<Page<PostCardData>> {
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
    take: SEARCH_LIMIT,
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
  const ranked = posts.map((post) => ({ post, score: score(post) })).sort((a, b) => b.score - a.score);
  return {
    items: ranked.slice(offsetFor(page), offsetFor(page) + POSTS_PER_PAGE).map(({ post }) => post),
    page,
    pageCount: pageCountFor(ranked.length),
    total: ranked.length,
  };
}

export const getPostBySlug = cache(async (slug: string) => {
  const post = await db.post.findFirst({
    where: { ...visible(), slug },
    select: {
      ...cardSelect,
      content: true,
      createdAt: true,
      updatedAt: true,
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

/** The neighbours of a post in the site's newest-first order, for "older / newer" links under it. */
export async function getAdjacentPosts(post: { publishedAt: Date | null; createdAt: Date }) {
  if (!post.publishedAt) return { older: null, newer: null };
  const { publishedAt, createdAt } = post;
  const select = { slug: true, title: true } satisfies Prisma.PostSelect;
  const [older, newer] = await Promise.all([
    db.post.findFirst({
      where: {
        ...visible(),
        OR: [{ publishedAt: { lt: publishedAt } }, { publishedAt, createdAt: { lt: createdAt } }],
      },
      select,
      orderBy: orderByNewest,
    }),
    db.post.findFirst({
      where: {
        AND: [
          visible(),
          { OR: [{ publishedAt: { gt: publishedAt } }, { publishedAt, createdAt: { gt: createdAt } }] },
        ],
      },
      select,
      orderBy: [{ publishedAt: "asc" }, { createdAt: "asc" }],
    }),
  ]);
  return { older, newer };
}

/** Newest other posts in the same category. */
export function getRelatedPosts(post: { id: string; categorySlug?: string }, take = 2): Promise<PostCardData[]> {
  if (!post.categorySlug) return Promise.resolve([]);
  return db.post.findMany({
    where: { ...visible(), id: { not: post.id }, categories: { some: { slug: post.categorySlug } } },
    select: cardSelect,
    orderBy: orderByNewest,
    take,
  });
}

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
