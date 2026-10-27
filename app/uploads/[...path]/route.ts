import path from "node:path";
import { getLocalStorage } from "@/lib/storage";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

/** Serves files from the local upload directory (files added after `next build` aren't in /public). */
export async function GET(_request: Request, { params }: RouteContext<"/uploads/[...path]">) {
  const key = (await params).path.join("/");
  const type = CONTENT_TYPES[path.extname(key).toLowerCase()];
  if (!type) return new Response("Not found", { status: 404 });

  try {
    const data = await getLocalStorage().read(key);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": type,
        "Content-Length": String(data.length),
        // Keys are unique per upload, so the content never changes.
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
