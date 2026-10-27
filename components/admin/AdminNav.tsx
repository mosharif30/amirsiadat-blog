"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/_actions/auth";
import { cx } from "./ui";

const links = [
  { href: "/admin", label: "Posts", match: (path: string) => path === "/admin" || (path.startsWith("/admin/posts/") && path !== "/admin/posts/new") },
  { href: "/admin/posts/new", label: "New post", match: (path: string) => path === "/admin/posts/new" },
  { href: "/admin/media", label: "Media", match: (path: string) => path.startsWith("/admin/media") },
  { href: "/admin/categories", label: "Categories", match: (path: string) => path.startsWith("/admin/categories") },
  { href: "/admin/account", label: "Account", match: (path: string) => path.startsWith("/admin/account") },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 text-sm lg:flex-col lg:px-3 lg:pb-0">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cx(
            "whitespace-nowrap rounded-md px-3 py-2 font-medium transition",
            link.match(pathname) ? "bg-white text-customBlue" : "text-slate-200 hover:bg-white/10 hover:text-white",
          )}
        >
          {link.label}
        </Link>
      ))}
      <form action={logout} className="lg:hidden">
        <button type="submit" className="whitespace-nowrap rounded-md px-3 py-2 font-medium text-slate-200 hover:bg-white/10">
          Sign out
        </button>
      </form>
    </nav>
  );
}
