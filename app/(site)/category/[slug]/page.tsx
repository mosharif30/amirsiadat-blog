import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import PostCard from "@/components/PostCard";
import Sidebar from "@/components/Sidebar";
import { getCategory, getCategoryPosts } from "@/lib/posts";
import { openGraph } from "@/lib/metadata";
import { site } from "@/lib/site";
import { breadcrumbs } from "@/lib/structured-data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategory((await params).slug);
  if (!category) return {};
  const description = `${category.name} by ${site.author}.`;
  return {
    title: category.name,
    description,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: openGraph({ url: `/category/${category.slug}`, title: category.name, description }),
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  const posts = await getCategoryPosts(slug);

  return (
    <div className="container mx-auto px-0 mb-2 ">
      <JsonLd
        data={[
          breadcrumbs([
            { name: site.name, path: "/" },
            { name: category.name, path: `/category/${category.slug}` },
          ]),
        ]}
      />
      <div className="grid  grid-cols-1 lg:grid-cols-12 gap-3">
        <Sidebar place={slug} />

        <div className="grid   lg:col-span-9 xl:col-span-10 col-span-1 ">
          <div className="bg-customBlue text-white p-5 text-2xl my-auto">{slug.toUpperCase()}</div>
          <div className="grid  lg:grid-cols-2  mt-2 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
