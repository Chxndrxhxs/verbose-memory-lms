import type { LeaderboardEntry, LeaderboardResponse } from "@masterlms/shared";
import { TIER_META } from "@masterlms/shared";
import { TierBadge } from "./TierBadge";
import { Segmented } from "./Button";
import { Select } from "./Controls";
import { ListMessage, Pager, SkeletonRows } from "./DataGrid";
import { Panel } from "./Panel";

const SORTS = [
  { value: "rank", label: "Rank" },
  { value: "-quiz_accuracy", label: "Quiz" },
  { value: "-completion", label: "Completion" },
  { value: "-certificates", label: "Certs" },
  { value: "-streak", label: "Streak" },
];

function rrBarWidth(rr: number) {
  return `${Math.max(4, Math.min(100, rr / 10))}%`;
}

function rankMedal(rank: number) {
  if (rank === 1) return "bg-gold text-ink border border-gold-deep";
  if (rank === 2) return "bg-room-sunk text-ink border border-rule-strong";
  if (rank === 3) return "bg-gold-wash text-gold-deep border border-gold-deep/45";
  return "bg-room-sunk text-ink-muted border border-rule";
}

function headerLabel(ordering: string) {
  if (ordering === "-quiz_accuracy") return "Quiz";
  if (ordering === "-completion") return "Completion";
  if (ordering === "-certificates") return "Certs";
  if (ordering === "-streak") return "Streak";
  return "Quiz · Done";
}

function RightCell({ e, ordering }: { e: LeaderboardEntry; ordering: string }) {
  if (ordering === "-quiz_accuracy") return <span className="tnum font-semibold">{Math.round(e.stats.quiz_accuracy * 100)}%</span>;
  if (ordering === "-completion") return <span className="tnum font-semibold">{Math.round(e.stats.completion_rate * 100)}%</span>;
  if (ordering === "-certificates") return <span className="tnum font-semibold">{e.stats.certificates}</span>;
  if (ordering === "-streak") return <span className="tnum font-semibold">{e.stats.streak}d</span>;
  return (
    <>
      <span className="tnum font-semibold">{Math.round(e.stats.quiz_accuracy * 100)}%</span>
      <span className="text-ink-faint"> · </span>
      <span className="tnum text-ink-muted">{e.stats.lessons_completed}</span>
    </>
  );
}

export function LeaderboardView({
  data,
  isLoading,
  params,
  meta,
  me,
  onCity,
  onCategory,
  onSeason,
  onOrdering,
  onPage,
}: {
  data: LeaderboardEntry[];
  isLoading: boolean;
  params: { city: string; category: string; season: string; ordering: string; page: number };
  meta: LeaderboardResponse["meta"] | undefined;
  me: LeaderboardEntry | null | undefined;
  onCity: (v: string) => void;
  onCategory: (v: string) => void;
  onSeason: (v: string) => void;
  onOrdering: (v: string) => void;
  onPage: (p: number) => void;
}) {
  const cities = meta?.cities ?? [];
  const categories = meta?.categories ?? [];
  const hl = "text-ink";
  const dim = "text-ink-muted";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Leaderboard</h1>
          <p className="mt-1 text-sm text-ink-muted">Ranked by activity — quiz 40% · completion 30% · certs 20% · streak 10%</p>
        </div>
        <Segmented
          size="sm"
          value={params.season === "alltime" ? "alltime" : "current"}
          onChange={(v) => onSeason(v)}
          ariaLabel="Leaderboard season"
          options={[
            { value: "current" as const, label: "This Month" },
            { value: "alltime" as const, label: "All Time" },
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 border border-rule bg-room-raised p-3">
        <Select value={params.city} onChange={(e) => onCity(e.target.value)} aria-label="Filter by city" className="w-auto text-xs font-semibold">
          <option value="">All cities</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select value={params.category} onChange={(e) => onCategory(e.target.value)} aria-label="Filter by category" className="w-auto text-xs font-semibold">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select value={params.ordering} onChange={(e) => onOrdering(e.target.value)} aria-label="Sort leaderboard" className="ml-auto w-auto text-xs font-semibold">
          {SORTS.map((s) => <option key={s.value} value={s.value}>Sort: {s.label}</option>)}
        </Select>
      </div>

      {isLoading ? (
        <SkeletonRows rows={6} className="border border-rule bg-room-raised" />
      ) : data.length === 0 ? (
        <Panel>
          <ListMessage
            kind="empty"
            title="No learners match these filters."
            body="Try clearing the city or category filter to see the full leaderboard."
          />
        </Panel>
      ) : (
        <>
          <Panel flush>
            <div className="hidden grid-cols-[52px_1fr_148px_152px_92px] gap-2 border-b border-rule bg-room-sunk px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] sm:grid">
              <button type="button" onClick={() => onOrdering("rank")} className={`text-left ${params.ordering === "rank" ? hl : dim}`}># {params.ordering === "rank" ? "▼" : ""}</button>
              <span className={dim}>Player</span>
              <span className={dim}>Tier</span>
              <button type="button" onClick={() => onOrdering("rank")} className={`text-left ${params.ordering === "rank" ? hl : dim}`}>RR {params.ordering === "rank" ? "▼" : ""}</button>
              <button type="button" onClick={() => onOrdering(params.ordering)} className={`text-right ${params.ordering !== "rank" ? `${hl} underline decoration-rule-strong underline-offset-4` : dim}`}>{headerLabel(params.ordering)} {params.ordering !== "rank" ? "▼" : ""}</button>
            </div>
            {data.map((e) => {
              const tier = TIER_META[e.tier] ?? TIER_META.Iron;
              return (
                <div
                  key={e.learner.id}
                  className={`row-hover flex items-center gap-3 border-b border-rule px-3 py-3 last:border-0 sm:grid sm:grid-cols-[52px_1fr_148px_152px_92px] sm:gap-3 sm:px-4 ${e.rank <= 3 ? "bg-gold-wash" : ""}`}
                >
                  <span className={`tnum flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${rankMedal(e.rank)}`}>{e.rank}</span>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-room-raised text-xs font-semibold ${e.rank <= 3 ? "border-gold-deep/45" : "border-rule"}`}>
                      {e.learner.avatar ? <img src={e.learner.avatar} alt="" className="h-full w-full object-cover" /> : <span className="text-ink-muted">{(e.learner.name[0] ?? "?").toUpperCase()}</span>}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold leading-tight text-ink">{e.learner.name}</p>
                      <p className="tnum truncate text-xs text-ink-muted">{e.learner.city || "—"} · {e.stats.lessons_completed} done · {e.stats.certificates} certs · {e.stats.streak}d streak</p>
                    </div>
                  </div>
                  <div className="hidden items-center sm:flex"><TierBadge tier={e.tier} /></div>
                  <div className="ml-auto flex w-[132px] flex-col gap-2 sm:ml-0 sm:w-auto">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`tnum font-semibold ${params.ordering === "rank" ? "text-ink" : "text-ink-muted"}`}>{e.rr} RR</span>
                      <span className="sm:hidden"><TierBadge tier={e.tier} /></span>
                    </div>
                    <div className="h-2 overflow-hidden bg-rule/50"><div className={`h-full ${tier.bar}`} style={{ width: rrBarWidth(e.rr) }} /></div>
                    {params.ordering !== "rank" && <span className="tnum text-right text-[10px] font-semibold text-ink-muted sm:hidden">{headerLabel(params.ordering)}: <RightCell e={e} ordering={params.ordering} /></span>}
                  </div>
                  <div className={`hidden text-right text-xs sm:block ${params.ordering !== "rank" ? "border border-ink bg-ink px-2.5 py-1 text-ink-inverse" : ""}`}>
                    <RightCell e={e} ordering={params.ordering} />
                  </div>
                </div>
              );
            })}
          </Panel>

          {meta && meta.pages > 1 && (
            <Pager
              page={meta.page}
              pages={meta.pages}
              total={meta.total}
              onChange={onPage}
              noun="player"
            />
          )}
        </>
      )}

      {me && !data.some((d) => d.learner.id === me.learner.id) && (
        <div className="sticky bottom-3 flex items-center gap-3 border border-ink bg-ink px-4 py-3 text-ink-inverse shadow-lg">
          <span className={`tnum flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${rankMedal(me.rank)}`}>{me.rank}</span>
          <span className="text-sm font-semibold">You</span>
          <span className="text-xs text-ink-inverse/70">{me.learner.city || "—"}</span>
          <TierBadge tier={me.tier} />
          <span className="tnum ml-auto text-sm font-semibold">{me.rr} RR</span>
        </div>
      )}
    </div>
  );
}
