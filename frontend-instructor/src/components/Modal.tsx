import { useEffect, useRef, type ReactNode } from "react";
import { X } from "@masterlms/shared";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared overlay: traps focus, closes on Escape, restores focus to the
 * trigger, and locks background scroll. Every modal in the app uses this so
 * the behaviour is identical and the focus ring never escapes.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const items = () =>
      Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);

    items()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const list = items();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      restoreRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const width = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-3xl",
    xl: "max-w-6xl",
  }[size];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-0 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? "modal-desc" : undefined}
        className={`flex max-h-[92vh] w-full ${width} flex-col border border-rule-strong bg-slate-panel shadow-[0_24px_60px_-15px_rgba(20,24,38,0.4)]`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-rule px-5 py-4">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-base font-semibold text-ink">
              {title}
            </h2>
            {description && (
              <p id="modal-desc" className="mt-1 text-sm leading-relaxed text-ink-muted">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center text-ink-faint transition-colors hover:bg-slate-sunk hover:text-ink"
          >
            <X size={17} strokeWidth={2.25} aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <footer className="shrink-0 border-t border-rule bg-slate-ground px-5 py-3.5">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}