import { ArrowRight, Sparkles } from "@masterlms/shared";
import { cn } from "../lib/utils";
import {
  builderCardClass,
  builderFieldClass,
  builderHintClass,
  builderLabelClass,
} from "../lib/builder";
import type { CourseStep1, PricingType } from "../types/courseCreate";

type Props = {
  values: CourseStep1;
  errors: Partial<Record<"title" | "subtitle" | "description" | "price" | "originalPrice", string>>;
  isSubmitting: boolean;
  editing?: boolean;
  onAiClick: () => void;
  onChange: (patch: Partial<CourseStep1>) => void;
  onSubmit: () => void;
};

const FREE: PricingType = "free";
const ONE_TIME: PricingType = "one_time";

function finalAmount(original: string, pctInput: number): string {
  const o = Number(original);
  if (!o || o <= 0) return "";
  const pct = Math.max(0, Math.min(99, Number(pctInput) || 0));
  return String(Number((o * (1 - pct / 100)).toFixed(2)));
}

export function CourseCreateStep1({ values, errors, isSubmitting, editing, onAiClick, onChange, onSubmit }: Props) {
  const pct = Math.min(99, Math.max(0, Number(values.discountPercent) || 0));
  const priceNum = Number(values.price) || 0;
  const keep = Math.round(priceNum * 0.85);

  const setOriginal = (v: string) => onChange({ originalPrice: v, price: finalAmount(v, pct) });
  const setDiscount = (v: string) =>
    onChange({ discountPercent: v, price: finalAmount(values.originalPrice, Number(v)) });

  return (
    <div className={builderCardClass}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
        Step 1 of 2 · Basics
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-ink">
        Course details
      </h1>
      <p className="mt-1.5 text-[15px] text-ink-muted">Set the basics. You can always edit these later.</p>

      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="mt-8 space-y-6">
        <div>
          <label htmlFor="title" className={builderLabelClass}>Title *</label>
          <input
            id="title"
            value={values.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Enter course title"
            className={builderFieldClass}
          />
          {errors.title && <p className="mt-1.5 text-sm text-halt">{errors.title}</p>}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="subtitle" className={builderLabelClass}>Subtitle</label>
            <span className="text-xs font-semibold text-ink-faint tnum">{values.subtitle.length}/255</span>
          </div>
          <input
            id="subtitle"
            value={values.subtitle}
            maxLength={255}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            placeholder="Short tagline, shown on course cards"
            className={cn(builderFieldClass, errors.subtitle && "!border-halt")}
          />
          {errors.subtitle && <p className="mt-1.5 text-sm text-halt">{errors.subtitle}</p>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border border-rule bg-slate-sunk p-5">
          <div className="flex min-w-0 items-center gap-3">
            <p className="text-sm text-ink-muted">
              <span className="font-semibold text-ink">AI descriptions are coming soon.</span>{" "}
              Write yours below for now.
            </p>
          </div>
          <button
            type="button"
            onClick={onAiClick}
            disabled
            title="AI descriptions are coming soon"
            className="inline-flex h-12 cursor-not-allowed items-center gap-2 whitespace-nowrap rounded-sm border border-rule bg-slate-panel px-5 text-sm font-semibold opacity-70"
          >
            <Sparkles size={16} className="text-ink-faint" />
            <span className="text-ink-muted">
              Generate using AI
            </span>
            <span className="rounded-sm bg-slate-sunk px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Soon</span>
          </button>
        </div>

        <div>
          <label htmlFor="description" className={builderLabelClass}>Description *</label>
          <textarea
            id="description"
            rows={5}
            value={values.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Detailed overview: goals, audience, prerequisites"
            className={cn(builderFieldClass, "resize-none")}
          />
          {errors.description && <p className="mt-1.5 text-sm text-halt">{errors.description}</p>}
        </div>

        <div>
          <label htmlFor="learn" className={builderLabelClass}>
            What you’ll learn <span className="font-normal text-ink-faint">(dot separated — each sentence becomes a bullet)</span>
          </label>
          <textarea
            id="learn"
            rows={3}
            value={values.whatYouWillLearn}
            onChange={(e) => onChange({ whatYouWillLearn: e.target.value })}
            placeholder="Build frontends with React. Create backends with Django. Design MySQL schemas. Handle OTP auth. Deploy with Docker"
            className={cn(builderFieldClass, "resize-none")}
          />
        </div>

        <div>
          <span className="mb-4 block text-[15px] font-semibold text-ink">Set pricing</span>
          <div className="space-y-4">
            <label
              className={cn(
                "flex cursor-pointer gap-4 border p-6 transition-colors",
                values.pricingType === FREE
                  ? "border-ink bg-slate-sunk"
                  : "border-rule bg-slate-panel"
              )}
            >
              <input
                type="radio"
                checked={values.pricingType === FREE}
                onChange={() => onChange({ pricingType: FREE, price: "", originalPrice: "", discountPercent: "" })}
                className="mt-1 h-4 w-4 accent-ink"
              />
              <div>
                <p className="text-[15px] font-semibold text-ink">Free plan</p>
                <p className="mt-1 text-sm text-ink-muted">Allow unrestricted access to your content free of cost</p>
              </div>
            </label>

            <div className={cn("border p-6 transition-colors", values.pricingType === ONE_TIME ? "border-ink bg-slate-sunk" : "border-rule bg-slate-panel")}>
              <label className="flex cursor-pointer gap-4">
                <input
                  type="radio"
                  checked={values.pricingType === ONE_TIME}
                  onChange={() => onChange({ pricingType: ONE_TIME })}
                  className="mt-1 h-4 w-4 accent-ink"
                />
                <div>
                  <p className="text-[15px] font-semibold text-ink">One-time plan</p>
                  <p className="mt-1 text-sm text-ink-muted">Allow full course access with a single payment</p>
                </div>
              </label>

              {values.pricingType === ONE_TIME && (
                <div className="mt-5 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="original-price" className="mb-1.5 block text-sm font-semibold text-ink">Actual amount *</label>
                      <div className="flex items-center overflow-hidden rounded-sm border border-rule bg-slate-panel focus-within:border-ink">
                        <span className="flex items-center self-stretch border-r border-rule bg-slate-sunk px-3 text-sm text-ink-muted tnum">₹</span>
                        <input
                          id="original-price"
                          type="number"
                          min="0"
                          max="99999.99"
                          step="0.01"
                          value={values.originalPrice}
                          onChange={(e) => setOriginal(e.target.value)}
                          placeholder="Enter amount before discount"
                          className="h-12 w-full px-4 text-[15px] tnum"
                        />
                      </div>
                      {errors.originalPrice && <p className="mt-1.5 text-sm text-halt">{errors.originalPrice}</p>}
                    </div>
                    <div>
                      <label htmlFor="discount-pct" className="mb-1.5 block text-sm font-semibold text-ink">Discount % <span className="font-normal text-ink-faint">(0–99)</span></label>
                      <div className="flex items-center overflow-hidden rounded-sm border border-rule bg-slate-panel focus-within:border-ink">
                        <input
                          id="discount-pct"
                          type="number"
                          min="0"
                          max="99"
                          step="1"
                          value={values.discountPercent}
                          onChange={(e) => setDiscount(e.target.value)}
                          placeholder="e.g. 20"
                          className="h-12 w-full px-4 text-[15px] tnum"
                        />
                        <span className="flex items-center self-stretch bg-slate-sunk px-3 text-sm text-ink-muted tnum">%</span>
                      </div>
                      {errors.price && <p className="mt-1.5 text-sm text-halt">{errors.price}</p>}
                    </div>
                  </div>

                  {Number(values.originalPrice) > 0 && (
                    <div className="flex items-center justify-between border border-rule bg-slate-sunk px-5 py-4">
                      <span className="text-sm text-ink-muted">
                        Final amount{" "}
                        {pct > 0 ? (
                          <span className="text-live tnum">({pct}% off ₹{Number(values.originalPrice).toLocaleString("en-IN")})</span>
                        ) : (
                          <span className="text-ink-faint">(no discount)</span>
                        )}
                      </span>
                      <span className="text-xl font-semibold tnum">
                        {priceNum > 0 ? `₹${priceNum.toLocaleString("en-IN")}` : "—"}
                      </span>
                    </div>
                  )}

                  <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
                    <input
                      type="checkbox"
                      checked={values.pgFeesToLearner}
                      onChange={(e) => onChange({ pgFeesToLearner: e.target.checked })}
                      className="h-4 w-4 accent-ink"
                    />
                    <span>Pass gateway fee to learners <span className="text-ink-faint">(added on top of price)</span></span>
                  </label>

                  {priceNum > 0 && (
                    <div className="border border-live/25 bg-live-soft px-5 py-3 text-sm text-live tnum">
                      Learner pays <b>₹{priceNum.toLocaleString("en-IN")}</b> · You keep ≈ <b>₹{keep.toLocaleString("en-IN")}</b> (85% revenue share)
                      {pct > 0 && <span> · <b>{pct}% off</b> MRP</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <p className={builderHintClass}>
            You can add multiple pricing options and access advanced plans later under course pricing.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-12 items-center justify-center gap-1.5 rounded-sm bg-ink px-7 text-[15px] font-semibold text-ink-inverse disabled:opacity-60"
          >
            {isSubmitting ? (editing ? "Saving…" : "Creating…") : editing ? "Save & continue" : (<>Continue <ArrowRight size={14} strokeWidth={2.5} aria-hidden /></>)}
          </button>
        </div>
      </form>
    </div>
  );
}