import { Sparkles } from "@masterlms/shared";
import { cn } from "../lib/utils";
import type { CourseStep1, PricingType } from "../types/courseCreate";

type Props = {
  values: CourseStep1;
  errors: Partial<Record<"title" | "description" | "price", string>>;
  isSubmitting: boolean;
  editing?: boolean;
  onAiClick: () => void;
  onChange: (patch: Partial<CourseStep1>) => void;
  onSubmit: () => void;
};

const FREE: PricingType = "free";
const ONE_TIME: PricingType = "one_time";

function discountPct(original: string, price: string): number {
  const o = Number(original);
  const p = Number(price);
  if (!o || !p || o <= 0 || p <= 0) return 0;
  const pct = Math.round(((o - p) / o) * 100);
  return pct > 0 && pct < 100 ? pct : 0;
}

export function CourseCreateStep1({ values, errors, isSubmitting, editing, onAiClick, onChange, onSubmit }: Props) {
  const pct = discountPct(values.originalPrice, values.price);
  const priceNum = Number(values.price) || 0;
  const keep = Math.round(priceNum * 0.85);

  return (
    <div className="rounded-[20px] bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-xl font-extrabold tracking-tight">Course details</h1>
      <p className="mt-1 text-sm text-zinc-500">Set the basics — you can always edit these later.</p>

      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="mt-6 space-y-6">
        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-semibold text-zinc-900">Title *</label>
          <input
            id="title"
            value={values.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Enter course title"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-sm outline-none transition-colors focus:border-[#3478ff]"
          />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="subtitle" className="mb-2 block text-sm font-semibold text-zinc-900">Subtitle</label>
          <input
            id="subtitle"
            value={values.subtitle}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            placeholder="Short tagline — shown on course cards"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-sm outline-none transition-colors focus:border-[#3478ff]"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#eef1ff] p-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="shrink-0 rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-[#152561]">NEW</span>
            <p className="text-sm font-medium text-zinc-800">
              Let our AI tool work its magic to generate a compelling course description in seconds!
            </p>
          </div>
          <button
            type="button"
            onClick={onAiClick}
            disabled
            title="AI descriptions are coming soon"
            className="inline-flex h-10 cursor-not-allowed items-center gap-2 whitespace-nowrap rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold opacity-70"
          >
            <Sparkles size={16} className="text-[#3478ff]" />
            <span className="text-[#152561]">
              Generate using AI
            </span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500">SOON</span>
          </button>
        </div>

        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-semibold text-zinc-900">Description *</label>
          <textarea
            id="description"
            rows={5}
            value={values.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Detailed overview — goals, audience, prerequisites… shown in the Description section"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-sm outline-none transition-colors focus:border-[#3478ff]"
          />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
        </div>

        <div>
          <label htmlFor="learn" className="mb-2 block text-sm font-semibold text-zinc-900">
            What you’ll learn <span className="font-normal text-zinc-400">(dot separated — each sentence becomes a bullet)</span>
          </label>
          <textarea
            id="learn"
            rows={3}
            value={values.whatYouWillLearn}
            onChange={(e) => onChange({ whatYouWillLearn: e.target.value })}
            placeholder="Build frontends with React. Create backends with Django. Design MySQL schemas. Handle OTP auth. Deploy with Docker"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-sm outline-none transition-colors focus:border-[#3478ff]"
          />
        </div>

        <div>
          <span className="mb-3 block text-sm font-semibold text-zinc-900">Set pricing</span>
          <div className="space-y-3">
            <label
              className={cn(
                "flex cursor-pointer gap-4 rounded-2xl border p-5 transition-colors",
                values.pricingType === FREE ? "border-[#3478ff] bg-[#eef1ff]" : "border-zinc-200 bg-zinc-50"
              )}
            >
              <input
                type="radio"
                checked={values.pricingType === FREE}
                onChange={() => onChange({ pricingType: FREE, price: "", originalPrice: "" })}
                className="mt-1 h-4 w-4 accent-[#3478ff]"
              />
              <div>
                <p className="text-sm font-semibold text-zinc-900">Free plan</p>
                <p className="mt-0.5 text-xs text-zinc-500">Allow unrestricted access to your content free of cost</p>
              </div>
            </label>

            <div className={cn("rounded-2xl border p-5 transition-colors", values.pricingType === ONE_TIME ? "border-[#3478ff] bg-[#eef1ff]" : "border-zinc-200 bg-zinc-50")}>
              <label className="flex cursor-pointer gap-4">
                <input
                  type="radio"
                  checked={values.pricingType === ONE_TIME}
                  onChange={() => onChange({ pricingType: ONE_TIME })}
                  className="mt-1 h-4 w-4 accent-[#3478ff]"
                />
                <div>
                  <p className="text-sm font-semibold text-zinc-900">One-time plan</p>
                  <p className="mt-0.5 text-xs text-zinc-500">Allow full course access with a single payment</p>
                </div>
              </label>

              {values.pricingType === ONE_TIME && (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-900">Total price *</label>
                      <div className="flex items-center overflow-hidden rounded-xl border border-zinc-200 bg-white focus-within:border-[#3478ff]">
                        <span className="flex items-center self-stretch border-r border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-600">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={values.originalPrice}
                          onChange={(e) => onChange({ originalPrice: e.target.value })}
                          placeholder="Enter price"
                          className="w-full px-4 py-3 text-sm outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-900">
                        Discounted price <span className="text-zinc-400">({pct > 0 ? `${pct}% off` : "0% off"})</span> *
                      </label>
                      <div className="flex items-center overflow-hidden rounded-xl border border-zinc-200 bg-white focus-within:border-[#3478ff]">
                        <span className="flex items-center self-stretch border-r border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-600">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={values.price}
                          onChange={(e) => onChange({ price: e.target.value })}
                          placeholder="Enter discounted price"
                          className="w-full px-4 py-3 text-sm outline-none"
                        />
                      </div>
                      {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
                    </div>
                  </div>

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
                    <div className="rounded-xl bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800">
                      Learner pays <b>₹{priceNum.toLocaleString("en-IN")}</b> · You keep ≈ <b>₹{keep.toLocaleString("en-IN")}</b> (85% revenue share)
                      {pct > 0 && <span> · <b>{pct}% off</b> MRP</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <p className="mt-3 rounded-xl bg-[#eef1ff] px-4 py-2 text-xs text-zinc-700">
            You can add multiple pricing options and access advanced plans later under course pricing.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-[#0f172a] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {isSubmitting ? (editing ? "Saving…" : "Creating…") : (editing ? "Save & continue" : "Continue →")}
          </button>
        </div>
      </form>
    </div>
  );
}