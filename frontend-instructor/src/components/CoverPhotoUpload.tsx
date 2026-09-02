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
      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <div className="group relative h-36 w-full">
          <img src={src} alt="Course cover" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-100"
            >
              {uploading ? "Uploading…" : "Change"}
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-zinc-100"
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
      className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-zinc-500 transition-colors hover:bg-zinc-100"
    >
      {uploading ? (
        <span className="text-xs font-semibold">Uploading…</span>
      ) : (
        <>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
            <ImageIcon size={18} className="text-zinc-600" />
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
            <Upload size={13} /> Add course cover
          </span>
        </>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
    </button>
  );
}