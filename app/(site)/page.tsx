import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import PostCard from "@/components/PostCard";
import Sidebar from "@/components/Sidebar";
import { getPublishedPosts } from "@/lib/posts";
import { openGraph } from "@/lib/metadata";
import { site } from "@/lib/site";
import { person, website } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: { absolute: site.name },
  alternates: { canonical: "/" },
  openGraph: openGraph({ url: "/", title: site.name, description: site.description }),
};

export default async function Home() {
  const posts = await getPublishedPosts();

  return (
    <div className="container mx-auto px-0 mb-2 ">
      <JsonLd data={[website(), person()]} />
      <div className="grid  grid-cols-1 lg:grid-cols-12 gap-3">
        <Sidebar />
        <div className="grid  lg:grid-cols-2 lg:col-span-9 xl:col-span-10 lg:ml-3 col-span-1 gap-6 mt-8 lg:mt-0">
          {posts.map((post) => (
            <PostCard post={post} key={post.id} />
          ))}
        </div>
      </div>
    </div>
  );
}
