import type { Metadata } from "next";
import PostEditor from "@/components/admin/PostEditor";
import { getEditorData } from "@/lib/admin-data";

export const metadata: Metadata = { title: "New post" };

export default async function NewPostPage() {
  const { categories, media } = await getEditorData();
  return (
    <PostEditor
      categories={categories}
      media={media}
      post={{
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        status: "DRAFT",
        publishedAt: null,
        featured: false,
        categoryIds: [],
        featuredImageId: null,
        seoTitle: "",
        seoDescription: "",
      }}
    />
  );
}
