"use client";

import { useState, useTransition } from "react";
import { deleteCategory, moveCategory, saveCategory, type ActionResult } from "@/app/admin/_actions/categories";
import { slugify } from "@/lib/slug";
import { cx, ui } from "./ui";

type Category = { id: string; name: string; slug: string; posts: number };

export default function CategoryManager({ categories }: { categories: Category[] }) {
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<ActionResult>, onSuccess?: () => void) =>
    startTransition(async () => {
      setError(null);
      const result = await action();
      if (result.ok) onSuccess?.();
      else setError(result.error);
    });

  return (
    <div className="space-y-6">
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <ul className={cx(ui.card, "divide-y divide-slate-100", pending && "opacity-60")}>
        {categories.map((category, index) =>
          editing === category.id ? (
            <li key={category.id} className="p-4">
              <CategoryForm
                initial={category}
                pending={pending}
                onCancel={() => setEditing(null)}
                onSubmit={(values) => run(() => saveCategory({ id: category.id, ...values }), () => setEditing(null))}
              />
            </li>
          ) : (
            <li key={category.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex flex-col">
                <button
                  type="button"
                  aria-label={`Move ${category.name} up`}
                  disabled={pending || index === 0}
                  onClick={() => run(() => moveCategory(category.id, -1))}
                  className="text-slate-400 hover:text-slate-900 disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label={`Move ${category.name} down`}
                  disabled={pending || index === categories.length - 1}
                  onClick={() => run(() => moveCategory(category.id, 1))}
                  className="text-slate-400 hover:text-slate-900 disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{category.name}</p>
                <p className="text-xs text-slate-500">
                  /category/{category.slug} · {category.posts} post{category.posts === 1 ? "" : "s"}
                </p>
              </div>
              <button type="button" onClick={() => setEditing(category.id)} className={cx(ui.button, ui.ghost, "px-2")}>
                Edit
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => confirm(`Delete “${category.name}”?`) && run(() => deleteCategory(category.id))}
                className={cx(ui.button, "px-2 text-red-600 hover:bg-red-50")}
              >
                Delete
              </button>
            </li>
          ),
        )}
        {categories.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-500">No categories yet.</li>}
      </ul>

      <section className={cx(ui.card, "p-4")}>
        <h2 className="mb-3 text-sm font-semibold">Add a category</h2>
        <CategoryForm key={categories.length} pending={pending} onSubmit={(values) => run(() => saveCategory(values))} />
      </section>
    </div>
  );
}

function CategoryForm({
  initial,
  pending,
  onSubmit,
  onCancel,
}: {
  initial?: Category;
  pending: boolean;
  onSubmit: (values: { name: string; slug: string }) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initial);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ name, slug: slugify(slug || name) });
      }}
      className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
    >
      <div>
        <label className={ui.label} htmlFor={`name-${initial?.id ?? "new"}`}>
          Name
        </label>
        <input
          id={`name-${initial?.id ?? "new"}`}
          value={name}
          required
          maxLength={80}
          onChange={(event) => {
            setName(event.target.value);
            if (!slugTouched) setSlug(slugify(event.target.value));
          }}
          className={ui.input}
        />
      </div>
      <div>
        <label className={ui.label} htmlFor={`slug-${initial?.id ?? "new"}`}>
          Slug
        </label>
        <input
          id={`slug-${initial?.id ?? "new"}`}
          value={slug}
          maxLength={80}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(event.target.value);
          }}
          className={ui.input}
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={pending || !name.trim()} className={cx(ui.button, ui.primary)}>
          {initial ? "Save" : "Add"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={cx(ui.button, ui.ghost)}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
