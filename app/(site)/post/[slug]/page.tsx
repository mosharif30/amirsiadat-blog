import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import PostCard from "@/components/PostCard";
import PostDetail from "@/components/PostDetail";
import ReadingProgress from "@/components/ReadingProgress";
import Sidebar from "@/components/Sidebar";
import { defaultOgImage, openGraph } from "@/lib/metadata";
import { getAdjacentPosts, getPostBySlug, getRelatedPosts } from "@/lib/posts";
import { site } from "@/lib/site";
import { blogPosting, breadcrumbs } from "@/lib/structured-data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug((await params).slug);
  if (!post) return {};

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const url = `/post/${post.slug}`;
  const image = post.featuredImage
    ? {
        url: post.featuredImage.url,
        width: post.featuredImage.width ?? undefined,
        height: post.featuredImage.height ?? undefined,
        alt: post.featuredImage.alt || post.title,
      }
    : defaultOgImage;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: openGraph({
      type: "article",
      url,
      title,
      description,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author?.name ?? site.author],
      section: post.categories[0]?.name,
      images: [image],
    }),
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
    other: { "twitter:label1": "Reading time", "twitter:data1": `${post.readingMinutes} min read` },
  };
}

export default async function PostPage({ params }: Props) {
  const post = await getPostBySlug((await params).slug);
  if (!post) notFound();

  const category = post.categories[0];
  const [{ older, newer }, related] = await Promise.all([
    getAdjacentPosts(post),
    getRelatedPosts({ id: post.id, categorySlug: category?.slug }),
  ]);
  const structuredData = [
    blogPosting({
      title: post.title,
      excerpt: post.excerpt,
      slug: post.slug,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      wordCount: post.wordCount,
      readingMinutes: post.readingMinutes,
      image: post.featuredImage?.url ?? "/opengraph-image",
      authorName: post.author?.name,
      section: category?.name,
    }),
    breadcrumbs([
      { name: site.name, path: "/" },
      ...(category ? [{ name: category.name, path: `/category/${category.slug}` }] : []),
      { name: post.title, path: `/post/${post.slug}` },
    ]),
  ];

  return (
    <>
      <JsonLd data={structuredData} />
      <ReadingProgress />
      <div className="container mx-auto px-0 mb-2 ">
        <div className="grid  grid-cols-1 lg:grid-cols-12 gap-3 ">
          <Sidebar place={category?.slug} />
          <div className="col-span-1 lg:col-span-9 xl:col-span-10 lg:ml-3 mt-4 lg:mt-0 px-3 sm:px-0">
            <PostDetail post={post} older={older} newer={newer} />
            {related.length > 0 && (
              <section aria-labelledby="related-heading">
                <h2 id="related-heading" className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-gray-500">
                  More in {category.name}
                </h2>
                <div className="grid lg:grid-cols-2 gap-6">
                  {related.map((relatedPost) => (
                    <PostCard key={relatedPost.id} post={relatedPost} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
