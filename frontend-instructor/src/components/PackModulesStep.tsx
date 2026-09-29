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
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-zinc-400">
          Step 3 of 4 · Delivery
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-zinc-900">How learners take it</h2>
        <p className="mt-1.5 text-[15px] text-zinc-500">
          One pack, two formats. Attempts are shared across both.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {MODULES.map((module) => {
            const meta = EXAM_MODULE_META[module];
            const active = info.allowed_modules.includes(module);
            return (
              <button
                key={module}
                onClick={() => toggleModule(module)}
                aria-pressed={active}
                className={cn(
                  "rounded-2xl border-2 p-6 text-left transition-all",
                  active
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white hover:border-zinc-400",
                )}
              >
                <p className="flex items-center justify-between text-[15px] font-bold">
                  {meta.label}
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                      active ? "bg-white text-zinc-900" : "bg-zinc-100 text-transparent",
                    )}
                  >
                    ✓
                  </span>
                </p>
                <p className={cn("mt-1.5 text-sm", active ? "text-white/70" : "text-zinc-500")}>
                  {meta.tagline}
                </p>
                <p
                  className={cn(
                    "mt-3 text-xs font-semibold",
                    active ? "text-white/80" : "text-zinc-400",
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
          <p className="mt-3 text-sm font-semibold text-red-600">
            Enable at least one format to continue.
          </p>
        )}

        {plans.length > 0 && (
          <div className="mt-6 rounded-2xl border border-zinc-200/70 bg-zinc-50/70 p-5">
            <p className="text-xs font-bold tracking-wide text-zinc-500 uppercase">
              Learner preview · {questionCount} question{questionCount === 1 ? "" : "s"}
            </p>
            <ul className="mt-2.5 space-y-2">
              {plans.map((plan) => (
                <li key={plan.module} className="text-[15px] text-zinc-700">
                  <span className="font-semibold text-zinc-900">
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
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">Pricing & attempts</h2>
            <p className="mt-1.5 text-[15px] text-zinc-500">{priceLabel}</p>
          </div>
          <span
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-bold",
              price === 0 ? "bg-emerald-100 text-emerald-700" : "bg-zinc-900 text-white",
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
              className={numberClass}
            />
          </label>
          <label className={builderLabelClass}>
            MRP (₹, optional strikethrough)
            <input
              type="number"
              min={0}
              value={info.original_price}
              onChange={(e) => set({ original_price: e.target.value })}
              className={numberClass}
            />
          </label>
          <label className={builderLabelClass}>
            Max attempts (0 = unlimited)
            <input
              type="number"
              min={0}
              value={info.max_attempts}
              onChange={(e) => set({ max_attempts: Math.max(0, Number(e.target.value) || 0) })}
              className={numberClass}
            />
          </label>
        </div>
      </div>

      <div className={builderCardClass}>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900">Test structure</h2>
        <p className="mt-1.5 text-[15px] text-zinc-500">
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
              className={numberClass}
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
              className={numberClass}
            />
          </label>
          <label className={builderLabelClass}>
            Questions per set
            <input
              type="number"
              min={1}
              value={info.set_size}
              onChange={(e) => set({ set_size: Math.max(1, Number(e.target.value) || 1) })}
              className={numberClass}
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
              className={numberClass}
            />
          </label>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
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
              className={numberClass}
            />
          </label>
          <label className={builderLabelClass}>
            Test execution
            <select
              value={info.execution_mode}
              onChange={(e) => set({ execution_mode: e.target.value })}
              className={`${numberClass} bg-white`}
            >
              <option value="sequential">Sequential (one section at a time)</option>
              <option value="parallel">Parallel (all sections open)</option>
            </select>
          </label>
          <label className="flex items-end gap-2.5 pb-3 text-sm font-semibold text-zinc-600">
            <input
              type="checkbox"
              checked={info.negative_marking}
              onChange={(e) => set({ negative_marking: e.target.checked })}
              className="h-4 w-4"
            />
            Negative marking (mock)
          </label>
        </div>
      </div>
    </div>
  );
}
