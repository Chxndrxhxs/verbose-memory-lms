import { useQuery } from "@tanstack/react-query";
import type { LeaderboardResponse } from "@masterlms/shared";
import { apiEnvelope } from "@masterlms/shared";
import type { LeaderboardParams } from "../lib/leaderboard";

export function useLeaderboard(params: LeaderboardParams) {
  const qs = new URLSearchParams();
  if (params.city) qs.set("city", params.city);
  if (params.category) qs.set("category", params.category);
  if (params.season) qs.set("season", params.season);
  if (params.ordering) qs.set("ordering", params.ordering);
  qs.set("page", String(params.page ?? 1));
  const key = qs.toString();
  return useQuery({
    queryKey: ["leaderboard", key],
    queryFn: () => apiEnvelope<LeaderboardResponse>(`/leaderboard/?${key}`),
    placeholderData: (prev) => prev,
  });
}
