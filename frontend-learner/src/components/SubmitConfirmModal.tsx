import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Circle, Eye, Send } from "@masterlms/shared";

type Counts = {
  answered: number;
  unanswered: number;
  review: number;
  notVisited: number;
  total: number;
};

type Props = {
  counts: Counts;
  onConfirm: () => void;
  onCancel: () => void;
  submitting: boolean;
};

export function SubmitConfirmModal({ counts, onConfirm, onCancel, submitting }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle size={18} className="text-amber-600" />
          </div>
          <h2 className="text-base font-bold text-zinc-900">Submit Assignment?</h2>
        </div>

        <p className="mt-3 text-sm text-zinc-500">
          Are you sure you want to submit your assignment? This action cannot be undone.
        </p>

        <div className="mt-4 space-y-2 rounded-xl bg-zinc-50 p-4">
          <CountRow
            icon={<CheckCircle2 size={14} className="text-emerald-500" />}
            label="Answered"
            value={counts.answered}
            color="text-emerald-700"
          />
          <CountRow
            icon={<Circle size={14} className="text-red-500" />}
            label="Unanswered"
            value={counts.unanswered}
            color="text-red-700"
          />
          <CountRow
            icon={<Eye size={14} className="text-orange-500" />}
            label="Review Later"
            value={counts.review}
            color="text-orange-700"
          />
          <CountRow
            icon={<span className="inline-block h-3.5 w-3.5 rounded-sm bg-zinc-400" />}
            label="Not Visited"
            value={counts.notVisited}
            color="text-zinc-600"
          />
          <div className="border-t border-zinc-200 pt-2 text-xs font-semibold text-zinc-700">
            Total: {counts.total}
          </div>
        </div>

        {(counts.unanswered > 0 || counts.review > 0) && (
          <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            You have {counts.unanswered + counts.review} unanswered or review questions remaining.
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Submitting…
              </>
            ) : (
              <>
                <Send size={14} />
                Submit Assignment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function CountRow({
  icon,
  label,
  value,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-zinc-600">
        {icon} {label}
      </span>
      <span className={`font-bold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
