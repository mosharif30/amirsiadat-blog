"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type DragEvent } from "react";
import { deleteMedia, updateMediaAlt } from "@/app/admin/_actions/media";
import { cx, ui } from "./ui";
import { ACCEPTED_IMAGES, formatBytes, uploadImage, type MediaItem } from "./upload";

export default function MediaLibrary({ media }: { media: MediaItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? media.filter((item) => `${item.filename} ${item.alt ?? ""}`.toLowerCase().includes(term)) : media;
  }, [media, query]);
  const selected = media.find((item) => item.id === selectedId) ?? null;

  async function upload(files: File[]) {
    if (files.length === 0) return;
    setMessage(null);
    setUploading(files.length);
    const failures: string[] = [];
    for (const file of files) {
      try {
        await uploadImage(file);
      } catch (error) {
        failures.push(`${file.name}: ${(error as Error).message}`);
      } finally {
        setUploading((count) => count - 1);
      }
    }
    setMessage(failures.length ? { type: "error", text: failures.join(" ") } : { type: "success", text: "Uploaded." });
    router.refresh();
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    void upload([...event.dataTransfer.files]);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="space-y-4">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cx(
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center text-sm",
            dragging ? "border-customBlue bg-sky-50 text-customBlue" : "border-slate-300 bg-white text-slate-500",
          )}
        >
          <p>{uploading > 0 ? `Uploading ${uploading}…` : "Drop images here, or"}</p>
          <label className={cx(ui.button, ui.primary, "cursor-pointer")}>
            Choose files
            <input
              type="file"
              accept={ACCEPTED_IMAGES}
              multiple
              className="sr-only"
              onChange={(event) => {
                void upload([...(event.target.files ?? [])]);
                event.target.value = "";
              }}
            />
          </label>
        </div>

        {message && (
          <p className={cx("rounded-md px-3 py-2 text-sm", message.type === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800")}>
            {message.text}
          </p>
        )}

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by name or alt text…"
          className={cx(ui.input, "max-w-sm")}
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {visible.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={cx(
                "overflow-hidden rounded-md border bg-white text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-customBlue",
                item.id === selectedId ? "border-customBlue ring-2 ring-customBlue/30" : "border-slate-200 hover:border-slate-400",
              )}
            >
              <div className="aspect-[4/3] bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.alt ?? ""} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <p className="truncate px-2 py-1 text-xs text-slate-600">{item.filename}</p>
            </button>
          ))}
        </div>
        {visible.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No images.</p>}
      </div>

      <aside className="lg:sticky lg:top-8 lg:self-start">
        {selected ? (
          <MediaDetails
            key={selected.id}
            item={selected}
            pending={pending}
            onDelete={() => {
              if (!confirm(`Delete ${selected.filename}?`)) return;
              startTransition(async () => {
                const result = await deleteMedia(selected.id);
                if (result.ok) {
                  setSelectedId(null);
                  setMessage({ type: "success", text: "Deleted." });
                } else setMessage({ type: "error", text: result.error });
              });
            }}
            onSaveAlt={(alt) =>
              startTransition(async () => {
                await updateMediaAlt(selected.id, alt);
                setMessage({ type: "success", text: "Alt text saved." });
              })
            }
          />
        ) : (
          <p className={cx(ui.card, "p-4 text-sm text-slate-500")}>Select an image to see its details.</p>
        )}
      </aside>
    </div>
  );
}

function MediaDetails({
  item,
  pending,
  onDelete,
  onSaveAlt,
}: {
  item: MediaItem;
  pending: boolean;
  onDelete: () => void;
  onSaveAlt: (alt: string) => void;
}) {
  const [alt, setAlt] = useState(item.alt ?? "");
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (label: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className={cx(ui.card, "space-y-3 p-4")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.url} alt={item.alt ?? ""} className="max-h-60 w-full rounded bg-slate-100 object-contain" />
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-slate-600">
        <dt className="font-medium">File</dt>
        <dd className="truncate" title={item.filename}>
          {item.filename}
        </dd>
        <dt className="font-medium">Size</dt>
        <dd>
          {formatBytes(item.size)}
          {item.width && item.height ? ` · ${item.width}×${item.height}` : ""}
        </dd>
        <dt className="font-medium">Added</dt>
        <dd>{new Date(item.createdAt).toLocaleDateString()}</dd>
      </dl>
      <div>
        <label htmlFor="alt" className={ui.label}>
          Alt text
        </label>
        <textarea id="alt" rows={2} value={alt} onChange={(event) => setAlt(event.target.value)} className={ui.input} />
        <button
          type="button"
          disabled={pending || alt === (item.alt ?? "")}
          onClick={() => onSaveAlt(alt)}
          className={cx(ui.button, ui.secondary, "mt-2 w-full")}
        >
          Save alt text
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => copy("url", new URL(item.url, location.origin).href)} className={cx(ui.button, ui.secondary)}>
          {copied === "url" ? "Copied!" : "Copy URL"}
        </button>
        <button
          type="button"
          onClick={() => copy("md", `![${alt}](${item.url})`)}
          className={cx(ui.button, ui.secondary)}
        >
          {copied === "md" ? "Copied!" : "Copy Markdown"}
        </button>
      </div>
      <button type="button" disabled={pending} onClick={onDelete} className={cx(ui.button, ui.danger, "w-full")}>
        Delete
      </button>
    </div>
  );
}
