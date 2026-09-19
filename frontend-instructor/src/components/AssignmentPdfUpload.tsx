import { useCallback, useRef, useState } from "react";
import { Upload, X, FileText, AlertCircle } from "@masterlms/shared";
import { cn } from "../lib/utils";
import { uploadFile } from "../lib/api";
import type { Assignment } from "../types/assignment";

type Props = {
  assignment: Assignment;
  onChange: (patch: Partial<Assignment>) => void;
};

const MAX_SIZE_MB = 25;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export function AssignmentPdfUploadStep({ assignment, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];

      setError(null);
      setUploadSuccess(false);

      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Only PDF, DOCX, or TXT files are accepted.");
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`File too large. Maximum size is ${MAX_SIZE_MB}MB.`);
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      try {
        const progressInterval = setInterval(() => {
          setUploadProgress((p) => Math.min(p + 10, 90));
        }, 200);

        const { url } = await uploadFile(file);

        clearInterval(progressInterval);
        setUploadProgress(100);

        onChange({
          sourceDocument: url,
          sourceDocumentName: file.name,
        });

        setUploadSuccess(true);
      } catch {
        setError("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removeFile = () => {
    onChange({
      sourceDocument: "",
      sourceDocumentName: "",
    });
    setUploadSuccess(false);
    setError(null);
    setUploadProgress(0);
  };

  const hasFile = Boolean(assignment.sourceDocument || assignment.sourceDocumentName);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-zinc-900">Upload Source Document</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Upload the PDF, DOCX, or TXT file that AI will use to generate questions.
      </p>

      <div className="mt-6">
        {hasFile ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <FileText size={18} className="text-red-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-900">
                  {assignment.sourceDocumentName || "Uploaded PDF"}
                </p>
                {uploadSuccess && (
                  <p className="text-xs text-emerald-600">Uploaded successfully</p>
                )}
              </div>
              <button
                onClick={removeFile}
                disabled={uploading}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700"
              >
                <X size={16} />
              </button>
            </div>

            {uploading && (
              <div className="mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
                  <div
                    className="h-full rounded-full bg-zinc-900 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Uploading… {uploadProgress}%
                </p>
              </div>
            )}
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors",
              dragOver
                ? "border-zinc-900 bg-zinc-50"
                : "border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100"
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
              <Upload size={20} className="text-zinc-500" />
            </div>
            <p className="mt-3 text-sm font-semibold text-zinc-700">
              Drop your PDF, DOCX, or TXT here, or click to browse
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              PDF, DOCX, or TXT files up to {MAX_SIZE_MB}MB
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
