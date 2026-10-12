import { Link } from "react-router-dom";
import { ArrowLeft } from "@masterlms/shared";
import type { CourseOption, CouponFormValues } from "../types/coupon";
import {
  builderCardClass,
  builderFieldClass,
  builderHintClass,
} from "../lib/builder";
import { Button } from "./Button";
import { Field, Input, Select } from "./Controls";
import { PageHeader, Panel } from "./Panel";

export function CouponFormView({
  values,
  errors,
  courseOptions,
  editing,
  loading,
  loadError,
  saving,
  deleting,
  toast,
  onChange,
  onSubmit,
  onDelete,
}: {
  values: CouponFormValues;
  errors: Record<string, string>;
  courseOptions: CourseOption[];
  editing: boolean;
  loading: boolean;
  loadError: string | null;
  saving: boolean;
  deleting: boolean;
  toast: string | null;
  onChange: <K extends keyof CouponFormValues>(
    key: K,
    value: CouponFormValues[K],
  ) => void;
  onSubmit: () => void;
  onDelete: () => void;
}) {
  if (loadError) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Promotions"
          title="Coupon"
          description="Couldn't load this coupon."
        />
        <Panel>
          <p role="alert" className="text-sm text-halt">
            {loadError}
          </p>
          <Link
            to="/coupons"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ink underline"
          >
            <ArrowLeft size={13} strokeWidth={2.5} aria-hidden />
            Back to coupons
          </Link>
        </Panel>
      </div>
    );
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-ink-muted">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Promotions"
        title={editing ? "Edit coupon" : "New coupon"}
        description={
          editing
            ? "Update the discount, course or validity window."
            : "Create a discount code for one of your courses. Set a validity window and it expires on its own."
        }
        action={
          <Link
            to="/coupons"
            className="inline-flex h-10 items-center gap-1.5 border border-rule bg-slate-panel px-4 text-sm font-semibold text-ink-muted transition-colors hover:border-rule-strong hover:text-ink"
          >
            <ArrowLeft size={13} strokeWidth={2.5} aria-hidden />
            All coupons
          </Link>
        }
      />

      <Panel className={builderCardClass}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Code"
              hint="Uppercased automatically. Letters, digits, hyphens, underscores."
              error={errors.code}
              required
            >
              <Input
                className={builderFieldClass}
                value={values.code}
                onChange={(e) => onChange("code", e.target.value)}
                placeholder="WELCOME10"
                autoComplete="off"
              />
            </Field>

            <Field label="Discount type" error={errors.discountType}>
              <Select
                className={builderFieldClass}
                value={values.discountType}
                onChange={(e) =>
                  onChange("discountType", e.target.value as "percent" | "flat")
                }
              >
                <option value="percent">Percentage</option>
                <option value="flat">Flat amount</option>
              </Select>
            </Field>

            <Field
              label={values.discountType === "percent" ? "Discount (%)" : "Discount (₹)"}
              error={errors.discountValue}
              required
            >
              <Input
                className={builderFieldClass}
                type="number"
                min="0"
                step="any"
                value={values.discountValue}
                onChange={(e) => onChange("discountValue", e.target.value)}
              />
            </Field>

            {values.discountType === "percent" && (
              <Field
                label="Max discount (₹)"
                hint="Optional cap — percentage discounts never exceed it."
                error={errors.maxDiscount}
              >
                <Input
                  className={builderFieldClass}
                  type="number"
                  min="0"
                  step="any"
                  value={values.maxDiscount}
                  onChange={(e) => onChange("maxDiscount", e.target.value)}
                />
              </Field>
            )}

            <Field
              label="Min order (₹)"
              hint="Cart total needed to redeem. Empty means no minimum."
              error={errors.minOrder}
            >
              <Input
                className={builderFieldClass}
                type="number"
                min="0"
                step="any"
                value={values.minOrder}
                onChange={(e) => onChange("minOrder", e.target.value)}
              />
            </Field>

            <Field
              label="Usage limit"
              hint="Total redemptions allowed. Empty for unlimited."
              error={errors.usageLimit}
            >
              <Input
                className={builderFieldClass}
                type="number"
                min="1"
                step="1"
                value={values.usageLimit}
                onChange={(e) => onChange("usageLimit", e.target.value)}
              />
            </Field>

            <Field
              label="Per-user limit"
              hint="How many times one learner can redeem it."
              error={errors.perUserLimit}
            >
              <Input
                className={builderFieldClass}
                type="number"
                min="1"
                step="1"
                value={values.perUserLimit}
                onChange={(e) => onChange("perUserLimit", e.target.value)}
              />
            </Field>

            <Field label="Course" error={errors.courseId} required>
              <Select
                className={builderFieldClass}
                value={values.courseId}
                onChange={(e) => onChange("courseId", e.target.value)}
              >
                <option value="">Select a course…</option>
                {courseOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Valid from"
              hint="Leave empty to allow immediate use."
              error={errors.validFrom}
            >
              <Input
                className={builderFieldClass}
                type="datetime-local"
                value={values.validFrom}
                onChange={(e) => onChange("validFrom", e.target.value)}
              />
            </Field>

            <Field
              label="Valid until"
              hint="The coupon stops working after this date."
              error={errors.validTo}
            >
              <Input
                className={builderFieldClass}
                type="datetime-local"
                value={values.validTo}
                onChange={(e) => onChange("validTo", e.target.value)}
              />
            </Field>
          </div>

          <p className={builderHintClass}>
            Only your own courses can carry a coupon, and the discount applies
            to that course alone.
          </p>

          <label className="inline-flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(e) => onChange("isActive", e.target.checked)}
              className="h-4 w-4"
            />
            Coupon is redeemable
          </label>

          <div className="flex flex-wrap items-center gap-2 border-t border-rule pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
            >
              {saving ? "Saving…" : editing ? "Save changes" : "Create coupon"}
            </Button>
            <Link
              to="/coupons"
              className="inline-flex h-10 items-center px-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
            >
              Cancel
            </Link>
            {editing && (
              <Button
                variant="danger"
                size="sm"
                onClick={onDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            )}
          </div>

          {Object.keys(errors).length > 0 && (
            <p role="alert" className="text-xs font-semibold text-halt">
              Fix the highlighted fields before saving.
            </p>
          )}
        </form>
      </Panel>

      {toast && (
        <div
          aria-live="polite"
          aria-atomic="true"
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 border border-rule-strong bg-ink px-5 py-2.5 text-sm text-ink-inverse shadow-[0_18px_40px_-12px_rgba(20,24,38,0.4)]"
        >
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
