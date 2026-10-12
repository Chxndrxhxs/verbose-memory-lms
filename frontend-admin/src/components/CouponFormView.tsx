import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { ArrowLeft } from "@masterlms/shared";
import type { AdminCourse } from "../types/admin";
import type { CouponFormValues } from "../containers/CouponForm.container";
import { Button } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";
import { Field, Input, Select } from "./Controls";
import { Panel, PageHeader } from "./Panel";

const schema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, "Code is required")
      .max(32, "Code must be 32 characters or fewer")
      .regex(/^[A-Za-z0-9-_]+$/, "Only letters, digits, hyphens and underscores"),
    discount_type: z.enum(["percent", "flat"]),
    discount_value: z.string().trim().min(1, "Required"),
    max_discount: z.string().trim(),
    min_order: z.string().trim(),
    usage_limit: z.string().trim(),
    per_user_limit: z.string().trim().min(1, "Required"),
    applies_to: z.enum(["all", "course", "pack"]),
    course: z.string(),
    pack: z.string(),
    valid_from: z.string(),
    valid_to: z.string(),
    is_active: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const value = Number(v.discount_value);
    if (!Number.isFinite(value) || value <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["discount_value"],
        message: "Enter a positive number",
      });
    } else if (v.discount_type === "percent" && value > 100) {
      ctx.addIssue({
        code: "custom",
        path: ["discount_value"],
        message: "Percent must be between 1 and 100",
      });
    }
    if (
      v.max_discount !== "" &&
      (!Number.isFinite(Number(v.max_discount)) || Number(v.max_discount) <= 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["max_discount"],
        message: "Enter a positive amount",
      });
    }
    if (v.applies_to === "course" && !v.course) {
      ctx.addIssue({ code: "custom", path: ["course"], message: "Pick a course" });
    }
    if (v.applies_to === "pack" && !v.pack) {
      ctx.addIssue({ code: "custom", path: ["pack"], message: "Enter the pack ID" });
    }
  });

export function CouponFormView({
  initial,
  courseOptions,
  loading,
  loadError,
  editing,
  onSubmit,
  saving,
  saveError,
  onDelete,
  deleting,
}: {
  initial: CouponFormValues | null;
  courseOptions: AdminCourse[];
  loading: boolean;
  loadError: string | null;
  editing: boolean;
  onSubmit: (values: CouponFormValues) => void;
  saving: boolean;
  saveError: string | null;
  onDelete?: () => void;
  deleting: boolean;
}) {
  const form = useForm<CouponFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "",
      discount_type: "percent",
      discount_value: "",
      max_discount: "",
      min_order: "",
      usage_limit: "",
      per_user_limit: "1",
      applies_to: "course",
      course: "",
      pack: "",
      valid_from: "",
      valid_to: "",
      is_active: true,
    },
  });

  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (initial) form.reset(initial);
  }, [initial, form]);

  if (loadError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Coupon" description="Couldn't load this coupon." />
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

  const submit = form.handleSubmit((v) => onSubmit(v));
  const discountType = form.watch("discount_type");
  const appliesTo = form.watch("applies_to");

  return (
    <div className="space-y-6">
      <PageHeader
        title={editing ? "Edit coupon" : "New coupon"}
        description={
          editing
            ? "Update the discount, scope or validity window."
            : "Create a discount code learners can apply at checkout."
        }
        action={
          <Link
            to="/coupons"
            className="inline-flex h-9 items-center gap-1.5 border border-rule bg-paper-raised px-3 text-xs font-semibold text-ink-muted transition-colors hover:border-rule-strong hover:text-ink"
          >
            <ArrowLeft size={13} strokeWidth={2.5} aria-hidden />
            All coupons
          </Link>
        }
      />

      <Panel flush>
        <form onSubmit={submit} className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Code"
              hint="Uppercased automatically. Letters, digits, hyphens, underscores."
              error={form.formState.errors.code?.message}
            >
              <Input
                {...form.register("code")}
                placeholder="WELCOME10"
                autoComplete="off"
              />
            </Field>

            <Field
              label="Discount type"
              error={form.formState.errors.discount_type?.message}
            >
              <Select {...form.register("discount_type")}>
                <option value="percent">Percentage</option>
                <option value="flat">Flat amount</option>
              </Select>
            </Field>

            <Field
              label={discountType === "percent" ? "Discount (%)" : "Discount (₹)"}
              error={form.formState.errors.discount_value?.message}
            >
              <Input
                type="number"
                min="0"
                step="any"
                {...form.register("discount_value")}
              />
            </Field>

            {discountType === "percent" && (
              <Field
                label="Max discount (₹)"
                hint="Optional cap for percentage discounts."
                error={form.formState.errors.max_discount?.message}
              >
                <Input
                  type="number"
                  min="0"
                  step="any"
                  {...form.register("max_discount")}
                />
              </Field>
            )}

            <Field
              label="Min order (₹)"
              hint="Cart total needed to redeem. Empty means no minimum."
              error={form.formState.errors.min_order?.message}
            >
              <Input
                type="number"
                min="0"
                step="any"
                {...form.register("min_order")}
              />
            </Field>

            <Field
              label="Usage limit"
              hint="Total redemptions allowed. Empty for unlimited."
              error={form.formState.errors.usage_limit?.message}
            >
              <Input
                type="number"
                min="1"
                step="1"
                {...form.register("usage_limit")}
              />
            </Field>

            <Field
              label="Per-user limit"
              hint="How many times one learner can redeem it."
              error={form.formState.errors.per_user_limit?.message}
            >
              <Input
                type="number"
                min="1"
                step="1"
                {...form.register("per_user_limit")}
              />
            </Field>

            <Field
              label="Applies to"
              error={form.formState.errors.applies_to?.message}
            >
              <Select {...form.register("applies_to")}>
                <option value="all">All courses</option>
                <option value="course">One course</option>
                <option value="pack">One pack</option>
              </Select>
            </Field>

            {appliesTo === "course" && (
              <Field
                label="Course"
                error={form.formState.errors.course?.message}
              >
                <Select {...form.register("course")}>
                  <option value="">Select a course…</option>
                  {courseOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </Select>
              </Field>
            )}

            {appliesTo === "pack" && (
              <Field
                label="Pack ID"
                hint="Numeric ID of the pack this coupon discounts."
                error={form.formState.errors.pack?.message}
              >
                <Input
                  type="number"
                  min="1"
                  step="1"
                  {...form.register("pack")}
                />
              </Field>
            )}

            <Field
              label="Valid from"
              hint="Leave empty to allow immediate use."
              error={form.formState.errors.valid_from?.message}
            >
              <Input type="datetime-local" {...form.register("valid_from")} />
            </Field>

            <Field
              label="Valid until"
              hint="The coupon stops working after this date."
              error={form.formState.errors.valid_to?.message}
            >
              <Input type="datetime-local" {...form.register("valid_to")} />
            </Field>
          </div>

          <Field
            label="Active"
            hint="Inactive coupons can't be redeemed, but stay listed."
          >
            <label className="inline-flex items-center gap-2 text-sm text-ink">
              <Input
                type="checkbox"
                {...form.register("is_active")}
                className="h-4 w-4"
              />
              Coupon is redeemable
            </label>
          </Field>

          <div className="flex flex-wrap items-center gap-2 border-t border-rule pt-4">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Create coupon"}
            </Button>
            <Link
              to="/coupons"
              className="inline-flex h-10 items-center px-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
            >
              Cancel
            </Link>
            {onDelete && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            )}
          </div>

          {saveError && (
            <p role="alert" className="text-xs font-semibold text-halt">
              {saveError}
            </p>
          )}
        </form>
      </Panel>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this coupon?"
        description={`Permanently remove ${initial?.code ?? "this coupon"}? Learners can no longer redeem it, and past redemptions stay recorded. This cannot be undone.`}
        busy={deleting}
        onConfirm={() => {
          onDelete?.();
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
