import Link from "next/link";
import { getViewStats } from "@/lib/analytics";
import { cx, ui } from "./ui";

const number = (value: number) => value.toLocaleString("en-US");

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className={cx(ui.card, "p-4")}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

/** Dashboard summary of page views (lib/analytics.ts). */
export default async function ViewStats() {
  const stats = await getViewStats();

  return (
    <section className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
        <Tile label="All-time views" value={number(stats.allTime)} />
        <Tile label="Last 30 days" value={number(stats.last30Days)} />
      </div>
      <div className={ui.card}>
        <div className="flex items-baseline justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold">Most read posts</h2>
          <span className="text-xs text-slate-500">Views · last 30 days</span>
        </div>
        {stats.topPosts.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            No views yet. Visits to the public site appear here (your own visits are not counted).
          </p>
        ) : (
          <ol className="divide-y divide-slate-100">
            {stats.topPosts.map((post, index) => (
              <li key={post.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="w-4 flex-none text-slate-400 tabular-nums">{index + 1}</span>
                <Link href={`/admin/posts/${post.id}`} className="min-w-0 flex-1 truncate hover:text-customBlue">
                  {post.title}
                </Link>
                <span className="flex-none tabular-nums">
                  <span className="font-medium">{number(post.views)}</span>
                  <span className="text-slate-400"> · {number(post.last30Days)}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
        <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
          Each visitor counts once per page per day. Bots and signed-in admins are ignored.
        </p>
      </div>
    </section>
  );
}

export function ViewStatsSkeleton() {
  return (
    <div className="mb-8 grid animate-pulse gap-4 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]" aria-hidden="true">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
        <div className={cx(ui.card, "h-[82px]")} />
        <div className={cx(ui.card, "h-[82px]")} />
      </div>
      <div className={cx(ui.card, "h-48")} />
    </div>
  );
}
