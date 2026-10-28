"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { getStorage } from "@/lib/storage";

export type ActionResult = { ok: true } | { ok: false; error: string };

const idSchema = z.string().min(1).max(64);

export async function updateMediaAlt(mediaId: string, alt: string): Promise<ActionResult> {
  await requireAdmin();
  const id = idSchema.parse(mediaId);
  const value = z.string().trim().max(300).parse(alt);
  const { count } = await db.media.updateMany({ where: { id }, data: { alt: value || null } });
  if (count === 0) return { ok: false, error: "This file no longer exists." };
  revalidatePath("/admin/media");
  return { ok: true };
}

/** Deletes a file unless a post still uses it as cover or inside its content. */
export async function deleteMedia(mediaId: string): Promise<ActionResult> {
  await requireAdmin();
  const id = idSchema.parse(mediaId);
  const media = await db.media.findUnique({ where: { id } });
  if (!media) return { ok: true };

  const usedBy = await db.post.findMany({
    where: { OR: [{ featuredImageId: id }, { content: { contains: media.url } }] },
    select: { title: true },
    take: 3,
  });
  if (usedBy.length > 0) {
    return { ok: false, error: `Still used by: ${usedBy.map((post) => `“${post.title}”`).join(", ")}.` };
  }

  await db.media.delete({ where: { id } });
  await getStorage().delete(media.key);
  revalidatePath("/admin/media");
  return { ok: true };
}
