import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Health check for the hosting platform: the app is up and the database answers. */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "error" }, { status: 503 });
  }
}
