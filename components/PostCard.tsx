import Link from "next/link";
import type { PostCardData } from "@/lib/posts";
import PostMeta from "./PostMeta";

const PostCard = ({ post }: { post: PostCardData }) => {
  return (
    <Link
      href={`/post/${post.slug}`}
      className="group flex flex-col bg-white shadow-md transition-shadow duration-300 hover:shadow-xl"
    >
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        {post.featuredImage && (
          // eslint-disable-next-line @next/next/no-img-element -- plain <img> keeps the original layout
          <img
            src={post.featuredImage.url}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 lg:p-6">
        {post.categories[0] && (
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-customBlue">{post.categories[0].name}</p>
        )}
        <h2 className="mt-2 font-serif text-2xl font-semibold leading-snug text-gray-900 transition-colors group-hover:text-customBlue">
          {post.title}
        </h2>
        <PostMeta post={post} className="mt-2" />
        <p className="mt-4 line-clamp-5 font-serif text-[1.0625rem] leading-relaxed text-gray-700">{post.excerpt}</p>
        <span className="mt-auto pt-4 text-sm font-medium text-gray-500 transition-colors group-hover:text-customBlue">
          Continue reading <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
};

export default PostCard;
