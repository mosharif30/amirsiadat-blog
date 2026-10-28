import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeading from "@/components/PageHeading";
import Pagination from "@/components/Pagination";
import PostCard from "@/components/PostCard";
import Sidebar from "@/components/Sidebar";
import { pageNote } from "@/lib/format";
import { parsePage } from "@/lib/pagination";
import { searchPosts } from "@/lib/posts";

type Props = { searchParams: Promise<{ searched?: string | string[]; page?: string | string[] }> };

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

export default async function SearchResult({ searchParams }: Props) {
  const { searched: raw, page: rawPage } = await searchParams;
  const query = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  const page = parsePage(rawPage);
  if (!page) notFound();
  const posts = await searchPosts(query, page);
  if (page > posts.pageCount) notFound();

  return (
    <>
      <div className="container mx-auto px-0 mb-2 ">
        <div className="grid  grid-cols-1 lg:grid-cols-12 gap-3">
          <Sidebar query={query} />

          <div className="lg:col-span-9 xl:col-span-10 lg:ml-3 col-span-1 mt-4 lg:mt-0 px-3 sm:px-0">
            <PageHeading note={pageNote(posts)}>Search: &ldquo;{query}&rdquo;</PageHeading>
            {posts.total === 0 ? (
              <p className="bg-white px-5 py-10 text-center font-serif text-lg text-gray-600 shadow-md">
                Nothing matched your search. Try fewer or different words, such as a film or director&rsquo;s name.
              </p>
            ) : (
              <>
                <div className="grid  lg:grid-cols-2 gap-6">
                  {posts.items.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
                <Pagination page={page} pageCount={posts.pageCount} basePath="/searchResult" params={{ searched: query }} />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
