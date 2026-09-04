import { useQuery } from "@tanstack/react-query";
import { ActivityView } from "../components/ActivityView";
import { api } from "../lib/api";

export type ActivityDay = { date: string; count: number };

export function ActivityContainer() {
  const { data, isLoading } = useQuery({
    queryKey: ["me", "activity"],
    queryFn: () => api<ActivityDay[]>("/me/activity/"),
  });

  return <ActivityView activity={data ?? []} isLoading={isLoading} />;
}
