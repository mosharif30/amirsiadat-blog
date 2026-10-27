export type MediaItem = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  createdAt: string;
};

export const ACCEPTED_IMAGES = "image/jpeg,image/png,image/gif,image/webp,image/avif";

/** Uploads an image to /api/admin/media and returns the created media record. */
export async function uploadImage(file: File, alt?: string): Promise<MediaItem> {
  const body = new FormData();
  body.append("file", file);
  if (alt) body.append("alt", alt);
  const response = await fetch("/api/admin/media", { method: "POST", body });
  const json = (await response.json().catch(() => ({}))) as { media?: MediaItem; error?: string };
  if (!response.ok || !json.media) {
    throw new Error(json.error || (response.status === 413 ? "The file is too large." : "Upload failed."));
  }
  return json.media;
}

export const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
