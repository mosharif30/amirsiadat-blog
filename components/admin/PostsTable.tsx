"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { deletePost, setPostStatus } from "@/app/admin/_actions/posts";
import { formatPostDate } from "@/lib/format";
import { cx, ui } from "./ui";

export type PostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
  updatedAt: string;
  readingMinutes: number;
  categories: string[];
  cover: string | null;
  /** All-time page views. */
  views: number;
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Drafts" },
] as const;

export function StatusBadge({ status, scheduled }: { status: PostRow["status"]; scheduled?: boolean }) {
  const label = status === "DRAFT" ? "Draft" : scheduled ? "Scheduled" : "Published";
  return (
    <span
      className={cx(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        status === "DRAFT" ? "bg-amber-100 text-amber-800" : scheduled ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800",
      )}
    >
      {label}
    </span>
  );
}

export default function PostsTable({ posts }: { posts: PostRow[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("all");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  const visible = useMemo(() => {
    const terms = deferredQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return posts.filter((post) => {
      if (filter !== "all" && post.status !== filter) return false;
      const haystack = `${post.title} ${post.slug} ${post.excerpt} ${post.categories.join(" ")}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [posts, filter, deferredQuery]);

  const run = (action: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      setError(null);
      const result = await action();
      if (!result.ok) setError(result.error ?? "Something went wrong.");
    });

  return (
    <div className={ui.card}>
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search posts…"
          aria-label="Search posts"
          className={cx(ui.input, "sm:max-w-xs")}
        />
        <div className="flex gap-1" role="tablist" aria-label="Filter by status">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={filter === option.value}
              onClick={() => setFilter(option.value)}
              className={cx(ui.button, "px-3 py-1.5", filter === option.value ? "bg-slate-900 text-white" : ui.ghost)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-500 sm:ml-auto">
          {visible.length} of {posts.length}
        </p>
      </div>

      {error && <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      {visible.length === 0 ? (
        <p className="px-4 py-12 text-center text-sm text-slate-500">
          {posts.length === 0 ? "No posts yet." : "No posts match your search."}
        </p>
      ) : (
        <ul className={cx("divide-y divide-slate-100", pending && "opacity-60")}>
          {visible.map((post) => {
            const scheduled = post.status === "PUBLISHED" && !!post.publishedAt && new Date(post.publishedAt) > new Date();
            return (
              <li key={post.id} className="flex items-center gap-4 px-4 py-3">
                <div className="hidden h-12 w-16 flex-none overflow-hidden rounded bg-slate-100 sm:block">
                  {post.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.cover} alt="" className="h-full w-full object-cover" loading="lazy" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/posts/${post.id}`} className="block truncate font-medium text-slate-900 hover:text-customBlue">
                    {post.title || "(untitled)"}
                  </Link>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    <StatusBadge status={post.status} scheduled={scheduled} />
                    {post.categories.length > 0 && <span>{post.categories.join(", ")}</span>}
                    {post.publishedAt && <span>· {formatPostDate(post.publishedAt)}</span>}
                    <span>· {post.readingMinutes} min read</span>
                    <span className="sm:hidden">· {post.views.toLocaleString("en-US")} views</span>
                  </p>
                </div>
                <p className="hidden w-20 flex-none text-right text-sm tabular-nums text-slate-700 sm:block" title="All-time views">
                  {post.views.toLocaleString("en-US")}
                  <span className="block text-xs text-slate-400">{post.views === 1 ? "view" : "views"}</span>
                </p>
                <div className="flex flex-none items-center gap-1">
                  {post.status === "PUBLISHED" && !scheduled && (
                    <Link href={`/post/${post.slug}`} target="_blank" className={cx(ui.button, ui.ghost, "hidden px-2 md:inline-flex")}>
                      View
                    </Link>
                  )}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => setPostStatus(post.id, post.status === "DRAFT" ? "PUBLISHED" : "DRAFT"))}
                    className={cx(ui.button, ui.ghost, "px-2")}
                  >
                    {post.status === "DRAFT" ? "Publish" : "Unpublish"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (confirm(`Delete “${post.title}”? This cannot be undone.`)) run(() => deletePost(post.id));
                    }}
                    className={cx(ui.button, "px-2 text-red-600 hover:bg-red-50")}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
