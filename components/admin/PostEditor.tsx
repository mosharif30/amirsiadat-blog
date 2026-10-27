"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { deletePost, savePost, type PostInput, type SavePostResult } from "@/app/admin/_actions/posts";
import { readingStats } from "@/lib/content";
import { slugify } from "@/lib/slug";
import RichTextEditor from "./editor/RichTextEditor";
import MediaPicker from "./MediaPicker";
import { StatusBadge } from "./PostsTable";
import { cx, ui } from "./ui";
import type { MediaItem } from "./upload";

export type EditorPost = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
  featured: boolean;
  categoryIds: string[];
  featuredImageId: string | null;
  seoTitle: string;
  seoDescription: string;
};

type PostEditorProps = {
  post: EditorPost;
  categories: { id: string; name: string }[];
  media: MediaItem[];
};

type FieldErrors = Extract<SavePostResult, { ok: false }>["fieldErrors"];

/** `datetime-local` works in local time without a zone; convert to/from ISO strings. */
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null);

export default function PostEditor({ post: initial, categories, media: initialMedia }: PostEditorProps) {
  const router = useRouter();
  const [post, setPost] = useState(initial);
  const [saved, setSaved] = useState(initial);
  // New posts follow the title until the slug is edited by hand.
  const [slugLocked, setSlugLocked] = useState(!!initial.id);
  const [media, setMedia] = useState(initialMedia);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = JSON.stringify(post) !== JSON.stringify(saved);
  const stats = useMemo(() => readingStats(post.content), [post.content]);
  const cover = media.find((item) => item.id === post.featuredImageId);
  const scheduled = post.status === "PUBLISHED" && !!post.publishedAt && new Date(post.publishedAt) > new Date();

  const update = <K extends keyof EditorPost>(key: K, value: EditorPost[K]) => {
    setPost((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function save(status: EditorPost["status"] = post.status) {
    const input: PostInput = { ...post, status };
    startTransition(async () => {
      setMessage(null);
      const result = await savePost(input);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setMessage({ type: "error", text: result.error });
        return;
      }
      const next = { ...post, id: result.id, status: result.status, publishedAt: result.publishedAt };
      setPost(next);
      setSaved(next);
      setSlugLocked(true);
      setErrors({});
      setMessage({
        type: "success",
        text: result.status === "PUBLISHED" ? (status !== saved.status ? "Published." : "Changes published.") : "Draft saved.",
      });
      if (!initial.id) router.replace(`/admin/posts/${result.id}`);
      else router.refresh();
    });
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        if (!pending) save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function remove() {
    if (!post.id || !confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    startTransition(async () => {
      await deletePost(post.id!);
      setSaved(post); // don't trigger the unsaved-changes prompt
      router.push("/admin");
    });
  }

  const onMediaUploaded = (item: MediaItem) => setMedia((current) => [item, ...current]);

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-900">
          ← Posts
        </Link>
        <h1 className="text-xl font-semibold">{initial.id ? "Edit post" : "New post"}</h1>
        <StatusBadge status={saved.status} scheduled={scheduled && saved.status === "PUBLISHED"} />
        {dirty && <span className="text-xs text-slate-500">Unsaved changes</span>}
        <div className="ml-auto flex flex-wrap gap-2">
          {saved.status === "PUBLISHED" && post.id && (
            <Link href={`/post/${saved.slug}`} target="_blank" className={cx(ui.button, ui.secondary)}>
              View ↗
            </Link>
          )}
          {post.status === "PUBLISHED" ? (
            <>
              <button type="button" disabled={pending} onClick={() => save("DRAFT")} className={cx(ui.button, ui.secondary)}>
                Unpublish
              </button>
              <button type="button" disabled={pending || (!dirty && !!post.id)} onClick={() => save()} className={cx(ui.button, ui.primary)}>
                {pending ? "Saving…" : "Update"}
              </button>
            </>
          ) : (
            <>
              <button type="button" disabled={pending} onClick={() => save("DRAFT")} className={cx(ui.button, ui.secondary)}>
                {pending ? "Saving…" : "Save draft"}
              </button>
              <button type="button" disabled={pending} onClick={() => save("PUBLISHED")} className={cx(ui.button, ui.primary)}>
                Publish
              </button>
            </>
          )}
        </div>
      </div>

      {message && (
        <p
          role={message.type === "error" ? "alert" : "status"}
          className={cx(
            "mb-4 rounded-md px-3 py-2 text-sm",
            message.type === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800",
          )}
        >
          {message.text}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Main column */}
        <div className="min-w-0 space-y-5">
          <div>
            <label htmlFor="title" className="sr-only">
              Title
            </label>
            <input
              id="title"
              value={post.title}
              onChange={(event) => {
                const title = event.target.value;
                setPost((current) => ({ ...current, title, slug: slugLocked ? current.slug : slugify(title) }));
                setErrors((current) => ({ ...current, title: undefined, slug: undefined }));
              }}
              placeholder="Post title"
              className={cx(ui.input, "py-3 text-xl font-semibold")}
            />
            {errors?.title && <p className={ui.error}>{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="slug" className={ui.label}>
              URL
            </label>
            <div className="flex items-stretch gap-2">
              <div className="flex min-w-0 flex-1 items-center rounded-md border border-slate-300 bg-white shadow-sm focus-within:border-customBlue focus-within:ring-2 focus-within:ring-customBlue/20">
                <span className="select-none pl-3 text-sm text-slate-400">/post/</span>
                <input
                  id="slug"
                  value={post.slug}
                  onChange={(event) => {
                    setSlugLocked(true);
                    update("slug", event.target.value.toLowerCase().replace(/\s+/g, "-"));
                  }}
                  onBlur={() => update("slug", slugify(post.slug))}
                  className="min-w-0 flex-1 border-0 bg-transparent py-2 pl-0.5 pr-3 text-sm focus:outline-none focus:ring-0"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setSlugLocked(false);
                  update("slug", slugify(post.title));
                }}
                className={cx(ui.button, ui.secondary)}
                title="Generate the slug from the title"
              >
                From title
              </button>
            </div>
            {errors?.slug ? (
              <p className={ui.error}>{errors.slug}</p>
            ) : (
              <p className={ui.hint}>
                {slugLocked ? "Edited manually." : "Generated from the title."}
                {saved.status === "PUBLISHED" && post.slug !== saved.slug && " Changing the URL of a published post breaks existing links."}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="excerpt" className={ui.label}>
              Excerpt
            </label>
            <textarea
              id="excerpt"
              value={post.excerpt}
              onChange={(event) => update("excerpt", event.target.value)}
              rows={3}
              className={ui.input}
              placeholder="Shown on post cards and used as the description for search engines."
            />
            {errors?.excerpt && <p className={ui.error}>{errors.excerpt}</p>}
          </div>

          <div>
            <div className="mb-1 flex items-baseline justify-between">
              <span className={ui.label}>Content</span>
              <span className="text-xs text-slate-500">
                {stats.words.toLocaleString()} words · {stats.minutes} min read
              </span>
            </div>
            <RichTextEditor
              value={post.content}
              onChange={(content) => update("content", content)}
              media={media}
              onMediaUploaded={onMediaUploaded}
            />
            <p className={ui.hint}>
              Shortcuts: Ctrl+B bold, Ctrl+I italic, Ctrl+K link, Ctrl+Z undo, Ctrl+S save. Paste or drop images to
              upload them.
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <section className={cx(ui.card, "space-y-4 p-4")}>
            <h2 className="text-sm font-semibold text-slate-900">Publishing</h2>
            <div>
              <span className={ui.label}>Status</span>
              <div className="grid grid-cols-2 rounded-md border border-slate-300 p-0.5 text-sm" role="radiogroup">
                {(["DRAFT", "PUBLISHED"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    role="radio"
                    aria-checked={post.status === status}
                    onClick={() => update("status", status)}
                    className={cx(
                      "rounded px-2 py-1.5 font-medium",
                      post.status === status ? "bg-customBlue text-white" : "text-slate-600 hover:bg-slate-100",
                    )}
                  >
                    {status === "DRAFT" ? "Draft" : "Published"}
                  </button>
                ))}
              </div>
              {post.status !== saved.status && <p className={ui.hint}>Save to apply the status change.</p>}
            </div>
            <div>
              <label htmlFor="publishedAt" className={ui.label}>
                Publish date
              </label>
              <input
                id="publishedAt"
                type="datetime-local"
                value={toLocalInput(post.publishedAt)}
                onChange={(event) => update("publishedAt", fromLocalInput(event.target.value))}
                className={ui.input}
              />
              <p className={ui.hint}>
                {scheduled ? "Scheduled: hidden until this date." : "Shown on the post. Empty = when first published."}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={post.featured}
                onChange={(event) => update("featured", event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-customBlue focus:ring-customBlue"
              />
              Featured post
            </label>
          </section>

          <section className={cx(ui.card, "space-y-3 p-4")}>
            <h2 className="text-sm font-semibold text-slate-900">Cover image</h2>
            {cover ? (
              <div className="overflow-hidden rounded-md border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover.url} alt={cover.alt ?? ""} className="aspect-[4/3] w-full bg-slate-100 object-contain" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCoverPickerOpen(true)}
                className="flex aspect-[4/3] w-full items-center justify-center rounded-md border-2 border-dashed border-slate-300 text-sm text-slate-500 hover:border-customBlue hover:text-customBlue"
              >
                Choose or upload an image
              </button>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => setCoverPickerOpen(true)} className={cx(ui.button, ui.secondary, "flex-1")}>
                {cover ? "Replace" : "Choose"}
              </button>
              {cover && (
                <button type="button" onClick={() => update("featuredImageId", null)} className={cx(ui.button, ui.ghost)}>
                  Remove
                </button>
              )}
            </div>
            {errors?.featuredImageId && <p className={ui.error}>{errors.featuredImageId}</p>}
          </section>

          <section className={cx(ui.card, "space-y-2 p-4")}>
            <h2 className="text-sm font-semibold text-slate-900">Categories</h2>
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={post.categoryIds.includes(category.id)}
                  onChange={(event) =>
                    update(
                      "categoryIds",
                      event.target.checked
                        ? [...post.categoryIds, category.id]
                        : post.categoryIds.filter((id) => id !== category.id),
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300 text-customBlue focus:ring-customBlue"
                />
                {category.name}
              </label>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-slate-500">
                No categories yet. <Link href="/admin/categories" className="text-customBlue underline">Create one</Link>.
              </p>
            )}
            {errors?.categoryIds && <p className={ui.error}>{errors.categoryIds}</p>}
            <p className={ui.hint}>The first category (by sidebar order) is shown on the post card.</p>
          </section>

          <section className={cx(ui.card, "space-y-3 p-4")}>
            <h2 className="text-sm font-semibold text-slate-900">Search engines</h2>
            <div>
              <label htmlFor="seoTitle" className={ui.label}>
                SEO title
              </label>
              <input
                id="seoTitle"
                value={post.seoTitle}
                onChange={(event) => update("seoTitle", event.target.value)}
                placeholder={post.title}
                className={ui.input}
              />
              <p className={ui.hint}>{(post.seoTitle || post.title).length}/60 recommended</p>
            </div>
            <div>
              <label htmlFor="seoDescription" className={ui.label}>
                Meta description
              </label>
              <textarea
                id="seoDescription"
                value={post.seoDescription}
                onChange={(event) => update("seoDescription", event.target.value)}
                placeholder="Defaults to the excerpt"
                rows={3}
                className={ui.input}
              />
              <p className={ui.hint}>{(post.seoDescription || post.excerpt).length}/160 recommended</p>
            </div>
          </section>

          {post.id && (
            <button type="button" onClick={remove} disabled={pending} className={cx(ui.button, ui.danger, "w-full")}>
              Delete post
            </button>
          )}
        </aside>
      </div>

      <MediaPicker
        open={coverPickerOpen}
        media={media}
        title="Choose a cover image"
        onClose={() => setCoverPickerOpen(false)}
        onUploaded={onMediaUploaded}
        onSelect={(item) => {
          update("featuredImageId", item.id);
          setCoverPickerOpen(false);
        }}
      />
    </div>
  );
}
