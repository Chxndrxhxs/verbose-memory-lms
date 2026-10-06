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
              className="h-36 w-28 shrink-0 border border-rule object-cover"
            />
          ) : (
            <div
              className={cn(
                "flex h-36 w-28 shrink-0 items-center justify-center border border-rule",
                "bg-slate-sunk text-xs font-semibold text-ink-faint",
              )}
            >
              No cover
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint tnum">
              {status === "published" ? "Live in store" : "Draft"} ·{" "}
              {info.max_attempts > 0
                ? `${info.max_attempts} shared attempts`
                : "Unlimited attempts"}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-ink">
              {info.title || "Untitled pack"}
            </h2>
            {info.description && (
              <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{info.description}</p>
            )}
            <p className="mt-2 flex flex-wrap items-baseline gap-2 tnum">
              <span className="text-lg font-semibold text-ink">
                {formatPackPrice(info.price)}
              </span>
              {mrp > price && mrp > 0 && (
                <span className="text-sm text-ink-faint line-through">
                  ₹{mrp.toLocaleString("en-IN")}
                </span>
              )}
              <span className="text-xs text-ink-muted">
                · {questions.length} question{questions.length === 1 ? "" : "s"} ·{" "}
                {totalPackMarks(questions)} marks · pass {info.passing_percentage || 50}%
              </span>
            </p>
          </div>
        </div>

        {breakdown.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-rule px-6 py-3">
            {breakdown.map(([topic, n]) => (
              <span
                key={topic}
                className={cn(
                  "rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] tnum",
                  topic === "Untagged"
                    ? "border-hold/30 bg-hold-soft text-hold"
                    : "border-rule bg-slate-sunk text-ink-muted",
                )}
              >
                {topic} · {n}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={builderCardClass}>
        <h3 className="text-[15px] font-semibold text-ink">What learners get</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {plans.map((plan) => {
            const meta = EXAM_MODULE_META[plan.module];
            return (
              <div key={plan.module} className="border border-rule bg-slate-sunk p-4">
                <p className="text-[15px] font-semibold text-ink">{meta.label}</p>
                <p className="mt-1.5 text-sm text-ink-muted">{plan.summary}</p>
                <p className="mt-2 text-xs font-semibold text-ink-faint">
                  {meta.proctored ? "Proctored" : "No proctoring"} ·{" "}
                  {meta.untimed ? "Untimed" : "Timed"}
                </p>
              </div>
            );
          })}
          {plans.length === 0 && (
            <p className="text-sm text-halt">No exam format enabled.</p>
          )}
        </div>
      </div>

      <div className={builderCardClass}>
        <h3 className="text-[15px] font-semibold text-ink">Pre-publish check</h3>
        <ul className="mt-4 space-y-2">
          {checks.map((check) => (
            <li key={check.label} className="flex items-center gap-2 text-[15px]">
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold",
                  check.ok
                    ? "bg-live-soft text-live"
                    : "bg-slate-sunk text-ink-faint",
                )}
              >
                {check.ok ? "✓" : "·"}
              </span>
              <span className={check.ok ? "text-ink" : "text-ink-faint"}>
                {check.label}
              </span>
            </li>
          ))}
        </ul>
        {warnings.map((warning) => (
          <p key={warning} className="mt-3 border border-hold/30 bg-hold-soft p-4 text-sm text-hold">
            {warning}
          </p>
        ))}

        <div className="mt-6">
          {status === "published" ? (
            <div>
              <button
                type="button"
                onClick={onUnpublish}
                disabled={saving}
                className={cn(
                  "h-12 rounded-sm border border-rule-strong px-6",
                  "text-sm font-semibold text-ink hover:bg-slate-sunk disabled:opacity-50",
                )}
              >
                {saving ? "Working…" : "Unpublish"}
              </button>
              <p className="mt-2 text-sm text-ink-muted">
                Unpublishing hides the pack from the store. Past buyers keep their history.
              </p>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={onPublish}
                disabled={saving || !allValid}
                className={cn(
                  "h-12 rounded-sm border border-live bg-live px-6 text-sm font-semibold",
                  "text-ink-inverse hover:bg-live/88 disabled:opacity-50",
                )}
              >
                {saving ? "Publishing…" : "Publish pack"}
              </button>
              {!allValid && (
                <p className="mt-2 text-sm text-ink-muted">
                  Finish the checks above to publish.
                </p>
              )}
              {allValid && (
                <p className="mt-2 text-sm text-ink-muted">
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
