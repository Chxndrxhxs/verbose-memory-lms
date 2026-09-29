import { Sparkles } from "@masterlms/shared";
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
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-zinc-400">
        Step 1 of 2 · Basics
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">
        Course details
      </h1>
      <p className="mt-1.5 text-[15px] text-zinc-500">Set the basics — you can always edit these later.</p>

      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="mt-8 space-y-7">
        <div>
          <label htmlFor="title" className={builderLabelClass}>Title *</label>
          <input
            id="title"
            value={values.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Enter course title"
            className={builderFieldClass}
          />
          {errors.title && <p className="mt-1.5 text-sm text-red-500">{errors.title}</p>}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="subtitle" className={builderLabelClass}>Subtitle</label>
            <span className="text-xs font-semibold text-zinc-400">{values.subtitle.length}/255</span>
          </div>
          <input
            id="subtitle"
            value={values.subtitle}
            maxLength={255}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            placeholder="Short tagline — shown on course cards"
            className={cn(builderFieldClass, errors.subtitle && "!border-red-400")}
          />
          {errors.subtitle && <p className="mt-1.5 text-sm text-red-500">{errors.subtitle}</p>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200/70 bg-zinc-50/70 p-5">
          <div className="flex min-w-0 items-center gap-3">
            <p className="text-sm text-zinc-600">
              <span className="font-semibold text-zinc-900">AI descriptions are coming soon.</span>{" "}
              Write yours below for now.
            </p>
          </div>
          <button
            type="button"
            onClick={onAiClick}
            disabled
            title="AI descriptions are coming soon"
            className="inline-flex h-12 cursor-not-allowed items-center gap-2 whitespace-nowrap rounded-full border border-zinc-200 bg-white px-5 text-sm font-semibold opacity-70"
          >
            <Sparkles size={16} className="text-[#3478ff]" />
            <span className="text-[#152561]">
              Generate using AI
            </span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-500">SOON</span>
          </button>
        </div>

        <div>
          <label htmlFor="description" className={builderLabelClass}>Description *</label>
          <textarea
            id="description"
            rows={5}
            value={values.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Detailed overview — goals, audience, prerequisites… shown in the Description section"
            className={cn(builderFieldClass, "resize-none")}
          />
          {errors.description && <p className="mt-1.5 text-sm text-red-500">{errors.description}</p>}
        </div>

        <div>
          <label htmlFor="learn" className={builderLabelClass}>
            What you’ll learn <span className="font-normal text-zinc-400">(dot separated — each sentence becomes a bullet)</span>
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
          <span className="mb-4 block text-[15px] font-bold text-zinc-900">Set pricing</span>
          <div className="space-y-4">
            <label
              className={cn(
                "flex cursor-pointer gap-4 rounded-2xl border p-6 transition-colors",
                values.pricingType === FREE ? "border-[#3478ff] bg-[#eef1ff]" : "border-zinc-200 bg-white"
              )}
            >
              <input
                type="radio"
                checked={values.pricingType === FREE}
                onChange={() => onChange({ pricingType: FREE, price: "", originalPrice: "", discountPercent: "" })}
                className="mt-1 h-4 w-4 accent-[#3478ff]"
              />
              <div>
                <p className="text-[15px] font-semibold text-zinc-900">Free plan</p>
                <p className="mt-1 text-sm text-zinc-500">Allow unrestricted access to your content free of cost</p>
              </div>
            </label>

            <div className={cn("rounded-2xl border p-6 transition-colors", values.pricingType === ONE_TIME ? "border-[#3478ff] bg-[#eef1ff]" : "border-zinc-200 bg-white")}>
              <label className="flex cursor-pointer gap-4">
                <input
                  type="radio"
                  checked={values.pricingType === ONE_TIME}
                  onChange={() => onChange({ pricingType: ONE_TIME })}
                  className="mt-1 h-4 w-4 accent-[#3478ff]"
                />
                <div>
                  <p className="text-[15px] font-semibold text-zinc-900">One-time plan</p>
                  <p className="mt-1 text-sm text-zinc-500">Allow full course access with a single payment</p>
                </div>
              </label>

              {values.pricingType === ONE_TIME && (
                <div className="mt-5 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-zinc-900">Actual amount *</label>
                      <div className="flex items-center overflow-hidden rounded-xl border border-zinc-200 bg-white focus-within:border-[#3478ff]">
                        <span className="flex items-center self-stretch border-r border-zinc-200 bg-zinc-50 px-3.5 text-sm text-zinc-600">₹</span>
                        <input
                          type="number"
                          min="0"
                          max="99999.99"
                          step="0.01"
                          value={values.originalPrice}
                          onChange={(e) => setOriginal(e.target.value)}
                          placeholder="Enter amount before discount"
                          className="h-12 w-full px-4 text-[15px] outline-none"
                        />
                      </div>
                      {errors.originalPrice && <p className="mt-1.5 text-sm text-red-500">{errors.originalPrice}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-zinc-900">Discount % <span className="font-normal text-zinc-400">(0–99)</span></label>
                      <div className="flex items-center overflow-hidden rounded-xl border border-zinc-200 bg-white focus-within:border-[#3478ff]">
                        <input
                          type="number"
                          min="0"
                          max="99"
                          step="1"
                          value={values.discountPercent}
                          onChange={(e) => setDiscount(e.target.value)}
                          placeholder="e.g. 20"
                          className="h-12 w-full px-4 text-[15px] outline-none"
                        />
                        <span className="flex items-center self-stretch bg-zinc-50 px-3.5 text-sm text-zinc-600">%</span>
                      </div>
                      {errors.price && <p className="mt-1.5 text-sm text-red-500">{errors.price}</p>}
                    </div>
                  </div>

                  {Number(values.originalPrice) > 0 && (
                    <div className="flex items-center justify-between rounded-2xl border border-zinc-200/70 bg-zinc-50/70 px-5 py-4">
                      <span className="text-sm text-zinc-600">
                        Final amount{" "}
                        {pct > 0 ? (
                          <span className="text-emerald-700">({pct}% off ₹{Number(values.originalPrice).toLocaleString("en-IN")})</span>
                        ) : (
                          <span className="text-zinc-400">(no discount)</span>
                        )}
                      </span>
                      <span className="text-xl font-bold tabular-nums">
                        {priceNum > 0 ? `₹${priceNum.toLocaleString("en-IN")}` : "—"}
                      </span>
                    </div>
                  )}

                  <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-700">
                    <input
                      type="checkbox"
                      checked={values.pgFeesToLearner}
                      onChange={(e) => onChange({ pgFeesToLearner: e.target.checked })}
                      className="h-4 w-4 accent-[#3478ff]"
                    />
                    <span>Pass gateway fee to learners <span className="text-zinc-400">(added on top of price)</span></span>
                  </label>

                  {priceNum > 0 && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-800">
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
            className="h-12 rounded-full bg-[#0f172a] px-7 text-[15px] font-bold text-white disabled:opacity-60"
          >
            {isSubmitting ? (editing ? "Saving…" : "Creating…") : (editing ? "Save & continue" : "Continue →")}
          </button>
        </div>
      </form>
    </div>
  );
}