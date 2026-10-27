import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PostDetail from "@/components/PostDetail";
import Sidebar from "@/components/Sidebar";
import { getPostBySlug } from "@/lib/posts";
import { absoluteUrl, site } from "@/lib/site";

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
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author?.name ?? site.author],
      section: post.categories[0]?.name,
      images: image ? [image] : undefined,
    },
    twitter: { card: "summary_large_image", title, description, images: image ? [image.url] : undefined },
    other: { "twitter:label1": "Reading time", "twitter:data1": `${post.readingMinutes} min read` },
  };
}

export default async function PostPage({ params }: Props) {
  const post = await getPostBySlug((await params).slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage ? [absoluteUrl(post.featuredImage.url)] : undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: post.author?.name ?? site.author },
    articleSection: post.categories[0]?.name,
    wordCount: post.wordCount,
    timeRequired: `PT${post.readingMinutes}M`,
    mainEntityOfPage: absoluteUrl(`/post/${post.slug}`),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="container mx-auto px-0 mb-2 ">
        <div className="grid  grid-cols-1 lg:grid-cols-12 gap-3 ">
          <Sidebar place={post.categories[0]?.slug} />
          <div className="col-span-1 lg:col-span-9 xl:col-span-10">
            <PostDetail post={post} />
          </div>
        </div>
      </div>
    </>
  );
}
