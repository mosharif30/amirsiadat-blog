import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PostEditor from "@/components/admin/PostEditor";
import { getEditorData } from "@/lib/admin-data";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Edit post" };

export default async function EditPostPage({ params }: PageProps<"/admin/posts/[id]">) {
  const { id } = await params;
  const [post, { categories, media }] = await Promise.all([
    db.post.findUnique({ where: { id }, include: { categories: { select: { id: true } } } }),
    getEditorData(),
  ]);
  if (!post) notFound();

  return (
    <PostEditor
      key={post.id}
      categories={categories}
      media={media}
      post={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        status: post.status,
        publishedAt: post.publishedAt?.toISOString() ?? null,
        featured: post.featured,
        categoryIds: post.categories.map((category) => category.id),
        featuredImageId: post.featuredImageId,
        seoTitle: post.seoTitle ?? "",
        seoDescription: post.seoDescription ?? "",
      }}
    />
  );
}
