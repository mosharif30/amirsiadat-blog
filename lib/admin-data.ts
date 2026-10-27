import { db } from "./db";
import { mediaSelect } from "./media";

/** Data shared by the post editor pages. */
export async function getEditorData() {
  const [categories, media] = await Promise.all([
    db.category.findMany({ select: { id: true, name: true }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] }),
    db.media.findMany({ select: mediaSelect, orderBy: { createdAt: "desc" } }),
  ]);
  return { categories, media: media.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })) };
}
