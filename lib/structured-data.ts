import { absoluteUrl, site } from "./site";

/** schema.org JSON-LD builders, rendered with components/JsonLd.tsx. */

export function person(name: string = site.author) {
  return name === site.author
    ? { "@type": "Person", "@id": absoluteUrl("/about#person"), name, url: absoluteUrl("/about"), image: absoluteUrl("/siadat2.JPG"), jobTitle: "Film critic" }
    : { "@type": "Person", name };
}

export function website() {
  return {
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: site.name,
    description: site.description,
    url: absoluteUrl("/"),
    inLanguage: "en",
    publisher: { "@id": absoluteUrl("/about#person") },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: absoluteUrl("/searchResult?searched={search_term_string}") },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

type PostingInput = {
  title: string;
  excerpt: string;
  slug: string;
  publishedAt: Date | null;
  updatedAt: Date;
  wordCount: number;
  readingMinutes: number;
  image: string;
  authorName?: string;
  section?: string;
};

export function blogPosting(post: PostingInput) {
  const url = absoluteUrl(`/post/${post.slug}`);
  return {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.excerpt,
    url,
    mainEntityOfPage: url,
    image: [absoluteUrl(post.image)],
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: person(post.authorName),
    publisher: person(),
    isPartOf: { "@id": absoluteUrl("/#website") },
    inLanguage: "en",
    articleSection: post.section,
    wordCount: post.wordCount,
    timeRequired: `PT${post.readingMinutes}M`,
  };
}
