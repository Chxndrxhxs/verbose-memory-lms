import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiEnvelope } from "../lib/api";
import type { AdminUser, AdminRole, Envelope } from "../types/admin";
import { UsersView } from "../components/UsersView";

const PAGE_SIZE = 20;

export function UsersContainer() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [role, setRole] = useState<AdminRole | "">("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, role]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "users", debouncedQ, role, page],
    queryFn: () => {
      const params = new URLSearchParams({ page_size: String(PAGE_SIZE), page: String(page) });
      if (debouncedQ) params.set("q", debouncedQ);
      if (role) params.set("role", role);
      return apiEnvelope<Envelope<AdminUser>>(`/admin/users?${params}`);
    },
  });

  const del = useMutation({
    mutationFn: (id: number) =>
      apiEnvelope<{ data: null; error: null; meta: null }>(`/admin/users/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  return (
    <UsersView
      data={data?.data ?? []}
      total={data?.meta.total ?? 0}
      pages={Math.max(data?.meta.pages ?? 1, 1)}
      page={page}
      onPage={setPage}
      q={q}
      onSearch={setQ}
      role={role}
      onRole={setRole}
      searchLoading={q !== debouncedQ}
      loading={isLoading || (isError === false && !data)}
      error={isError || !data ? String(error ?? new Error("Failed to load users")) : null}
      onDelete={(id) => del.mutate(id, { onSuccess: () => setPage(1) })}
      deleting={del.isPending}
      deletingId={del.variables as number | undefined}
    />
  );
}