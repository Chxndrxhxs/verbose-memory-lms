import { useQuery } from "@tanstack/react-query";
import type { AdminDashboard } from "../types/admin";
import { api } from "../lib/api";
import { DashboardView } from "../components/DashboardView";

export function DashboardContainer() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => api<AdminDashboard>("/admin/dashboard"),
  });

  return (
    <DashboardView
      data={data}
      isLoading={isLoading}
      error={isError ? String(error) : null}
    />
  );
}