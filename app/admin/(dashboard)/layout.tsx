import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/app/admin/_actions/auth";
import AdminNav from "@/components/admin/AdminNav";
import { requireAdminPage } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireAdminPage();

  return (
    <div className="lg:flex">
      <aside className="border-b border-slate-200 bg-customBlue text-slate-100 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:flex-none lg:flex-col lg:border-b-0">
        <div className="flex items-center justify-between px-5 py-4 lg:block">
          <Link href="/admin" className="block text-lg font-semibold tracking-wide text-white">
            AMIR SIADAT
            <span className="block text-xs font-normal uppercase tracking-widest text-slate-300">Dashboard</span>
          </Link>
          <Link href="/" target="_blank" className="text-sm text-slate-300 hover:text-white lg:hidden">
            View site ↗
          </Link>
        </div>
        <AdminNav />
        <div className="hidden border-t border-white/10 px-5 py-4 text-sm lg:mt-auto lg:block">
          <p className="truncate text-slate-300" title={user.email}>
            {user.name || user.email}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <Link href="/" target="_blank" className="text-slate-300 hover:text-white">
              View site ↗
            </Link>
            <form action={logout}>
              <button type="submit" className="text-slate-300 hover:text-white">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
    </div>
  );
}
