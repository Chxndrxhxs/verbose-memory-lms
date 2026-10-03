import { EXAM_MODULE_META, type ExamModule } from "@masterlms/shared";
import { cn } from "../lib/utils";
import { builderCardClass, builderFieldClass, builderLabelClass } from "../lib/builder";
import {
  describeModulePlan,
  formatDuration,
  minutesToSeconds,
  secondsToMinutes,
  type PackInfoDraft,
} from "../types/pack";

type Props = {
  info: PackInfoDraft;
  onChange: (info: PackInfoDraft) => void;
  questionCount: number;
};

const MODULES: ExamModule[] = ["practice", "mock"];
const numberClass = builderFieldClass;

export function PackModulesStep({ info, onChange, questionCount }: Props) {
  const set = (patch: Partial<PackInfoDraft>) => onChange({ ...info, ...patch });
  const toggleModule = (module: ExamModule) => {
    const has = info.allowed_modules.includes(module);
    set({
      allowed_modules: has
        ? info.allowed_modules.filter((m) => m !== module)
        : [...info.allowed_modules, module],
    });
  };

  const plans = describeModulePlan(info, questionCount);
  const price = Number(info.price) || 0;
  const mrp = Number(info.original_price) || 0;
  const discount =
    mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const priceLabel =
    price === 0
      ? "Free — learners claim it instantly."
      : `Learners pay ₹${price.toLocaleString("en-IN")}` +
        (discount > 0 ? ` (${discount}% off MRP).` : ".");

  return (
    <div className="space-y-6">
      <div className={builderCardClass}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
          Step 3 of 4 · Delivery
        </p>
        <h2 className="mt-1 text-xl font-semibold text-ink">How learners take it</h2>
        <p className="mt-1.5 text-[15px] text-ink-muted">
          One pack, two formats. Attempts are shared across both.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {MODULES.map((module) => {
            const meta = EXAM_MODULE_META[module];
            const active = info.allowed_modules.includes(module);
            return (
              <button
                key={module}
                type="button"
                onClick={() => toggleModule(module)}
                aria-pressed={active}
                className={cn(
                  "rounded-sm border-2 p-6 text-left transition-colors",
                  active
                    ? "border-ink bg-ink text-ink-inverse"
                    : "border-rule bg-slate-panel hover:border-ink",
                )}
              >
                <p className="flex items-center justify-between text-[15px] font-semibold">
                  {meta.label}
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                      active ? "bg-ink-inverse text-ink" : "bg-slate-sunk text-transparent",
                    )}
                  >
                    ✓
                  </span>
                </p>
                <p className={cn("mt-1.5 text-sm", active ? "text-ink-inverse/70" : "text-ink-muted")}>
                  {meta.tagline}
                </p>
                <p
                  className={cn(
                    "mt-3 text-xs font-semibold",
                    active ? "text-ink-inverse/80" : "text-ink-faint",
                  )}
                >
                  {meta.proctored ? "Proctored" : "No proctoring"} ·{" "}
                  {meta.untimed ? "Untimed" : "Timed"}
                </p>
              </button>
            );
          })}
        </div>
        {info.allowed_modules.length === 0 && (
          <p className="mt-3 text-sm font-semibold text-halt">
            Enable at least one format to continue.
          </p>
        )}

        {plans.length > 0 && (
          <div className="mt-6 border border-rule bg-slate-sunk p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
              Learner preview · {questionCount} question{questionCount === 1 ? "" : "s"}
            </p>
            <ul className="mt-2 space-y-2">
              {plans.map((plan) => (
                <li key={plan.module} className="text-[15px] text-ink-muted">
                  <span className="font-semibold text-ink">
                    {EXAM_MODULE_META[plan.module].label}:
                  </span>{" "}
                  {plan.summary}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className={builderCardClass}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-ink">Pricing & attempts</h2>
            <p className="mt-1.5 text-[15px] text-ink-muted tnum">{priceLabel}</p>
          </div>
          <span
            className={cn(
              "rounded-sm border px-3 py-1.5 text-sm font-semibold tnum",
              price === 0
                ? "border-live/25 bg-live-soft text-live"
                : "border-ink bg-ink text-ink-inverse",
            )}
          >
            {price === 0 ? "Free" : `₹${price.toLocaleString("en-IN")}`}
          </span>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          <label className={builderLabelClass}>
            Price (₹, 0 = free)
            <input
              type="number"
              min={0}
              value={info.price}
              onChange={(e) => set({ price: e.target.value })}
              className={cn(numberClass, "tnum")}
            />
          </label>
          <label className={builderLabelClass}>
            MRP (₹, optional strikethrough)
            <input
              type="number"
              min={0}
              value={info.original_price}
              onChange={(e) => set({ original_price: e.target.value })}
              className={cn(numberClass, "tnum")}
            />
          </label>
          <label className={builderLabelClass}>
            Max attempts (0 = unlimited)
            <input
              type="number"
              min={0}
              value={info.max_attempts}
              onChange={(e) => set({ max_attempts: Math.max(0, Number(e.target.value) || 0) })}
              className={cn(numberClass, "tnum")}
            />
          </label>
        </div>
      </div>

      <div className={builderCardClass}>
        <h2 className="text-xl font-semibold text-ink">Test structure</h2>
        <p className="mt-1.5 text-[15px] text-ink-muted">
          Questions are split into tests of this size when the pack builds.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <label className={builderLabelClass}>
            Questions per test
            <input
              type="number"
              min={1}
              value={info.test_size}
              onChange={(e) => set({ test_size: Math.max(1, Number(e.target.value) || 1) })}
              className={cn(numberClass, "tnum")}
            />
          </label>
          <label className={builderLabelClass}>
            Test duration (minutes)
            <input
              type="number"
              min={1}
              value={secondsToMinutes(info.test_duration_seconds)}
              onChange={(e) =>
                set({ test_duration_seconds: minutesToSeconds(Number(e.target.value) || 1) })
              }
              className={cn(numberClass, "tnum")}
            />
          </label>
          <label className={builderLabelClass}>
            Questions per set
            <input
              type="number"
              min={1}
              value={info.set_size}
              onChange={(e) => set({ set_size: Math.max(1, Number(e.target.value) || 1) })}
              className={cn(numberClass, "tnum")}
            />
          </label>
          <label className={builderLabelClass}>
            Set duration (minutes)
            <input
              type="number"
              min={1}
              value={secondsToMinutes(info.set_duration_seconds)}
              onChange={(e) =>
                set({ set_duration_seconds: minutesToSeconds(Number(e.target.value) || 1) })
              }
              className={cn(numberClass, "tnum")}
            />
          </label>
        </div>
        <p className="mt-3 text-xs text-ink-muted tnum">
          Current: {formatDuration(info.test_duration_seconds)} per test ·{" "}
          {formatDuration(info.set_duration_seconds)} per set
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          <label className={builderLabelClass}>
            Passing %
            <input
              type="number"
              min={0}
              max={100}
              value={info.passing_percentage}
              onChange={(e) => set({ passing_percentage: e.target.value })}
              className={cn(numberClass, "tnum")}
            />
          </label>
          <label className={builderLabelClass}>
            Test execution
            <select
              value={info.execution_mode}
              onChange={(e) => set({ execution_mode: e.target.value })}
              className={numberClass}
            >
              <option value="sequential">Sequential (one section at a time)</option>
              <option value="parallel">Parallel (all sections open)</option>
            </select>
          </label>
          <label className="flex items-end gap-2 pb-3 text-sm font-semibold text-ink-muted">
            <input
              type="checkbox"
              checked={info.negative_marking}
              onChange={(e) => set({ negative_marking: e.target.checked })}
              className="h-4 w-4 accent-ink"
            />
            Negative marking (mock)
          </label>
        </div>
      </div>
    </div>
  );
}
