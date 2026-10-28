"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { readingStats } from "@/lib/content";
import { SLUG_PATTERN } from "@/lib/slug";

const idSchema = z.string().min(1).max(64);

const postInput = z
  .object({
    id: idSchema.optional(),
    title: z.string().trim().min(1, "Title is required.").max(200),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required.")
      .max(100)
      .regex(SLUG_PATTERN, "Use lowercase letters, numbers and single dashes."),
    excerpt: z.string().trim().max(1000),
    content: z.string().max(500_000),
    status: z.enum(["DRAFT", "PUBLISHED"]),
    publishedAt: z.iso.datetime({ offset: true }).nullable(),
    featured: z.boolean(),
    categoryIds: z.array(idSchema).max(20),
    featuredImageId: idSchema.nullable(),
    seoTitle: z.string().trim().max(200),
    seoDescription: z.string().trim().max(400),
  })
  .superRefine((post, ctx) => {
    // The public cards and post pages expect these when a post is live.
    if (post.status !== "PUBLISHED") return;
    if (!post.excerpt) ctx.addIssue({ code: "custom", path: ["excerpt"], message: "An excerpt is required to publish." });
    if (!post.featuredImageId) {
      ctx.addIssue({ code: "custom", path: ["featuredImageId"], message: "A cover image is required to publish." });
    }
    if (post.categoryIds.length === 0) {
      ctx.addIssue({ code: "custom", path: ["categoryIds"], message: "Pick at least one category to publish." });
    }
  });

export type PostInput = z.input<typeof postInput>;

export type SavePostResult =
  | { ok: true; id: string; slug: string; status: "DRAFT" | "PUBLISHED"; publishedAt: string | null; updatedAt: string }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof PostInput, string>> };

export async function savePost(input: PostInput): Promise<SavePostResult> {
  await requireAdmin();
  const parsed = postInput.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof PostInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof PostInput | undefined;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }

  const { id, categoryIds, publishedAt, ...fields } = parsed.data;
  const [categoryCount, image] = await Promise.all([
    db.category.count({ where: { id: { in: categoryIds } } }),
    fields.featuredImageId ? db.media.findUnique({ where: { id: fields.featuredImageId }, select: { id: true } }) : true,
  ]);
  if (categoryCount !== new Set(categoryIds).size || !image) {
    return { ok: false, error: "A selected category or image no longer exists. Reload the page and try again." };
  }
  const stats = readingStats(fields.content);
  const data = {
    ...fields,
    seoTitle: fields.seoTitle || null,
    seoDescription: fields.seoDescription || null,
    // Publishing without a date publishes now; drafts keep whatever date they had.
    publishedAt: publishedAt ? new Date(publishedAt) : fields.status === "PUBLISHED" ? new Date() : null,
    readingMinutes: stats.minutes,
    wordCount: stats.words,
  };

  try {
    const post = id
      ? await db.post.update({
          where: { id },
          data: { ...data, categories: { set: categoryIds.map((categoryId) => ({ id: categoryId })) } },
        })
      : await db.post.create({
          data: { ...data, categories: { connect: categoryIds.map((categoryId) => ({ id: categoryId })) } },
        });

    revalidatePath("/admin");
    return {
      ok: true,
      id: post.id,
      slug: post.slug,
      status: post.status,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      updatedAt: post.updatedAt.toISOString(),
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "That slug is taken.", fieldErrors: { slug: "Another post already uses this slug." } };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false, error: "This post no longer exists." };
    }
    throw error;
  }
}

/** Whether a slug is free, with the next free variant ("slug-2", …) when it isn't. */
export async function checkSlug(
  slug: string,
  excludeId?: string,
): Promise<{ available: true } | { available: false; suggestion: string }> {
  await requireAdmin();
  const value = z.string().regex(SLUG_PATTERN).max(100).parse(slug);
  const exclude = idSchema.optional().parse(excludeId);
  const taken = new Set(
    (
      await db.post.findMany({
        where: { slug: { startsWith: value }, ...(exclude && { id: { not: exclude } }) },
        select: { slug: true },
      })
    ).map((post) => post.slug),
  );
  if (!taken.has(value)) return { available: true };
  let n = 2;
  while (taken.has(`${value}-${n}`)) n++;
  return { available: false, suggestion: `${value}-${n}` };
}

export async function setPostStatus(postId: string, nextStatus: "DRAFT" | "PUBLISHED") {
  await requireAdmin();
  const id = idSchema.parse(postId);
  const status = z.enum(["DRAFT", "PUBLISHED"]).parse(nextStatus);
  const post = await db.post.findUnique({
    where: { id },
    select: { excerpt: true, featuredImageId: true, publishedAt: true, _count: { select: { categories: true } } },
  });
  if (!post) return { ok: false as const, error: "This post no longer exists." };
  if (status === "PUBLISHED" && (!post.excerpt || !post.featuredImageId || post._count.categories === 0)) {
    return { ok: false as const, error: "Add an excerpt, a cover image and a category before publishing." };
  }
  await db.post.update({
    where: { id },
    data: { status, publishedAt: status === "PUBLISHED" ? (post.publishedAt ?? new Date()) : post.publishedAt },
  });
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function deletePost(postId: string) {
  await requireAdmin();
  await db.post.delete({ where: { id: idSchema.parse(postId) } }).catch((error: unknown) => {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")) throw error;
  });
  revalidatePath("/admin");
  return { ok: true as const };
}
