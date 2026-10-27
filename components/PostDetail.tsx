import { formatPostDate } from "@/lib/format";
import type { PostDetailData } from "@/lib/posts";
import PostContent from "./PostContent";
import PrismScope from "./PrismScope";

const PostDetail = ({ post }: { post: PostDetailData }) => {
  return (
    <div>
      <div className="bg-white shadow-lg  lg:p-8 pb-12 mb-8">
        <div className="relative overflow-hidden shadow-md mb-6">
          {post.featuredImage && (
            // eslint-disable-next-line @next/next/no-img-element -- plain <img> keeps the original layout
            <img
              src={post.featuredImage.url}
              alt={post.featuredImage.alt ?? ""}
              className="object-top h-full w-full object-cover  shadow-lg -t-lg lg:"
            />
          )}
        </div>
        <PrismScope className="px-5 lg:px-2 text-base  ">
          <div className="flex items-center mb-8 w-full">
            <div className="font-medium text-gray-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 inline mr-2 text-gray-900"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="align-middle">{post.publishedAt && formatPostDate(post.publishedAt)}</span>
            </div>
          </div>
          <h1 className="mb-8 text-3xl font-semibold">{post.title}</h1>

          <PostContent markdown={post.content} images={post.images} />
        </PrismScope>
      </div>
    </div>
  );
};

export default PostDetail;
