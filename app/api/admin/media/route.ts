import { NextResponse } from "next/server";
import { requireAdmin, UnauthorizedError } from "@/lib/auth/session";
import { saveUpload, UploadError } from "@/lib/media";
import { isCrossOrigin } from "@/lib/request";

/** Image upload endpoint used by the admin editor and media library (multipart field "file"). */
export async function POST(request: Request) {
  // Cookies are SameSite=Lax, but route handlers don't get the Server Action origin check: do it here.
  if (isCrossOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  try {
    await requireAdmin();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    const alt = form.get("alt");
    const media = await saveUpload(file, typeof alt === "string" ? alt : undefined);
    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    if (error instanceof UploadError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error(error);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
