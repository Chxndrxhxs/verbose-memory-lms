import type { ReactNode } from "react";
import { CheckCircle2, Circle, Eye, Send } from "@masterlms/shared";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Notice } from "./Controls";

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
    <Modal
      open
      onClose={onCancel}
      size="sm"
      title="Submit Assignment?"
      description="Are you sure you want to submit your assignment? This action cannot be undone."
      footer={
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="secondary" size="sm" block onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" block onClick={onConfirm} disabled={submitting}>
            {submitting ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
                Submitting…
              </>
            ) : (
              <>
                <Send size={14} aria-hidden />
                Submit Assignment
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="border border-rule bg-room-sunk p-4">
        <CountRow
          icon={<CheckCircle2 size={14} className="text-live" aria-hidden />}
          label="Answered"
          value={counts.answered}
          color="text-live"
        />
        <CountRow
          icon={<Circle size={14} className="text-halt" aria-hidden />}
          label="Unanswered"
          value={counts.unanswered}
          color="text-halt"
        />
        <CountRow
          icon={<Eye size={14} className="text-hold" aria-hidden />}
          label="Review Later"
          value={counts.review}
          color="text-hold"
        />
        <CountRow
          icon={<span className="inline-block h-3.5 w-3.5 bg-rule-strong" aria-hidden />}
          label="Not Visited"
          value={counts.notVisited}
          color="text-ink-muted"
        />
        <div className="tnum border-t border-rule pt-2 text-xs font-semibold text-ink">
          Total: {counts.total}
        </div>
      </div>

      {(counts.unanswered > 0 || counts.review > 0) && (
        <div className="mt-3">
          <Notice tone="warn">
            You have {counts.unanswered + counts.review} unanswered or review questions remaining.
          </Notice>
        </div>
      )}
    </Modal>
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
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="flex items-center gap-2 text-ink-muted">
        {icon} {label}
      </span>
      <span className={`tnum font-semibold ${color}`}>{value}</span>
    </div>
  );
}
