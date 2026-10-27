/**
 * First-run setup, safe to run on every start:
 * - Content (prisma/seed-data/content.json and its images) is loaded only into an empty database,
 *   in one transaction. Once the site has content, nothing is added back, so posts or images
 *   deleted in the dashboard stay deleted.
 * - The admin account (ADMIN_EMAIL / ADMIN_PASSWORD) is created if it doesn't exist yet.
 */
import { access, copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { loadEnv } from "../scripts/lib/env";
import type { SeedContent } from "./seed-data/types";

loadEnv();

const { createPrismaClient } = await import("../lib/db");
const { hashPassword, MIN_PASSWORD_LENGTH } = await import("../lib/auth/password");
const { readingStats } = await import("../lib/content");
const { getLocalStorage } = await import("../lib/storage");

const db = createPrismaClient();
const seedDir = path.join(import.meta.dirname, "seed-data");
const { default: content } = (await import("./seed-data/content.json", { with: { type: "json" } })) as {
  default: SeedContent;
};

type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0];

/** Copies the seed images into upload storage (existing files are kept). */
async function copyImages() {
  const storage = getLocalStorage();
  for (const item of content.media) {
    const target = storage.resolve(item.key);
    const exists = await access(target).then(
      () => true,
      () => false,
    );
    if (exists) continue;
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(path.join(seedDir, "uploads", item.key), target);
  }
}

async function seedContent(tx: Tx) {
  const storage = getLocalStorage();
  const mediaIds = new Map<string, string>();
  for (const item of content.media) {
    const media = await tx.media.create({ data: { ...item, url: storage.url(item.key) } });
    mediaIds.set(item.key, media.id);
  }

  const categoryIds = new Map<string, string>();
  for (const category of content.categories) {
    categoryIds.set(category.slug, (await tx.category.create({ data: category })).id);
  }

  const authorIds = new Map<string, string>();
  for (const author of content.authors) {
    const photoId = author.photoKey ? mediaIds.get(author.photoKey) : undefined;
    authorIds.set(author.name, (await tx.author.create({ data: { name: author.name, bio: author.bio, photoId } })).id);
  }

  for (const post of content.posts) {
    const stats = readingStats(post.content);
    await tx.post.create({
      data: {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        status: "PUBLISHED",
        featured: post.featured,
        publishedAt: new Date(post.publishedAt),
        createdAt: new Date(post.createdAt),
        updatedAt: new Date(post.updatedAt),
        readingMinutes: stats.minutes,
        wordCount: stats.words,
        featuredImageId: mediaIds.get(post.featuredImageKey) ?? null,
        authorId: post.authorName ? (authorIds.get(post.authorName) ?? null) : null,
        categories: {
          connect: post.categorySlugs.flatMap((slug) => {
            const id = categoryIds.get(slug);
            return id ? [{ id }] : [];
          }),
        },
      },
    });
  }

  if (content.comments.length > 0) {
    await tx.comment.createMany({
      data: content.comments.map((comment) => ({ ...comment, createdAt: new Date(comment.createdAt), approved: true })),
    });
  }
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@example.com").trim().toLowerCase();
  if (await db.user.findUnique({ where: { email } })) {
    console.log(`Admin ${email} already exists (password unchanged).`);
    return;
  }
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    if (process.env.NODE_ENV === "production") {
      // Never create an account with a well-known password on a live server.
      console.warn("ADMIN_PASSWORD is not set: no admin created. Run `npm run admin:create -- --email …`.");
      return;
    }
    console.warn('ADMIN_PASSWORD is not set: using the development default "change-me-now".');
  }
  if ((password ?? "change-me-now").length < MIN_PASSWORD_LENGTH) {
    throw new Error(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  await db.user.create({
    data: {
      email,
      name: process.env.ADMIN_NAME || "Admin",
      passwordHash: await hashPassword(password ?? "change-me-now"),
    },
  });
  console.log(`Created admin ${email}. Change the password after signing in at /admin.`);
}

async function main() {
  const [posts, categories, media] = await Promise.all([db.post.count(), db.category.count(), db.media.count()]);
  if (posts + categories + media > 0) {
    console.log("The database already has content: skipping the content seed.");
  } else {
    await copyImages();
    await db.$transaction(seedContent, { timeout: 120_000 });
    console.log(
      `Seeded ${content.posts.length} posts, ${content.categories.length} categories, ${content.media.length} images.`,
    );
  }
  await seedAdmin();
}

try {
  await main();
} finally {
  await db.$disconnect();
}
