import { useQuery } from "@tanstack/react-query";
import { ActivityView } from "../components/ActivityView";
import { api } from "../lib/api";

export type ActivityDay = { date: string; count: number };

export function ActivityContainer() {
  const { data, isLoading } = useQuery({
    queryKey: ["me", "activity"],
    queryFn: async () => {
      const res = await api<ActivityDay[] | { data: ActivityDay[] }>("/me/activity/" as never);
      if (Array.isArray(res)) return res;
      const maybe = res as { data?: ActivityDay[] };
      if (Array.isArray(maybe.data)) return maybe.data;
      return [];
    },
  });

  return <ActivityView activity={data ?? []} isLoading={isLoading} />;
}
