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
    <div className="flex h-full min-h-[560px] flex-col overflow-hidden bg-room-deep">
      <div className="flex items-center justify-between border-b border-rule/15 bg-room-deep px-4 py-3 text-ink-inverse">
        <p className="truncate text-xs font-semibold">{title ?? "PDF Document"}</p>
        <div className="flex items-center gap-2 text-xs">
          {numPages && (
            <>
              <button
                type="button"
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                disabled={pageNumber <= 1}
                className="inline-flex items-center gap-1 border border-ink-inverse/25 px-3 py-1 font-semibold text-ink-inverse transition-colors hover:bg-ink-inverse/10 disabled:opacity-40"
              >
                <ArrowLeft size={12} strokeWidth={2.5} aria-hidden /> Prev
              </button>
              <span className="tnum font-medium text-ink-inverse/80">
                {pageNumber} / {numPages}
              </span>
              <button
                type="button"
                onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
                disabled={pageNumber >= numPages}
                className="inline-flex items-center gap-1 border border-ink-inverse/25 px-3 py-1 font-semibold text-ink-inverse transition-colors hover:bg-ink-inverse/10 disabled:opacity-40"
              >
                Next <ArrowRight size={12} strokeWidth={2.5} aria-hidden />
              </button>
            </>
          )}
          <a
            href={absoluteUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 border border-gold-deep bg-gold px-3 py-1 font-semibold text-ink transition-colors hover:bg-gold/90"
          >
            Open <ArrowUpRight size={12} strokeWidth={2.5} aria-hidden />
          </a>
        </div>
      </div>
      <div className="flex w-full flex-1 flex-col items-center justify-start overflow-auto bg-room-deep p-4">
        {loadError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-ink-inverse">
            <p className="text-sm font-semibold text-halt">Failed to render PDF</p>
            <p className="text-xs text-ink-inverse/70">{loadError}</p>
            <a
              href={absoluteUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 border border-gold-deep bg-gold px-4 py-2 text-xs font-semibold text-ink"
            >
              Download PDF <ArrowUpRight size={12} strokeWidth={2.5} aria-hidden />
            </a>
          </div>
        ) : (
          <Document
            file={absoluteUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(err) => setLoadError(err.message)}
            loading={
              <div className="flex items-center justify-center py-20 text-xs text-ink-inverse/70">
                Loading PDF…
              </div>
            }
            error={
              <div className="flex items-center justify-center py-20 text-xs text-halt">
                Unable to load PDF. Check network or file path.
              </div>
            }
            className="flex flex-col items-center overflow-hidden shadow-lg"
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