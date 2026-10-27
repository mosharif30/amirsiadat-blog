import type { Metadata } from "next";
import CategoryManager from "@/components/admin/CategoryManager";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    select: { id: true, name: true, slug: true, _count: { select: { posts: true } } },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-semibold">Categories</h1>
      <p className="mb-6 text-sm text-slate-500">Shown in this order in the sidebar of the site.</p>
      <CategoryManager
        categories={categories.map(({ _count, ...category }) => ({ ...category, posts: _count.posts }))}
      />
    </div>
  );
}
