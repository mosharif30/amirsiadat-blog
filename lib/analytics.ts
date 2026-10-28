import { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import type { TrackedPath } from "./tracking";

// Page view storage and dashboard queries; lib/tracking.ts decides what counts as a view.

/** Records a view of an existing public page. Returns false when the page doesn't exist. */
export async function recordView(target: TrackedPath, visitor: string): Promise<boolean> {
  let postId: string | null = null;
  if (target.kind === "post") {
    const post = await db.post.findFirst({
      where: { slug: target.slug, status: "PUBLISHED", publishedAt: { lte: new Date() } },
      select: { id: true },
    });
    if (!post) return false;
    postId = post.id;
  } else if (target.kind === "category") {
    if (!(await db.category.findUnique({ where: { slug: target.slug }, select: { id: true } }))) return false;
  }

  try {
    await db.pageView.create({ data: { path: target.path, postId, visitor } });
  } catch (error) {
    // Already counted today.
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
  }
  return true;
}

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

/** Headline numbers and the most-read posts for the dashboard. */
export async function getViewStats(topLimit = 5) {
  const since = daysAgo(30);
  const [allTime, last30Days, top] = await Promise.all([
    db.pageView.count(),
    db.pageView.count({ where: { createdAt: { gte: since } } }),
    db.pageView.groupBy({
      by: ["postId"],
      where: { postId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { postId: "desc" } },
      take: topLimit,
    }),
  ]);

  const ids = top.map((row) => row.postId!);
  const [posts, recent] = await Promise.all([
    db.post.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, slug: true } }),
    db.pageView.groupBy({
      by: ["postId"],
      where: { postId: { in: ids }, createdAt: { gte: since } },
      _count: { _all: true },
    }),
  ]);
  const byId = new Map(posts.map((post) => [post.id, post]));
  const recentById = new Map(recent.map((row) => [row.postId, row._count._all]));

  return {
    allTime,
    last30Days,
    topPosts: top.flatMap((row) => {
      const post = byId.get(row.postId!);
      return post ? [{ ...post, views: row._count._all, last30Days: recentById.get(row.postId) ?? 0 }] : [];
    }),
  };
}

/** All-time views per post id. */
export async function getPostViewCounts(): Promise<Map<string, number>> {
  const rows = await db.pageView.groupBy({ by: ["postId"], where: { postId: { not: null } }, _count: { _all: true } });
  return new Map(rows.map((row) => [row.postId!, row._count._all]));
}
