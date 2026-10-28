import Link from "next/link";
import { extractHeadings } from "@/lib/markdown/headings";
import type { PostDetailData } from "@/lib/posts";
import { absoluteUrl } from "@/lib/site";
import PostContent from "./PostContent";
import PostMeta from "./PostMeta";
import PrismScope from "./PrismScope";
import ShareLinks from "./ShareLinks";
import TableOfContents from "./TableOfContents";

type Neighbour = { slug: string; title: string } | null;

const PostDetail = ({ post, older, newer }: { post: PostDetailData; older: Neighbour; newer: Neighbour }) => {
  const category = post.categories[0];

  return (
    <article className="bg-white shadow-md mb-8">
      {post.featuredImage && (
        // eslint-disable-next-line @next/next/no-img-element -- plain <img> keeps the original layout
        <img
          src={post.featuredImage.url}
          alt={post.featuredImage.alt ?? ""}
          width={post.featuredImage.width ?? undefined}
          height={post.featuredImage.height ?? undefined}
          className="block h-auto w-full"
        />
      )}
      <PrismScope className="mx-auto max-w-3xl px-5 py-8 lg:px-8 lg:py-12">
        <header className="mb-8">
          {category && (
            <Link
              href={`/category/${category.slug}`}
              className="text-xs font-bold uppercase tracking-[0.15em] text-customBlue hover:underline"
            >
              {category.name}
            </Link>
          )}
          <h1 className="mt-3 mb-3 font-serif text-3xl font-semibold leading-tight lg:text-[2.5rem]">{post.title}</h1>
          <PostMeta post={post} />
        </header>

        <TableOfContents headings={extractHeadings(post.content)} />
        <div className="font-serif text-lg leading-relaxed text-gray-800 lg:text-[1.1875rem]">
          <PostContent markdown={post.content} images={post.images} />
        </div>
        <div className="mt-4 border-t border-gray-200">
          <ShareLinks url={absoluteUrl(`/post/${post.slug}`)} title={post.title} />
        </div>
      </PrismScope>

      {(older || newer) && (
        <nav aria-label="More posts" className="grid border-t border-gray-200 sm:grid-cols-2">
          {newer ? <NeighbourLink post={newer} label="← Newer" /> : <span />}
          {older && <NeighbourLink post={older} label="Older →" align="right" />}
        </nav>
      )}
    </article>
  );
};

const NeighbourLink = ({ post, label, align }: { post: { slug: string; title: string }; label: string; align?: "right" }) => (
  <Link
    href={`/post/${post.slug}`}
    className={`group block px-5 py-5 transition-colors hover:bg-gray-50 lg:px-8 ${align === "right" ? "sm:text-right" : ""}`}
  >
    <span className="block text-xs font-bold uppercase tracking-[0.15em] text-gray-500">{label}</span>
    <span className="mt-1 block font-serif text-lg leading-snug text-gray-900 group-hover:text-customBlue">{post.title}</span>
  </Link>
);

export default PostDetail;
