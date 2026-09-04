import { Check, X } from "@masterlms/shared";
import { cn } from "../lib/utils";

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center">
      <div className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-extrabold tracking-tight">Publish course?</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Learners will see it immediately. Fix red items first.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <ul className="mt-4 space-y-2">
          {checks.map((c) => (
            <li
              key={c.label}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm",
                c.ok ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white",
                  c.ok ? "bg-emerald-500" : "bg-red-500"
                )}
              >
                {c.ok ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-zinc-900">{c.label}</span>
                {c.hint && !c.ok && <span className="block text-xs text-zinc-500">{c.hint}</span>}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border py-2.5 text-sm font-semibold hover:bg-zinc-50"
          >
            Keep editing
          </button>
          <button
            onClick={onConfirm}
            disabled={!allOk || publishing}
            className="flex-1 rounded-full bg-[#0f172a] py-2.5 text-sm font-bold text-white hover:bg-black disabled:opacity-40"
          >
            {publishing ? "Publishing…" : "Publish to learners"}
          </button>
        </div>
      </div>
    </div>
  );
}
