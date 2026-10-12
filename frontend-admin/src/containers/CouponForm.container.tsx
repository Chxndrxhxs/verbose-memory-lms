import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toLocalInput } from "@masterlms/shared";
import { api, apiEnvelope } from "../lib/api";
import type {
  AdminCoupon,
  AdminCouponWrite,
  AdminCourse,
  Envelope,
} from "../types/admin";
import { CouponFormView } from "../components/CouponFormView";

export type CouponFormValues = {
  code: string;
  discount_type: "percent" | "flat";
  discount_value: string;
  max_discount: string;
  min_order: string;
  usage_limit: string;
  per_user_limit: string;
  applies_to: "all" | "course" | "pack";
  course: string;
  pack: string;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
};

function toForm(c: AdminCoupon): CouponFormValues {
  return {
    code: c.code,
    discount_type: c.discount_type,
    discount_value:
      c.discount_type === "percent"
        ? String(c.discount_value)
        : c.discount_value
          ? (c.discount_value / 100).toString()
          : "",
    max_discount: c.max_discount_paise
      ? (c.max_discount_paise / 100).toString()
      : "",
    min_order: c.min_order_paise ? (c.min_order_paise / 100).toString() : "",
    usage_limit: c.usage_limit ? String(c.usage_limit) : "",
    per_user_limit: String(c.per_user_limit ?? 1),
    applies_to: c.applies_to,
    course: c.course ? String(c.course) : "",
    pack: c.pack ? String(c.pack) : "",
    valid_from: toLocalInput(c.valid_from),
    valid_to: toLocalInput(c.valid_to),
    is_active: c.is_active,
  };
}

// Form fields are human rupees/percent strings; the API wants
// paise integers and ISO timestamps, with "" meaning "no bound".
function toPayload(v: CouponFormValues): AdminCouponWrite {
  const percent = v.discount_type === "percent";
  return {
    code: v.code.trim().toUpperCase(),
    discount_type: v.discount_type,
    discount_value: percent
      ? Math.round(Number(v.discount_value))
      : Math.round(Number(v.discount_value) * 100),
    max_discount_paise:
      v.max_discount === "" ? null : Math.round(Number(v.max_discount) * 100),
    min_order_paise:
      v.min_order === "" ? 0 : Math.round(Number(v.min_order) * 100),
    usage_limit:
      v.usage_limit === ""
        ? null
        : Math.max(1, Math.round(Number(v.usage_limit))),
    per_user_limit: Math.max(1, Math.round(Number(v.per_user_limit) || 1)),
    applies_to: v.applies_to,
    course: v.applies_to === "course" ? Number(v.course) : null,
    pack: v.applies_to === "pack" ? Number(v.pack) : null,
    valid_from: v.valid_from ? new Date(v.valid_from).toISOString() : null,
    valid_to: v.valid_to ? new Date(v.valid_to).toISOString() : null,
    is_active: v.is_active,
  };
}

export function CouponFormContainer({ existingId = "" }: { existingId?: string }) {
  const qc = useQueryClient();
  const nav = useNavigate();
  const cid = Number(existingId);
  const editing = existingId !== "" && Number.isFinite(cid);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "coupon", cid],
    queryFn: () => api<AdminCoupon>(`/admin/coupons/${cid}`),
    enabled: editing,
  });

  const { data: catalog } = useQuery({
    queryKey: ["admin", "courses", "picker"],
    queryFn: () =>
      apiEnvelope<Envelope<AdminCourse>>("/admin/courses?page_size=100"),
  });
  const courseOptions = catalog?.data ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "coupons"] });

  const create = useMutation({
    mutationFn: (values: CouponFormValues) =>
      api<AdminCoupon>("/admin/coupons", {
        method: "POST",
        body: JSON.stringify(toPayload(values)),
      }),
    onSuccess: () => {
      invalidate();
      nav("/coupons");
    },
  });

  const update = useMutation({
    mutationFn: (values: CouponFormValues) =>
      api<AdminCoupon>(`/admin/coupons/${cid}`, {
        method: "PATCH",
        body: JSON.stringify(toPayload(values)),
      }),
    onSuccess: () => {
      invalidate();
      nav("/coupons");
    },
  });

  const del = useMutation({
    mutationFn: () =>
      apiEnvelope(`/admin/coupons/${cid}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      nav("/coupons");
    },
  });

  const saveError =
    create.isError || update.isError
      ? String(create.error ?? update.error ?? new Error("Could not save coupon"))
      : null;

  return (
    <CouponFormView
      initial={data ? toForm(data) : null}
      courseOptions={courseOptions}
      loading={editing && isLoading}
      loadError={
        editing && isError
          ? String(error ?? new Error("Failed to load coupon"))
          : null
      }
      editing={editing}
      onSubmit={editing ? update.mutate : create.mutate}
      saving={create.isPending || update.isPending}
      saveError={saveError}
      onDelete={editing ? () => del.mutate() : undefined}
      deleting={del.isPending}
    />
  );
}
