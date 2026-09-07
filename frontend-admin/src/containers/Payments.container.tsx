import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiEnvelope } from "../lib/api";
import type { AdminPayment, Envelope } from "../types/admin";
import { PaymentsView } from "../components/PaymentsView";

const PAGE_SIZE = 20;

export function PaymentsContainer() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, status]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "payments", debouncedQ, status, page],
    queryFn: () => {
      const params = new URLSearchParams({ page_size: String(PAGE_SIZE), page: String(page) });
      if (debouncedQ) params.set("q", debouncedQ);
      if (status) params.set("status", status);
      return apiEnvelope<Envelope<AdminPayment>>(`/admin/payments?${params}`);
    },
  });

  return (
    <PaymentsView
      data={data?.data ?? []}
      total={data?.meta.total ?? 0}
      pages={Math.max(data?.meta.pages ?? 1, 1)}
      page={page}
      onPage={setPage}
      q={q}
      onSearch={setQ}
      status={status}
      onStatus={setStatus}
      searchLoading={q !== debouncedQ}
      loading={isLoading || (isError === false && !data)}
      error={isError || !data ? String(error ?? new Error("Failed to load payments")) : null}
    />
  );
}