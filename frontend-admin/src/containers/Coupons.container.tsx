import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiEnvelope } from "../lib/api";
import type { AdminCoupon, CouponScope, Envelope } from "../types/admin";
import { CouponsView } from "../components/CouponsView";

const PAGE_SIZE = 20;

export function CouponsContainer() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [isActive, setIsActive] = useState<"true" | "false" | "">("");
  const [appliesTo, setAppliesTo] = useState<CouponScope | "">("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, isActive, appliesTo]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "coupons", debouncedQ, isActive, appliesTo, page],
    queryFn: () => {
      const params = new URLSearchParams({
        page_size: String(PAGE_SIZE),
        page: String(page),
      });
      if (debouncedQ) params.set("q", debouncedQ);
      if (isActive) params.set("is_active", isActive);
      if (appliesTo) params.set("applies_to", appliesTo);
      return apiEnvelope<Envelope<AdminCoupon>>(`/admin/coupons?${params}`);
    },
  });

  const del = useMutation({
    mutationFn: (id: number) =>
      apiEnvelope<{ data: null; error: null; meta: null }>(
        `/admin/coupons/${id}`,
        { method: "DELETE" },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });

  return (
    <CouponsView
      data={data?.data ?? []}
      total={data?.meta.total ?? 0}
      pages={Math.max(data?.meta.pages ?? 1, 1)}
      page={page}
      onPage={setPage}
      q={q}
      onSearch={setQ}
      isActive={isActive}
      onIsActive={setIsActive}
      appliesTo={appliesTo}
      onAppliesTo={setAppliesTo}
      searchLoading={q !== debouncedQ}
      loading={isLoading || (isError === false && !data)}
      error={isError || !data ? String(error ?? new Error("Failed to load coupons")) : null}
      onDelete={(id) => del.mutate(id, { onSuccess: () => setPage(1) })}
      deleting={del.isPending}
      deletingId={del.variables as number | undefined}
    />
  );
}
