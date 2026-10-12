import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { toLocalInput, type SharedCoupon, type SharedCouponWrite } from "@masterlms/shared";
import { api } from "../lib/api";
import { couponService } from "../services/coupon.service";
import {
  useCreateCoupon,
  useDeleteCoupon,
  useUpdateCoupon,
} from "../hooks/useCoupons";
import { CouponFormView } from "../components/CouponFormView";
import type { CouponFormValues, CourseOption } from "../types/coupon";

async function fetchCourseOptions(): Promise<CourseOption[]> {
  try {
    const data = await api<{ results: CourseOption[] } | CourseOption[]>(
      "/courses/mine/",
    );
    return Array.isArray(data) ? data : (data.results ?? []);
  } catch {
    return [];
  }
}

const schema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, "Code is required")
      .max(32, "Code must be 32 characters or fewer")
      .regex(/^[A-Za-z0-9-_]+$/, "Only letters, digits, hyphens and underscores"),
    discountType: z.enum(["percent", "flat"]),
    discountValue: z.string().trim().min(1, "Required"),
    maxDiscount: z.string().trim(),
    minOrder: z.string().trim(),
    usageLimit: z.string().trim(),
    perUserLimit: z.string().trim().min(1, "Required"),
    courseId: z.string(),
    validFrom: z.string(),
    validTo: z.string(),
    isActive: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const value = Number(v.discountValue);
    if (!Number.isFinite(value) || value <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["discountValue"],
        message: "Enter a positive number",
      });
    } else if (v.discountType === "percent" && value > 100) {
      ctx.addIssue({
        code: "custom",
        path: ["discountValue"],
        message: "Percent must be between 1 and 100",
      });
    }
    if (
      v.maxDiscount !== "" &&
      (!Number.isFinite(Number(v.maxDiscount)) || Number(v.maxDiscount) <= 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["maxDiscount"],
        message: "Enter a positive amount",
      });
    }
    if (!v.courseId) {
      ctx.addIssue({ code: "custom", path: ["courseId"], message: "Pick a course" });
    }
  });

const EMPTY_VALUES: CouponFormValues = {
  code: "",
  discountType: "percent",
  discountValue: "",
  maxDiscount: "",
  minOrder: "",
  usageLimit: "",
  perUserLimit: "1",
  courseId: "",
  validFrom: "",
  validTo: "",
  isActive: true,
};

function toFormValues(c: SharedCoupon): CouponFormValues {
  return {
    code: c.code,
    discountType: c.discount_type,
    discountValue:
      c.discount_type === "percent"
        ? String(c.discount_value)
        : c.discount_value
          ? (c.discount_value / 100).toString()
          : "",
    maxDiscount: c.max_discount_paise
      ? (c.max_discount_paise / 100).toString()
      : "",
    minOrder: c.min_order_paise ? (c.min_order_paise / 100).toString() : "",
    usageLimit: c.usage_limit ? String(c.usage_limit) : "",
    perUserLimit: String(c.per_user_limit ?? 1),
    courseId: c.course ? String(c.course) : "",
    validFrom: toLocalInput(c.valid_from),
    validTo: toLocalInput(c.valid_to),
    isActive: c.is_active,
  };
}

// Form fields are human rupees/percent strings; the API wants
// paise integers and ISO timestamps, with "" meaning "no bound".
function toPayload(v: CouponFormValues): SharedCouponWrite {
  const percent = v.discountType === "percent";
  return {
    code: v.code.trim().toUpperCase(),
    discount_type: v.discountType,
    discount_value: percent
      ? Math.round(Number(v.discountValue))
      : Math.round(Number(v.discountValue) * 100),
    max_discount_paise:
      v.maxDiscount === "" ? null : Math.round(Number(v.maxDiscount) * 100),
    min_order_paise:
      v.minOrder === "" ? 0 : Math.round(Number(v.minOrder) * 100),
    usage_limit:
      v.usageLimit === ""
        ? null
        : Math.max(1, Math.round(Number(v.usageLimit))),
    per_user_limit: Math.max(1, Math.round(Number(v.perUserLimit) || 1)),
    applies_to: "course",
    course: Number(v.courseId),
    valid_from: v.validFrom ? new Date(v.validFrom).toISOString() : null,
    valid_to: v.validTo ? new Date(v.validTo).toISOString() : null,
    is_active: v.isActive,
  };
}

export function CouponFormContainer({ existingId = "" }: { existingId?: string }) {
  const nav = useNavigate();
  const editing = existingId !== "";

  const [values, setValues] = useState<CouponFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  const { data: existing, isLoading, isError, error } = useQuery({
    queryKey: ["instructor", "coupon", existingId],
    queryFn: () => couponService.get(existingId),
    enabled: editing,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["mine-courses"],
    queryFn: fetchCourseOptions,
  });

  // Hydrate the form once the existing coupon arrives.
  useEffect(() => {
    if (existing) setValues(toFormValues(existing));
  }, [existing]);

  const create = useCreateCoupon();
  const update = useUpdateCoupon();
  const del = useDeleteCoupon();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const onChange = <K extends keyof CouponFormValues>(
    key: K,
    value: CouponFormValues[K],
  ) => setValues((v) => ({ ...v, [key]: value }));

  const onSubmit = () => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues)
        next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    const payload = toPayload(parsed.data);
    const done = () => {
      showToast(editing ? "Coupon saved." : "Coupon created.");
      nav("/coupons");
    };
    if (editing) update.mutate({ id: Number(existingId), payload }, { onSuccess: done });
    else create.mutate(payload, { onSuccess: done });
  };

  const onDelete = () => {
    if (!editing) return;
    if (
      !window.confirm(
        "Delete this coupon? Learners can no longer redeem it. This cannot be undone.",
      )
    )
      return;
    del.mutate(Number(existingId), {
      onSuccess: () => {
        showToast("Coupon deleted.");
        nav("/coupons");
      },
    });
  };

  return (
    <CouponFormView
      values={values}
      errors={errors}
      courseOptions={courses}
      editing={editing}
      loading={editing && isLoading}
      loadError={
        editing && isError
          ? String(error ?? new Error("Failed to load coupon"))
          : null
      }
      saving={create.isPending || update.isPending}
      deleting={del.isPending}
      toast={toast}
      onChange={onChange}
      onSubmit={onSubmit}
      onDelete={onDelete}
    />
  );
}
