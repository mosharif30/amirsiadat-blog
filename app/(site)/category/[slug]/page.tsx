import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import PageHeading from "@/components/PageHeading";
import Pagination from "@/components/Pagination";
import PostCard from "@/components/PostCard";
import Sidebar from "@/components/Sidebar";
import { pageNote } from "@/lib/format";
import { getCategory, getCategoryPosts } from "@/lib/posts";
import { openGraph } from "@/lib/metadata";
import { pageHref, parsePage } from "@/lib/pagination";
import { site } from "@/lib/site";
import { breadcrumbs } from "@/lib/structured-data";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const category = await getCategory((await params).slug);
  if (!category) return {};
  const page = parsePage((await searchParams).page) ?? 1;
  const title = page > 1 ? `${category.name} – Page ${page}` : category.name;
  const description = `${category.name} by ${site.author}.`;
  const url = pageHref(`/category/${category.slug}`, page);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: openGraph({ url, title, description }),
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const page = parsePage((await searchParams).page);
  const category = await getCategory(slug);
  if (!category || !page) notFound();
  const posts = await getCategoryPosts(slug, page);
  if (page > posts.pageCount) notFound();

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

        <div className="lg:col-span-9 xl:col-span-10 lg:ml-3 col-span-1 mt-4 lg:mt-0 px-3 sm:px-0">
          <PageHeading note={pageNote(posts)}>{category.name}</PageHeading>
          <div className="grid  lg:grid-cols-2 gap-6">
            {posts.items.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          <Pagination page={page} pageCount={posts.pageCount} basePath={`/category/${category.slug}`} />
        </div>
      </div>
    </div>
  );
}
