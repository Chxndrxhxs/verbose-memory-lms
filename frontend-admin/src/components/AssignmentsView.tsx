import { useState } from "react";
import {
  Archive,
  Check,
  Copy,
  Trash2,
  type AssignmentDetail,
} from "@masterlms/shared";
import { Card } from "./Card";
import { ConfirmDialog } from "./ConfirmDialog";

type Props = {
  assignments: AssignmentDetail[];
  loading: boolean;
  error: string | null;
  busy: boolean;
  onPublish: (id: number) => void;
  onUnpublish: (id: number) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
};

export function AssignmentsView({
  assignments,
  loading,
  error,
  busy,
  onPublish,
  onUnpublish,
  onDuplicate,
  onDelete,
}: Props) {
  const [target, setTarget] = useState<AssignmentDetail | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">Assignments</h1>
        <p className="text-sm text-zinc-500">
          Manage published assessments across categories.
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="divide-y">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex animate-pulse items-center gap-3 px-5 py-4">
                <div className="h-4 w-40 rounded bg-zinc-200" />
                <div className="ml-auto h-4 w-24 rounded bg-zinc-200" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="px-5 py-8 text-center text-sm text-red-600">{error}</p>
        ) : assignments.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-400">
            No assignments yet. Create one in the instructor console.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-[11px] uppercase tracking-wider text-zinc-400">
                  <th className="px-5 py-3 font-semibold">Assignment</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Models</th>
                  <th className="px-5 py-3 font-semibold">Duration</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-50/60">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-zinc-800">{a.title}</p>
                      <p className="text-xs text-zinc-400">
                        {a.questions_count} questions
                      </p>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">
                      {a.inter_category ? categoryLabel(a.inter_category) : "—"}
                    </td>
                    <td className="px-5 py-3 text-zinc-600">
                      {(a.models?.length ?? a.models_preview.length) || 0}
                    </td>
                    <td className="px-5 py-3 text-zinc-600 tabular-nums">{a.duration_label}</td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          a.status === "published"
                            ? "rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700"
                            : "rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-bold text-zinc-500"
                        }
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {a.status === "published" ? (
                          <button
                            onClick={() => onUnpublish(a.id)}
                            disabled={busy}
                            title="Unpublish"
                            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 disabled:opacity-50"
                          >
                            <Archive size={16} strokeWidth={2.5} />
                          </button>
                        ) : (
                          <button
                            onClick={() => onPublish(a.id)}
                            disabled={busy}
                            title="Publish"
                            className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                          >
                            <Check size={16} strokeWidth={2.5} />
                          </button>
                        )}
                        <button
                          onClick={() => onDuplicate(a.id)}
                          disabled={busy}
                          title="Duplicate"
                          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 disabled:opacity-50"
                        >
                          <Copy size={16} strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => setTarget(a)}
                          disabled={busy}
                          title="Delete"
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={target !== null}
        title="Delete assignment?"
        description={`Delete "${target?.title}"? All models, questions and learner attempts are removed. This cannot be undone.`}
        busy={busy}
        onConfirm={() => {
          if (target) onDelete(target.id);
          setTarget(null);
        }}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}

function categoryLabel(inter: AssignmentDetail["inter_category"]): string {
  if (!inter) return "—";
  return `${inter.sub_category.category.name} / ${inter.sub_category.name} / ${inter.name}`;
}