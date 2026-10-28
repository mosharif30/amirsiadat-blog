"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const noSubscription = () => () => {};

async function copyText(text: string) {
  try {
    return await navigator.clipboard.writeText(text);
  } catch {
    // No Clipboard API (older browsers, plain http) or the browser refused: use a selection.
  }
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();
  const ok = document.execCommand("copy");
  field.remove();
  if (!ok) throw new Error("Copy failed");
}

/** "Copy link" (and the native share sheet where the browser has one) at the end of a post. */
export default function ShareLinks({ url, title }: { url: string; title: string }) {
  const canShare = useSyncExternalStore(noSubscription, () => typeof navigator.share === "function", () => false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const button = "transition-colors duration-200 hover:text-gray-900";

  return (
    <div className="flex items-center gap-6 pt-4 text-sm text-gray-500">
      <button
        type="button"
        className={button}
        onClick={() => copyText(url).then(() => setCopied(true), () => {})}
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
      {canShare && (
        <button type="button" className={button} onClick={() => navigator.share({ title, url }).catch(() => {})}>
          Share
        </button>
      )}
      <span aria-live="polite" className="sr-only">
        {copied ? "Link copied to the clipboard" : ""}
      </span>
    </div>
  );
}
