"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { SLUG_PATTERN, slugify } from "@/lib/slug";

export type ActionResult = { ok: true } | { ok: false; error: string };

const idSchema = z.string().min(1).max(64);
const isNotFound = (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";

const categoryInput = z.object({
  id: idSchema.optional(),
  name: z.string().trim().min(1, "Name is required.").max(80),
  slug: z.string().trim().max(80).optional(),
});

export async function saveCategory(input: z.input<typeof categoryInput>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categoryInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]!.message };

  const { id, name } = parsed.data;
  const slug = parsed.data.slug || slugify(name);
  if (!SLUG_PATTERN.test(slug)) return { ok: false, error: "Slugs may only contain lowercase letters, numbers and dashes." };

  try {
    if (id) {
      await db.category.update({ where: { id }, data: { name, slug } });
    } else {
      const last = await db.category.aggregate({ _max: { position: true } });
      await db.category.create({ data: { name, slug, position: (last._max.position ?? -1) + 1 } });
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: `The slug "${slug}" is already used by another category.` };
    }
    if (isNotFound(error)) return { ok: false, error: "This category no longer exists." };
    throw error;
  }
  revalidatePath("/admin/categories");
  return { ok: true };
}

export async function moveCategory(categoryId: string, step: -1 | 1): Promise<ActionResult> {
  await requireAdmin();
  const id = idSchema.parse(categoryId);
  const direction = z.union([z.literal(-1), z.literal(1)]).parse(step);
  const categories = await db.category.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
  const index = categories.findIndex((category) => category.id === id);
  const target = index + direction;
  if (index === -1 || target < 0 || target >= categories.length) return { ok: true };

  [categories[index], categories[target]] = [categories[target]!, categories[index]!];
  await db.$transaction(
    categories.map((category, position) => db.category.update({ where: { id: category.id }, data: { position } })),
  );
  revalidatePath("/admin/categories");
  return { ok: true };
}

export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  await requireAdmin();
  const id = idSchema.parse(categoryId);
  const count = await db.post.count({ where: { categories: { some: { id } } } });
  if (count > 0) {
    return { ok: false, error: `This category still has ${count} post${count === 1 ? "" : "s"}. Move them first.` };
  }
  await db.category.delete({ where: { id } }).catch((error: unknown) => {
    if (!isNotFound(error)) throw error;
  });
  revalidatePath("/admin/categories");
  return { ok: true };
}
