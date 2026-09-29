import { EXAM_MODULE_META } from "@masterlms/shared";
import { cn } from "../lib/utils";
import { builderCardClass } from "../lib/builder";
import {
  categoryBreakdown,
  chunkCount,
  describeModulePlan,
  formatPackPrice,
  totalPackMarks,
  type PackInfoDraft,
  type PackQuestionDraft,
} from "../types/pack";

type Props = {
  info: PackInfoDraft;
  questions: PackQuestionDraft[];
  status: string;
  saving: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
};

export function PackPublishStep({
  info,
  questions,
  status,
  saving,
  onPublish,
  onUnpublish,
}: Props) {
  const breakdown = categoryBreakdown(questions);
  const plans = describeModulePlan(info, questions.length);
  const untagged = questions.filter((q) => !q.topic.trim()).length;
  const emptyStems = questions.filter((q) => !q.question.trim()).length;
  const mockTests = chunkCount(questions.length, info.test_size);

  const checks = [
    { label: "Title set", ok: info.title.trim().length > 0 },
    {
      label: `At least one question (${questions.length})`,
      ok: questions.length > 0,
    },
    { label: "At least one exam format", ok: info.allowed_modules.length > 0 },
    { label: "Every question has text", ok: emptyStems === 0 },
  ];
  const warnings = [
    untagged > 0 &&
      `${untagged} untagged ${untagged === 1 ? "question" : "questions"} — ` +
        "learners can't filter by category.",
    questions.length > 0 &&
      mockTests > 3 &&
      `${questions.length} questions split into ${mockTests} mock tests ` +
        `of ${info.test_size}. Consider a larger test size.`,
  ].filter(Boolean) as string[];
  const allValid = checks.every((c) => c.ok);
  const price = Number(info.price) || 0;
  const mrp = Number(info.original_price) || 0;

  return (
    <div className="space-y-6">
      <div className={cn(builderCardClass, "overflow-hidden")}>
        <div className="flex flex-col gap-5 sm:flex-row">
          {info.cover.trim() ? (
            <img
              src={info.cover.trim()}
              alt=""
              className="h-36 w-28 shrink-0 rounded-xl border border-zinc-200 object-cover"
            />
          ) : (
            <div
              className={cn(
                "flex h-36 w-28 shrink-0 items-center justify-center rounded-xl",
                "bg-zinc-100 text-xs font-semibold text-zinc-400",
              )}
            >
              No cover
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold tracking-wide text-zinc-400 uppercase">
              {status === "published" ? "Live in store" : "Draft"} ·{" "}
              {info.max_attempts > 0
                ? `${info.max_attempts} shared attempts`
                : "Unlimited attempts"}
            </p>
            <h2 className="mt-1 text-xl font-bold text-zinc-900">
              {info.title || "Untitled pack"}
            </h2>
            {info.description && (
              <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{info.description}</p>
            )}
            <p className="mt-2 flex flex-wrap items-baseline gap-2">
              <span className="text-lg font-bold text-zinc-900">
                {formatPackPrice(info.price)}
              </span>
              {mrp > price && mrp > 0 && (
                <span className="text-sm text-zinc-400 line-through">
                  ₹{mrp.toLocaleString("en-IN")}
                </span>
              )}
              <span className="text-xs text-zinc-500">
                · {questions.length} question{questions.length === 1 ? "" : "s"} ·{" "}
                {totalPackMarks(questions)} marks · pass {info.passing_percentage || 50}%
              </span>
            </p>
          </div>
        </div>

        {breakdown.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-zinc-100 px-6 py-3">
            {breakdown.map(([topic, n]) => (
              <span
                key={topic}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  topic === "Untagged"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-zinc-100 text-zinc-600",
                )}
              >
                {topic} · {n}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={builderCardClass}>
        <h3 className="text-[15px] font-bold text-zinc-900">What learners get</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {plans.map((plan) => {
            const meta = EXAM_MODULE_META[plan.module];
            return (
              <div key={plan.module} className="rounded-2xl border border-zinc-200/70 bg-zinc-50/70 p-4">
                <p className="text-[15px] font-bold">{meta.label}</p>
                <p className="mt-1.5 text-sm text-zinc-600">{plan.summary}</p>
                <p className="mt-2 text-xs font-semibold text-zinc-400">
                  {meta.proctored ? "Proctored" : "No proctoring"} ·{" "}
                  {meta.untimed ? "Untimed" : "Timed"}
                </p>
              </div>
            );
          })}
          {plans.length === 0 && (
            <p className="text-sm text-red-600">No exam format enabled.</p>
          )}
        </div>
      </div>

      <div className={builderCardClass}>
        <h3 className="text-[15px] font-bold text-zinc-900">Pre-publish check</h3>
        <ul className="mt-4 space-y-2.5">
          {checks.map((check) => (
            <li key={check.label} className="flex items-center gap-2.5 text-[15px]">
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold",
                  check.ok ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-400",
                )}
              >
                {check.ok ? "✓" : "·"}
              </span>
              <span className={check.ok ? "text-zinc-800" : "text-zinc-400"}>
                {check.label}
              </span>
            </li>
          ))}
        </ul>
        {warnings.map((warning) => (
          <p key={warning} className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {warning}
          </p>
        ))}

        <div className="mt-6">
          {status === "published" ? (
            <div>
              <button
                onClick={onUnpublish}
                disabled={saving}
                className={cn(
                  "h-12 rounded-full border border-zinc-300 px-6",
                  "text-sm font-semibold hover:bg-zinc-50 disabled:opacity-50",
                )}
              >
                {saving ? "Working…" : "Unpublish"}
              </button>
              <p className="mt-2.5 text-sm text-zinc-500">
                Unpublishing hides the pack from the store. Past buyers keep their history.
              </p>
            </div>
          ) : (
            <div>
              <button
                onClick={onPublish}
                disabled={saving || !allValid}
                className={cn(
                  "h-12 rounded-full bg-emerald-600 px-6 text-sm font-semibold",
                  "text-white hover:bg-emerald-700 disabled:opacity-50",
                )}
              >
                {saving ? "Publishing…" : "Publish pack"}
              </button>
              {!allValid && (
                <p className="mt-2.5 text-sm text-zinc-500">
                  Finish the checks above to publish.
                </p>
              )}
              {allValid && (
                <p className="mt-2.5 text-sm text-zinc-500">
                  Publishing builds the hidden exams — learners can buy it right away.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
