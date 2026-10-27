"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cx, ui } from "./ui";
import { ACCEPTED_IMAGES, uploadImage, type MediaItem } from "./upload";

type MediaPickerProps = {
  open: boolean;
  media: MediaItem[];
  title?: string;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
  onUploaded: (item: MediaItem) => void;
};

/** Modal to pick an existing image or upload a new one. */
export default function MediaPicker({ open, media, title = "Choose an image", onClose, onSelect, onUploaded }: MediaPickerProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? media.filter((item) => `${item.filename} ${item.alt ?? ""}`.toLowerCase().includes(term)) : media;
  }, [media, query]);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const item = await uploadImage(file);
      onUploaded(item);
      onSelect(item);
    } catch (uploadError) {
      setError((uploadError as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(event) => event.target === dialog.current && onClose()}
      className="w-[min(56rem,calc(100vw-2rem))] rounded-lg p-0 shadow-xl backdrop:bg-slate-900/50"
    >
      <div className="flex max-h-[80vh] flex-col">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by name…"
            className={cx(ui.input, "max-w-xs flex-1 py-1.5")}
          />
          <label className={cx(ui.button, ui.primary, "cursor-pointer", uploading && "opacity-60")}>
            {uploading ? "Uploading…" : "Upload new"}
            <input
              type="file"
              accept={ACCEPTED_IMAGES}
              className="sr-only"
              disabled={uploading}
              onChange={(event) => handleFiles(event.target.files)}
            />
          </label>
          <button type="button" onClick={onClose} className={cx(ui.button, ui.ghost, "ml-auto")} aria-label="Close">
            ✕
          </button>
        </div>
        {error && <p className="bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
        <div className="grid grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3 md:grid-cols-4">
          {visible.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className="group overflow-hidden rounded-md border border-slate-200 text-left hover:border-customBlue focus:outline-none focus-visible:ring-2 focus-visible:ring-customBlue"
            >
              <div className="aspect-[4/3] bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.alt ?? ""} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <p className="truncate px-2 py-1 text-xs text-slate-600 group-hover:text-customBlue">{item.filename}</p>
            </button>
          ))}
          {visible.length === 0 && <p className="col-span-full py-8 text-center text-sm text-slate-500">No images found.</p>}
        </div>
      </div>
    </dialog>
  );
}
