import { formatPostDate } from "@/lib/format";

type PostMetaProps = {
  post: { publishedAt: Date | null; readingMinutes: number };
  className?: string;
};

/** "Aug 24, 2025 · 6 min read" */
const PostMeta = ({ post, className = "" }: PostMetaProps) => (
  <p className={`text-sm text-gray-500 ${className}`}>
    {post.publishedAt && (
      <>
        <time dateTime={post.publishedAt.toISOString()}>{formatPostDate(post.publishedAt)}</time>
        <span aria-hidden="true" className="mx-2">
          ·
        </span>
      </>
    )}
    {post.readingMinutes} min read
  </p>
);

export default PostMeta;
