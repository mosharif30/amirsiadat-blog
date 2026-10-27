import type { Metadata } from "next";
import MediaLibrary from "@/components/admin/MediaLibrary";
import { db } from "@/lib/db";
import { mediaSelect } from "@/lib/media";

export const metadata: Metadata = { title: "Media" };

export default async function MediaPage() {
  const media = await db.media.findMany({ select: mediaSelect, orderBy: { createdAt: "desc" } });
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-1 text-2xl font-semibold">Media</h1>
      <p className="mb-6 text-sm text-slate-500">{media.length} images. JPEG, PNG, GIF, WebP or AVIF, up to {process.env.MAX_UPLOAD_MB || 10} MB.</p>
      <MediaLibrary media={media.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() }))} />
    </div>
  );
}
