import { randomBytes } from "node:crypto";
import path from "node:path";
import { imageSize } from "image-size";
import { db } from "./db";
import { getStorage } from "./storage";

const ALLOWED: Record<string, { ext: string; mime: string }> = {
  jpg: { ext: "jpg", mime: "image/jpeg" },
  png: { ext: "png", mime: "image/png" },
  gif: { ext: "gif", mime: "image/gif" },
  webp: { ext: "webp", mime: "image/webp" },
  avif: { ext: "avif", mime: "image/avif" },
};

export const maxUploadBytes = () => Number(process.env.MAX_UPLOAD_MB || 10) * 1024 * 1024;

export class UploadError extends Error {}

export const mediaSelect = {
  id: true,
  url: true,
  filename: true,
  mimeType: true,
  size: true,
  width: true,
  height: true,
  alt: true,
  createdAt: true,
} as const;

/** Validates an uploaded image by its content (not its name/MIME header), stores it and records it. */
export async function saveUpload(file: File, alt?: string) {
  if (file.size === 0) throw new UploadError("The file is empty.");
  if (file.size > maxUploadBytes()) {
    throw new UploadError(`Files must be smaller than ${process.env.MAX_UPLOAD_MB || 10} MB.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let info: ReturnType<typeof imageSize>;
  try {
    info = imageSize(buffer);
  } catch {
    throw new UploadError("Only JPEG, PNG, GIF, WebP and AVIF images are supported.");
  }
  const type = info.type ? ALLOWED[info.type] : undefined;
  if (!type) throw new UploadError("Only JPEG, PNG, GIF, WebP and AVIF images are supported.");

  const base =
    path
      .basename(file.name, path.extname(file.name))
      .normalize("NFKD")
      .replace(/[^\w-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 60) || "image";
  const now = new Date();
  const key = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomBytes(6).toString("hex")}-${base}.${type.ext}`;

  const storage = getStorage();
  const stored = await storage.put(key, buffer, type.mime);
  try {
    return await db.media.create({
      data: {
        key,
        url: stored.url,
        filename: file.name.slice(0, 200) || `${base}.${type.ext}`,
        mimeType: type.mime,
        size: buffer.length,
        width: info.width ?? null,
        height: info.height ?? null,
        alt: alt?.trim() || null,
      },
      select: mediaSelect,
    });
  } catch (error) {
    await storage.delete(key);
    throw error;
  }
}
