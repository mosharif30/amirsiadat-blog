"use client";

import { NodeSelection } from "@tiptap/pm/state";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { prosemirrorToMarkdown } from "@/lib/markdown/prosemirror";
import { markdownToEditorHtml } from "@/lib/markdown/to-editor-html";
import MediaPicker from "../MediaPicker";
import { cx, ui } from "../ui";
import { uploadImage, type MediaItem } from "../upload";
import styles from "./editor.module.css";
import { createEditorExtensions, parseOptions } from "./extensions";
import LinkDialog, { type LinkDialogState } from "./LinkDialog";

type RichTextEditorProps = {
  /** Markdown. */
  value: string;
  onChange: (markdown: string) => void;
  media: MediaItem[];
  onMediaUploaded: (item: MediaItem) => void;
};

/**
 * Word-like editor for post content. Loads Markdown into TipTap and saves it back as Markdown
 * (lib/markdown/*), so posts that are opened but not edited are stored byte-for-byte unchanged.
 * A Markdown source view remains available for advanced edits.
 */
export default function RichTextEditor({ value, onChange, media, onMediaUploaded }: RichTextEditorProps) {
  const [mode, setMode] = useState<"visual" | "markdown">("visual");
  const [link, setLink] = useState<LinkDialogState | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [initialHtml] = useState(() => markdownToEditorHtml(value));

  // Handlers used inside editor callbacks, which are created once (kept current below).
  const handlers = useRef<{
    onChange: (markdown: string) => void;
    openLink: () => void;
    insertFiles: (files: File[], pos?: number) => Promise<void>;
  }>({ onChange, openLink: () => {}, insertFiles: async () => {} });

  const editor = useEditor({
    extensions: createEditorExtensions({ placeholder: "Start writing… Paste or drop images to upload them." }),
    content: initialHtml,
    parseOptions,
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: { class: "min-h-[28rem] focus:outline-none", spellcheck: "true", "aria-label": "Post content" },
      handleKeyDown: (_view, event) => {
        if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "k") {
          event.preventDefault();
          handlers.current.openLink();
          return true;
        }
        return false;
      },
      handlePaste: (_view, event) => {
        const files = [...(event.clipboardData?.files ?? [])].filter((file) => file.type.startsWith("image/"));
        if (files.length === 0) return false;
        void handlers.current.insertFiles(files);
        return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        const files = [...(event.dataTransfer?.files ?? [])].filter((file) => file.type.startsWith("image/"));
        if (moved || files.length === 0) return false;
        const position = view.posAtCoords({ left: event.clientX, top: event.clientY });
        void handlers.current.insertFiles(files, position?.pos);
        return true;
      },
    },
    onUpdate: ({ editor }) => handlers.current.onChange(prosemirrorToMarkdown(editor.getJSON())),
  });

  const active = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            h2: editor.isActive("heading", { level: 2 }),
            h3: editor.isActive("heading", { level: 3 }),
            bold: editor.isActive("bold"),
            italic: editor.isActive("italic"),
            strike: editor.isActive("strike"),
            bulletList: editor.isActive("bulletList"),
            orderedList: editor.isActive("orderedList"),
            blockquote: editor.isActive("blockquote"),
            link: editor.isActive("link"),
            image: editor.isActive("image"),
            canUndo: editor.can().undo(),
            canRedo: editor.can().redo(),
          }
        : null,
  });

  const openLink = () => {
    if (!editor) return;
    const { empty } = editor.state.selection;
    const href = (editor.getAttributes("link").href as string | undefined) ?? "";
    setLink({ id: Date.now(), href, withText: empty && !href, editing: !!href });
  };

  const insertFiles = async (files: File[], pos?: number) => {
    if (!editor) return;
    setError(null);
    setUploading((count) => count + files.length);
    let at = pos;
    for (const file of files) {
      try {
        const item = await uploadImage(file);
        onMediaUploaded(item);
        const image = { type: "image", attrs: { src: item.url, alt: item.alt || null } };
        if (at === undefined) editor.chain().focus().insertContent(image).run();
        else {
          editor.chain().focus().insertContentAt(at, image).run();
          at = editor.state.selection.to;
        }
      } catch (uploadError) {
        setError(`${file.name}: ${(uploadError as Error).message}`);
      } finally {
        setUploading((count) => count - 1);
      }
    }
  };

  useEffect(() => {
    handlers.current = { onChange, openLink, insertFiles };
  });

  function saveLink({ href, text }: { href: string; text: string }) {
    if (!editor) return;
    if (link?.withText) {
      editor
        .chain()
        .focus()
        .insertContent({ type: "text", text: text || href, marks: [{ type: "link", attrs: { href } }] })
        .unsetMark("link")
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    setLink(null);
  }

  function editAltText() {
    if (!editor) return;
    const { selection } = editor.state;
    if (!(selection instanceof NodeSelection) || selection.node.type.name !== "image") return;
    const alt = prompt("Describe the image (alt text)", (selection.node.attrs.alt as string) ?? "");
    if (alt !== null) editor.chain().focus().updateAttributes("image", { alt: alt.trim() || null }).run();
  }

  function switchMode(next: "visual" | "markdown") {
    if (next === mode) return;
    // Re-load the (possibly hand-edited) Markdown; no update is emitted, so nothing is re-serialized.
    if (next === "visual") editor?.commands.setContent(markdownToEditorHtml(value), { emitUpdate: false, parseOptions });
    setMode(next);
  }

  const disabled = mode !== "visual" || !editor;
  const run = (command: (editor: Editor) => void) => () => editor && command(editor);

  return (
    <div className={ui.card}>
      <div
        role="toolbar"
        aria-label="Formatting"
        className="sticky top-0 z-20 flex flex-wrap items-center gap-0.5 rounded-t-lg border-b border-slate-200 bg-slate-50/95 px-2 py-1.5 backdrop-blur"
      >
        <ToolButton label="Undo (Ctrl+Z)" disabled={disabled || !active?.canUndo} onClick={run((e) => e.chain().focus().undo().run())}>
          <Icon paths={["M3 7v6h6", "M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"]} />
        </ToolButton>
        <ToolButton label="Redo (Ctrl+Shift+Z)" disabled={disabled || !active?.canRedo} onClick={run((e) => e.chain().focus().redo().run())}>
          <Icon paths={["M21 7v6h-6", "M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"]} />
        </ToolButton>
        <Separator />
        <ToolButton label="Heading" active={active?.h2} disabled={disabled} onClick={run((e) => e.chain().focus().toggleHeading({ level: 2 }).run())}>
          <span className="text-sm font-bold">H2</span>
        </ToolButton>
        <ToolButton label="Subheading" active={active?.h3} disabled={disabled} onClick={run((e) => e.chain().focus().toggleHeading({ level: 3 }).run())}>
          <span className="text-sm font-bold">H3</span>
        </ToolButton>
        <Separator />
        <ToolButton label="Bold (Ctrl+B)" active={active?.bold} disabled={disabled} onClick={run((e) => e.chain().focus().toggleBold().run())}>
          <Icon paths={["M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"]} strokeWidth={2.5} />
        </ToolButton>
        <ToolButton label="Italic (Ctrl+I)" active={active?.italic} disabled={disabled} onClick={run((e) => e.chain().focus().toggleItalic().run())}>
          <Icon paths={["M19 4h-9", "M14 20H5", "M15 4 9 20"]} />
        </ToolButton>
        <ToolButton label="Strikethrough (Ctrl+Shift+S)" active={active?.strike} disabled={disabled} onClick={run((e) => e.chain().focus().toggleStrike().run())}>
          <Icon paths={["M16 4H9a3 3 0 0 0-2.83 4", "M14 12a4 4 0 0 1 0 8H6", "M4 12h16"]} />
        </ToolButton>
        <Separator />
        <ToolButton label="Bulleted list" active={active?.bulletList} disabled={disabled} onClick={run((e) => e.chain().focus().toggleBulletList().run())}>
          <Icon paths={["M3 6h.01", "M3 12h.01", "M3 18h.01", "M8 6h13", "M8 12h13", "M8 18h13"]} />
        </ToolButton>
        <ToolButton label="Numbered list" active={active?.orderedList} disabled={disabled} onClick={run((e) => e.chain().focus().toggleOrderedList().run())}>
          <Icon paths={["M10 6h11", "M10 12h11", "M10 18h11", "M4 6h1v4", "M4 10h2", "M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"]} />
        </ToolButton>
        <ToolButton label="Quote" active={active?.blockquote} disabled={disabled} onClick={run((e) => e.chain().focus().toggleBlockquote().run())}>
          <Icon paths={["M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z", "M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"]} />
        </ToolButton>
        <ToolButton label="Divider" disabled={disabled} onClick={run((e) => e.chain().focus().setHorizontalRule().run())}>
          <Icon paths={["M4 12h16"]} />
        </ToolButton>
        <Separator />
        <ToolButton label="Link (Ctrl+K)" active={active?.link} disabled={disabled} onClick={openLink}>
          <Icon paths={["M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71", "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"]} />
        </ToolButton>
        <ToolButton label="Insert image" disabled={disabled} onClick={() => setPickerOpen(true)}>
          <Icon paths={["M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z", "M9 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"]} />
        </ToolButton>
        {active?.image && mode === "visual" && (
          <button type="button" onClick={editAltText} className={cx(ui.button, ui.ghost, "h-8 px-2 text-xs")}>
            Alt text
          </button>
        )}
        {uploading > 0 && <span className="px-2 text-xs text-slate-500">Uploading {uploading}…</span>}

        <div className="ml-auto flex rounded-md border border-slate-300 bg-white p-0.5 text-xs" role="tablist" aria-label="Editor mode">
          {(["visual", "markdown"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={mode === option}
              onClick={() => switchMode(option)}
              className={cx(
                "rounded px-2.5 py-1 font-medium",
                mode === option ? "bg-customBlue text-white" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {option === "visual" ? "Visual" : "Markdown"}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="border-b border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {/* The canvas uses the public post's text styles, so what you see is what gets published. */}
      <div className={cx(styles.canvas, "rounded-b-lg bg-white px-5 py-6 text-base text-black lg:px-8", mode !== "visual" && "hidden")}>
        <EditorContent editor={editor} />
      </div>
      {mode === "markdown" && (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          spellCheck
          aria-label="Content (Markdown)"
          className="block min-h-[32rem] w-full resize-y rounded-b-lg border-0 p-4 font-mono text-sm leading-6 text-slate-900 focus:outline-none focus:ring-0"
        />
      )}

      <LinkDialog
        state={link}
        onClose={() => {
          setLink(null);
          editor?.commands.focus();
        }}
        onSave={saveLink}
        onRemove={() => {
          editor?.chain().focus().extendMarkRange("link").unsetLink().run();
          setLink(null);
        }}
      />
      <MediaPicker
        open={pickerOpen}
        media={media}
        title="Insert an image"
        onClose={() => setPickerOpen(false)}
        onUploaded={onMediaUploaded}
        onSelect={(item) => {
          setPickerOpen(false);
          editor?.chain().focus().setImage({ src: item.url, alt: item.alt ?? undefined }).run();
        }}
      />
    </div>
  );
}

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active ?? undefined}
      disabled={disabled}
      // Keep the editor's selection when clicking toolbar buttons.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cx(
        "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-40",
        active ? "bg-customBlue text-white" : "hover:bg-slate-200",
      )}
    >
      {children}
    </button>
  );
}

const Separator = () => <span aria-hidden className="mx-1 h-5 w-px bg-slate-300" />;

function Icon({ paths, strokeWidth = 2 }: { paths: string[]; strokeWidth?: number }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
