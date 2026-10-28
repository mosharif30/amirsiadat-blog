"use client";

import Link from "next/link";
import { cx, ui } from "@/components/admin/ui";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-slate-500">
        The error was logged on the server.{error.digest && <> Reference: <code>{error.digest}</code></>}
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={reset} className={cx(ui.button, ui.primary)}>
          Try again
        </button>
        <Link href="/admin" className={cx(ui.button, ui.secondary)}>
          Back to posts
        </Link>
      </div>
    </div>
  );
}
