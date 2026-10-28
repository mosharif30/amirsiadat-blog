import Link from "next/link";
import { cx, ui } from "@/components/admin/ui";

export default function AdminNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-xl font-semibold">Not found</h1>
      <p className="text-sm text-slate-500">It may have been deleted.</p>
      <Link href="/admin" className={cx(ui.button, ui.secondary)}>
        Back to posts
      </Link>
    </div>
  );
}
