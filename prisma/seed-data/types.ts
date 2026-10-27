/** Shape of prisma/seed-data/content.json (the content the site ships with). */
export type SeedMedia = {
  /** Path inside the upload storage, e.g. "legacy/abc.jpg" (file lives in seed-data/uploads/). */
  key: string;
  filename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
};

export type SeedContent = {
  categories: { name: string; slug: string; position: number }[];
  authors: { name: string; bio: string | null; photoKey: string | null }[];
  media: SeedMedia[];
  posts: {
    slug: string;
    title: string;
    excerpt: string;
    /** Markdown */
    content: string;
    featured: boolean;
    publishedAt: string;
    createdAt: string;
    updatedAt: string;
    featuredImageKey: string;
    categorySlugs: string[];
    authorName: string | null;
  }[];
  comments: { name: string; email: string; comment: string; createdAt: string }[];
};
