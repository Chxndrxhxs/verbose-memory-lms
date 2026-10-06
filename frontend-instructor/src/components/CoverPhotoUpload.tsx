import { useRef, useState } from "react";
import { ImageIcon, Upload } from "@masterlms/shared";
import { absoluteMediaUrl, uploadFile } from "../lib/api";

type Props = {
  value: string;
  onChange: (url: string) => void;
};

export function CoverPhotoUpload({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const src = absoluteMediaUrl(value);

  const handleFile = async (file: File | undefined) => {
    if (!file || uploading) return;
    setUploading(true);
    try {
      const { url } = await uploadFile(file);
      onChange(url);
    } catch {
      alert("Upload failed — try again");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  if (src) {
    return (
      <div className="overflow-hidden border border-rule">
        <div className="group relative aspect-[16/9] max-h-[440px] w-full">
          <img src={src} alt="Course cover" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-ink/50 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-sm bg-slate-panel px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-sunk"
            >
              {uploading ? "Uploading…" : "Change"}
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-sm bg-slate-panel px-3 py-1.5 text-xs font-semibold text-halt hover:bg-slate-sunk"
            >
              Remove
            </button>
          </div>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={uploading}
      className="flex aspect-[16/9] max-h-[440px] w-full flex-col items-center justify-center gap-2 border border-dashed border-rule-strong bg-slate-sunk text-ink-muted transition-colors hover:bg-slate-panel"
    >
      {uploading ? (
        <span className="text-xs font-semibold">Uploading…</span>
      ) : (
        <>
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-rule bg-slate-panel">
            <ImageIcon size={18} className="text-ink-muted" />
          </span>
          <span className="inline-flex items-center gap-2 text-xs font-semibold">
            <Upload size={13} /> Add course cover
          </span>
        </>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
    </button>
  );
}