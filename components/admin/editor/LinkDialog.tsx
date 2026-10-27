"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { cx, ui } from "../ui";

export type LinkDialogState = {
  /** Unique per opening: the form is re-created (and its fields reset) for each one. */
  id: number;
  href: string;
  /** Ask for the link text too (nothing selected). */
  withText: boolean;
  /** The cursor is on an existing link (offer "Remove link"). */
  editing: boolean;
};

type LinkDialogProps = {
  state: LinkDialogState | null;
  onClose: () => void;
  onSave: (link: { href: string; text: string }) => void;
  onRemove: () => void;
};

/** Adds https:// to bare domains; keeps relative, anchor, mailto and footnote (endrefN) links. */
export function normalizeHref(value: string): string {
  const href = value.trim();
  if (/^(?:[a-z][a-z0-9+.-]*:|\/|#|\?|endref)/i.test(href)) return href;
  if (/^[^\s/]+\.[^\s/]+/.test(href)) return `https://${href}`;
  return href;
}

export default function LinkDialog({ state, onClose, onSave, onRemove }: LinkDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (state && !element.open) element.showModal();
    if (!state && element.open) element.close();
  }, [state]);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(event) => event.target === dialog.current && onClose()}
      className="w-[min(28rem,calc(100vw-2rem))] rounded-lg p-0 shadow-xl backdrop:bg-slate-900/50"
    >
      {state && <LinkForm key={state.id} state={state} onClose={onClose} onSave={onSave} onRemove={onRemove} />}
    </dialog>
  );
}

function LinkForm({ state, onClose, onSave, onRemove }: Omit<LinkDialogProps, "state"> & { state: LinkDialogState }) {
  const [href, setHref] = useState(state.href);
  const [text, setText] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!href.trim()) return;
    onSave({ href: normalizeHref(href), text: text.trim() });
  }

  return (
    <form onSubmit={submit} className="space-y-4 p-5">
      <h2 className="text-base font-semibold text-slate-900">{state.editing ? "Edit link" : "Insert link"}</h2>
      <div>
        <label htmlFor="link-href" className={ui.label}>
          URL
        </label>
        <input
          id="link-href"
          value={href}
          onChange={(event) => setHref(event.target.value)}
          placeholder="https://example.com"
          autoFocus
          required
          className={ui.input}
        />
        <p className={ui.hint}>Web address, or endref1 / endref1p for footnotes.</p>
      </div>
      {state.withText && (
        <div>
          <label htmlFor="link-text" className={ui.label}>
            Text
          </label>
          <input
            id="link-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Defaults to the URL"
            className={ui.input}
          />
        </div>
      )}
      <div className="flex items-center gap-2">
        {state.editing && (
          <button type="button" onClick={onRemove} className={cx(ui.button, "px-2 text-red-600 hover:bg-red-50")}>
            Remove link
          </button>
        )}
        <button type="button" onClick={onClose} className={cx(ui.button, ui.ghost, "ml-auto")}>
          Cancel
        </button>
        <button type="submit" className={cx(ui.button, ui.primary)}>
          {state.editing ? "Update" : "Insert"}
        </button>
      </div>
    </form>
  );
}
