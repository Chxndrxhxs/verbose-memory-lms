import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiEnvelope } from "../lib/api";
import type { AdminEnrollment, Envelope } from "../types/admin";
import { EnrollmentsView } from "../components/EnrollmentsView";

const PAGE_SIZE = 20;

export function EnrollmentsContainer() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [progress, setProgress] = useState<"" | "active" | "done">("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, progress]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "enrollments", debouncedQ, progress, page],
    queryFn: () => {
      const params = new URLSearchParams({ page_size: String(PAGE_SIZE), page: String(page) });
      if (debouncedQ) params.set("q", debouncedQ);
      if (progress) params.set("progress", progress);
      return apiEnvelope<Envelope<AdminEnrollment>>(`/admin/enrollments?${params}`);
    },
  });

  const del = useMutation({
    mutationFn: (id: number) =>
      apiEnvelope<{ data: null; error: null; meta: null }>(`/admin/enrollments/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "enrollments"] });
      setPage(1);
    },
  });

  return (
    <EnrollmentsView
      data={data?.data ?? []}
      total={data?.meta.total ?? 0}
      pages={Math.max(data?.meta.pages ?? 1, 1)}
      page={page}
      onPage={setPage}
      q={q}
      onSearch={setQ}
      progress={progress}
      onProgress={setProgress}
      searchLoading={q !== debouncedQ}
      loading={isLoading || (isError === false && !data)}
      error={isError || !data ? String(error ?? new Error("Failed to load enrollments")) : null}
      onDelete={(id) => del.mutate(id)}
      deleting={del.isPending}
      deletingId={del.variables as number | undefined}
    />
  );
}