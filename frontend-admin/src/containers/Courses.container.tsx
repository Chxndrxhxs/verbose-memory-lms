import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiEnvelope } from "../lib/api";
import type { AdminCourse, Envelope } from "../types/admin";
import { CoursesView } from "../components/CoursesView";

const PAGE_SIZE = 20;

export function CoursesContainer() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState<"" | "draft" | "published">("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, status]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "courses", debouncedQ, status, page],
    queryFn: () => {
      const params = new URLSearchParams({ page_size: String(PAGE_SIZE), page: String(page) });
      if (debouncedQ) params.set("q", debouncedQ);
      if (status) params.set("status", status);
      return apiEnvelope<Envelope<AdminCourse>>(`/admin/courses?${params}`);
    },
  });

  const toggle = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "draft" | "published" }) =>
      api<{ status: "draft" | "published" }>(`/admin/courses/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "courses"] }),
  });

  const del = useMutation({
    mutationFn: (id: number) =>
      apiEnvelope<{ data: null; error: null; meta: null }>(`/admin/courses/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
      setPage(1);
    },
  });

  return (
    <CoursesView
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
      error={isError || !data ? String(error ?? new Error("Failed to load courses")) : null}
      togglingId={toggle.variables?.id}
      onToggle={(id, next) => toggle.mutate({ id, status: next })}
      onDelete={(id) => del.mutate(id)}
      deleting={del.isPending}
      deletingId={del.variables as number | undefined}
    />
  );
}