import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "@masterlms/shared";
import { absoluteMediaUrl } from "../lib/api";

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

type Props = { url: string; title?: string };

export function PdfReader({ url, title }: Props) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loadError, setLoadError] = useState<string | null>(null);

  const resolvedUrl = absoluteMediaUrl(url);
  const absoluteUrl = resolvedUrl && resolvedUrl.startsWith("http") ? resolvedUrl : resolvedUrl ? `http://localhost:8000${resolvedUrl}` : "";

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
    setLoadError(null);
  }

  return (
    <div className="flex h-full min-h-[560px] flex-col bg-zinc-900 rounded-[20px] overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 bg-zinc-900 px-4 py-3 text-white">
        <p className="truncate text-xs font-semibold">{title ?? "PDF Document"}</p>
        <div className="flex items-center gap-2 text-xs">
          {numPages && (
            <>
              <button
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                disabled={pageNumber <= 1}
                className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-semibold text-white disabled:opacity-40"
              >
                <ArrowLeft size={12} strokeWidth={2.5} /> Prev
              </button>
              <span className="font-medium text-white/80">
                {pageNumber} / {numPages}
              </span>
              <button
                onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
                disabled={pageNumber >= numPages}
                className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-semibold text-white disabled:opacity-40"
              >
                Next <ArrowRight size={12} strokeWidth={2.5} />
              </button>
            </>
          )}
          <a
            href={absoluteUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 font-semibold text-zinc-900 hover:bg-zinc-100"
          >
            Open <ArrowUpRight size={12} strokeWidth={2.5} />
          </a>
        </div>
      </div>
      <div className="flex-1 w-full bg-zinc-950 flex flex-col items-center justify-start p-4 overflow-auto">
        {loadError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-white">
            <p className="text-sm font-semibold text-red-400">Failed to render PDF</p>
            <p className="text-xs text-white/70">{loadError}</p>
            <a
              href={absoluteUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-zinc-900"
            >
              Download PDF <ArrowUpRight size={12} strokeWidth={2.5} />
            </a>
          </div>
        ) : (
          <Document
            file={absoluteUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(err) => setLoadError(err.message)}
            loading={
              <div className="flex items-center justify-center py-20 text-xs text-white/70">
                Loading PDF…
              </div>
            }
            error={
              <div className="flex items-center justify-center py-20 text-xs text-red-400">
                Unable to load PDF. Check network or file path.
              </div>
            }
            className="flex flex-col items-center shadow-2xl rounded-lg overflow-hidden"
          >
            <Page
              pageNumber={pageNumber}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="max-w-full"
            />
          </Document>
        )}
      </div>
    </div>
  );
}