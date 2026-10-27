import type { Metadata } from "next";
import PostCard from "@/components/PostCard";
import Sidebar from "@/components/Sidebar";
import { searchPosts } from "@/lib/posts";

type Props = { searchParams: Promise<{ searched?: string | string[] }> };

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

export default async function SearchResult({ searchParams }: Props) {
  const raw = (await searchParams).searched;
  const query = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  const posts = await searchPosts(query);

  return (
    <>
      <div className="container mx-auto px-0 mb-2 ">
        <div className="grid  grid-cols-1 lg:grid-cols-12 gap-3">
          <Sidebar />

          <div className="grid   lg:col-span-9 xl:col-span-10 col-span-1 ">
            <div className="bg-customBlue text-white p-5 text-2xl my-auto">searchin for &quot;{query}&quot;</div>
            <div className="grid  lg:grid-cols-2  mt-2 gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
