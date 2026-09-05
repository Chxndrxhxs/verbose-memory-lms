import { useSearchParams } from "react-router-dom";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { LeaderboardView } from "../components/LeaderboardView";

export function LeaderboardContainer() {
  const [sp, setSp] = useSearchParams();
  const city = sp.get("city") ?? "";
  const category = sp.get("category") ?? "";
  const season = sp.get("season") ?? "current";
  const ordering = sp.get("ordering") ?? "rank";
  const page = Math.max(1, Number(sp.get("page") ?? "1") || 1);
  const myStudents = sp.get("my_students") === "1";
  const { data, isLoading } = useLeaderboard({ city, category, season, ordering, page, myStudents });

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(sp);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.delete("page");
    setSp(next, { replace: true });
  }

  return (
    <LeaderboardView
      data={data?.data ?? []}
      isLoading={isLoading}
      params={{ city, category, season, ordering, page }}
      meta={data?.meta}
      me={data?.me ?? null}
      scope={myStudents ? "my_students" : "global"}
      onCity={(v) => setParam("city", v)}
      onCategory={(v) => setParam("category", v)}
      onSeason={(v) => setParam("season", v)}
      onOrdering={(v) => setParam("ordering", v)}
      onPage={(p) => setParam("page", String(p))}
      onScope={(s) => setParam("my_students", s === "my_students" ? "1" : "")}
    />
  );
}
