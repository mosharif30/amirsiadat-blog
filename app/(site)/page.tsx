import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import PageHeading from "@/components/PageHeading";
import Pagination from "@/components/Pagination";
import PostCard from "@/components/PostCard";
import Sidebar from "@/components/Sidebar";
import { getPublishedPosts } from "@/lib/posts";
import { openGraph } from "@/lib/metadata";
import { pageHref, parsePage } from "@/lib/pagination";
import { site } from "@/lib/site";
import { person, website } from "@/lib/structured-data";

type Props = { searchParams: Promise<{ page?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = parsePage((await searchParams).page) ?? 1;
  const url = pageHref("/", page);
  const title = page > 1 ? `Page ${page} | ${site.name}` : site.name;
  return {
    title: { absolute: title },
    alternates: { canonical: url },
    openGraph: openGraph({ url, title, description: site.description }),
  };
}

export default async function Home({ searchParams }: Props) {
  const page = parsePage((await searchParams).page);
  if (!page) notFound();
  const posts = await getPublishedPosts(page);
  if (page > posts.pageCount) notFound();

  return (
    <div className="container mx-auto px-0 mb-2 ">
      <JsonLd data={[website(), person()]} />
      <div className="grid  grid-cols-1 lg:grid-cols-12 gap-3">
        <Sidebar />
        <div className="lg:col-span-9 xl:col-span-10 lg:ml-3 col-span-1 mt-4 lg:mt-0 px-3 sm:px-0">
          {page > 1 && (
            <PageHeading note={`Page ${page} of ${posts.pageCount}`}>All posts</PageHeading>
          )}
          <div className="grid  lg:grid-cols-2 gap-6">
            {posts.items.map((post) => (
              <PostCard post={post} key={post.id} />
            ))}
          </div>
          <Pagination page={page} pageCount={posts.pageCount} basePath="/" />
        </div>
      </div>
    </div>
  );
}
