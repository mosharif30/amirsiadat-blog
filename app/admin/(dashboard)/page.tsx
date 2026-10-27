import type { Metadata } from "next";
import Link from "next/link";
import PostsTable from "@/components/admin/PostsTable";
import { cx, ui } from "@/components/admin/ui";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Posts" };

export default async function PostsPage() {
  const posts = await db.post.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      readingMinutes: true,
      featuredImage: { select: { url: true } },
      categories: { select: { name: true }, orderBy: { position: "asc" } },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  const rows = posts.map((post) => ({
    ...post,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    updatedAt: post.updatedAt.toISOString(),
    categories: post.categories.map((category) => category.name),
    cover: post.featuredImage?.url ?? null,
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Posts</h1>
          <p className="text-sm text-slate-500">
            {rows.filter((post) => post.status === "PUBLISHED").length} published ·{" "}
            {rows.filter((post) => post.status === "DRAFT").length} drafts
          </p>
        </div>
        <Link href="/admin/posts/new" className={cx(ui.button, ui.primary)}>
          New post
        </Link>
      </div>
      <PostsTable posts={rows} />
    </div>
  );
}
