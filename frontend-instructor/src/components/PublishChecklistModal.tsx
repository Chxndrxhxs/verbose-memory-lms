import { Check, X } from "@masterlms/shared";
import { cn } from "../lib/utils";
import { Modal } from "./Modal";

export type PublishCheck = { label: string; ok: boolean; hint?: string };

export function PublishChecklistModal({
  checks,
  publishing,
  onConfirm,
  onClose,
}: {
  checks: PublishCheck[];
  publishing: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const allOk = checks.every((c) => c.ok);
  return (
    <Modal
      open
      onClose={onClose}
      title="Publish course?"
      description="Learners will see it immediately. Fix red items first."
      size="sm"
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-sm border border-rule py-2 text-sm font-semibold text-ink-muted hover:bg-slate-sunk"
          >
            Keep editing
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!allOk || publishing}
            className="flex-1 rounded-sm bg-ink py-2 text-sm font-semibold text-ink-inverse hover:opacity-90 disabled:opacity-40"
          >
            {publishing ? "Publishing…" : "Publish to learners"}
          </button>
        </div>
      }
    >
      <ul className="space-y-2">
        {checks.map((c) => (
          <li
            key={c.label}
            className={cn(
              "flex items-center gap-2 rounded-sm border px-3 py-2 text-sm",
              c.ok
                ? "border-live/25 bg-live-soft"
                : "border-halt/25 bg-halt-soft"
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-ink-inverse",
                c.ok ? "bg-live" : "bg-halt"
              )}
            >
              {c.ok ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-ink">{c.label}</span>
              {c.hint && !c.ok && <span className="block text-xs text-ink-muted">{c.hint}</span>}
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
