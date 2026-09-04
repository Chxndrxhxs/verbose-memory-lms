import type { LeaderboardEntry, LeaderboardResponse } from "@masterlms/shared";
import { TIER_META } from "@masterlms/shared";
import { TierBadge } from "./TierBadge";

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
  if (rank === 1) return "bg-gradient-to-br from-amber-300 to-yellow-500 text-zinc-900 ring-amber-200 shadow-[0_2px_10px_rgba(251,191,36,0.45)]";
  if (rank === 2) return "bg-gradient-to-br from-zinc-200 to-zinc-400 text-zinc-800 ring-zinc-200";
  if (rank === 3) return "bg-gradient-to-br from-amber-600 to-orange-700 text-white ring-amber-200";
  return "bg-zinc-100 text-zinc-600 ring-zinc-200";
}

function headerLabel(ordering: string) {
  if (ordering === "-quiz_accuracy") return "Quiz";
  if (ordering === "-completion") return "Completion";
  if (ordering === "-certificates") return "Certs";
  if (ordering === "-streak") return "Streak";
  return "Quiz · Done";
}

function RightCell({ e, ordering }: { e: LeaderboardEntry; ordering: string }) {
  if (ordering === "-quiz_accuracy") return <span className="font-black">{Math.round(e.stats.quiz_accuracy * 100)}%</span>;
  if (ordering === "-completion") return <span className="font-black">{Math.round(e.stats.completion_rate * 100)}%</span>;
  if (ordering === "-certificates") return <span className="font-black">{e.stats.certificates}</span>;
  if (ordering === "-streak") return <span className="font-black">{e.stats.streak}d</span>;
  return (
    <>
      <span className="font-bold">{Math.round(e.stats.quiz_accuracy * 100)}%</span>
      <span className="text-zinc-400"> · </span>
      <span className="text-zinc-600">{e.stats.lessons_completed}</span>
    </>
  );
}

export function LeaderboardView({
  data,
  isLoading,
  params,
  meta,
  me,
  scope,
  onCity,
  onCategory,
  onSeason,
  onOrdering,
  onPage,
  onScope,
}: {
  data: LeaderboardEntry[];
  isLoading: boolean;
  params: { city: string; category: string; season: string; ordering: string; page: number };
  meta: LeaderboardResponse["meta"] | undefined;
  me: LeaderboardEntry | null | undefined;
  scope: "global" | "my_students";
  onCity: (v: string) => void;
  onCategory: (v: string) => void;
  onSeason: (v: string) => void;
  onOrdering: (v: string) => void;
  onPage: (p: number) => void;
  onScope: (s: "global" | "my_students") => void;
}) {
  const cities = meta?.cities ?? [];
  const categories = meta?.categories ?? [];
  void TIER_META;
  const isScoped = scope === "my_students";
  const hl = "text-zinc-900";
  const dim = "text-zinc-500";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Leaderboard</h1>
          <p className="mt-1 text-sm text-zinc-500">{isScoped ? "Your students — ranked on this month's activity" : "Top learners — ranked on quiz, completion, certs, and streak."}</p>
        </div>
        <div className="flex gap-1 rounded-full bg-zinc-900 p-1 text-xs font-bold">
          <button onClick={() => onSeason("current")} className={`rounded-full px-4 py-1.5 ${params.season === "current" ? "bg-white text-zinc-900" : "text-white hover:bg-white/10"}`}>This Month</button>
          <button onClick={() => onSeason("alltime")} className={`rounded-full px-4 py-1.5 ${params.season === "alltime" ? "bg-white text-zinc-900" : "text-white hover:bg-white/10"}`}>All Time</button>
        </div>
      </div>
      <div className="flex gap-1 rounded-full bg-zinc-900 p-1 text-xs font-bold w-fit">
        <button onClick={() => onScope("global")} className={`rounded-full px-4 py-1.5 ${scope === "global" ? "bg-white text-zinc-900" : "text-white hover:bg-white/10"}`}>All Learners</button>
        <button onClick={() => onScope("my_students")} className={`rounded-full px-4 py-1.5 ${scope === "my_students" ? "bg-white text-zinc-900" : "text-white hover:bg-white/10"}`}>My Students{meta?.total != null && isScoped ? ` (${meta.total})` : ""}</button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-white p-3 shadow-sm">
        <select value={params.city} onChange={(e) => onCity(e.target.value)} className="rounded-full border bg-zinc-50 px-3 py-2 text-xs font-semibold outline-none">
          <option value="">All cities</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={params.category} onChange={(e) => onCategory(e.target.value)} className="rounded-full border bg-zinc-50 px-3 py-2 text-xs font-semibold outline-none">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={params.ordering} onChange={(e) => onOrdering(e.target.value)} className="ml-auto rounded-full border bg-white px-3 py-2 text-xs font-semibold outline-none">
          {SORTS.map((s) => <option key={s.value} value={s.value}>Sort: {s.label}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-[72px] animate-pulse rounded-2xl bg-white shadow-sm" />)}
        </div>
      ) : data.length === 0 ? (
        isScoped ? (
          <div className="rounded-2xl border border-dashed bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-bold">No students yet</p>
            <p className="mt-1 text-xs text-zinc-500">Share your course link to get your first learners.</p>
            <a href="/courses/create" className="mt-3 inline-block rounded-full bg-zinc-900 px-4 py-2 text-xs font-bold text-white">Create course</a>
          </div>
        ) : (
          <div className="rounded-2xl border bg-white p-8 text-center text-sm text-zinc-500">No learners match these filters.</div>
        )
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="hidden grid-cols-[52px_1fr_148px_152px_92px] gap-2 border-b bg-zinc-50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest sm:grid">
              <button onClick={() => onOrdering("rank")} className={`text-left ${params.ordering === "rank" ? hl : dim}`}># {params.ordering === "rank" ? "▼" : ""}</button>
              <span className={dim}>Player</span>
              <span className={dim}>Tier</span>
              <button onClick={() => onOrdering("rank")} className={`text-left ${params.ordering === "rank" ? hl : dim}`}>RR {params.ordering === "rank" ? "▼" : ""}</button>
              <button onClick={() => onOrdering(params.ordering)} className={`text-right ${params.ordering !== "rank" ? `${hl} underline decoration-zinc-300 underline-offset-4` : dim}`}>{headerLabel(params.ordering)} {params.ordering !== "rank" ? "▼" : ""}</button>
            </div>
            {data.map((e) => {
              const tier = TIER_META[e.tier] ?? TIER_META.Iron;
              return (
                <div key={e.learner.id} className={`flex items-center gap-3 border-b px-3 py-3 last:border-0 sm:grid sm:grid-cols-[52px_1fr_148px_152px_92px] sm:gap-3 sm:px-4 ${e.rank <= 3 ? "bg-gradient-to-r from-white to-zinc-50/60" : ""}`}>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ring-1 ${rankMedal(e.rank)}`}>{e.rank}</span>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-xs font-black ring-1 ${e.rank <= 3 ? "ring-amber-200" : "ring-zinc-200"}`}>
                      {e.learner.avatar ? <img src={e.learner.avatar} alt="" className="h-full w-full object-cover" /> : <span className="text-zinc-600">{(e.learner.name[0] ?? "?").toUpperCase()}</span>}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold leading-tight">{e.learner.name}</p>
                      <p className="truncate text-xs text-zinc-500">{e.learner.city || "—"} · {e.stats.lessons_completed} done · {e.stats.certificates} certs · {e.stats.streak}d streak</p>
                    </div>
                  </div>
                  <div className="hidden items-center sm:flex"><TierBadge tier={e.tier} /></div>
                  <div className="ml-auto flex w-[132px] flex-col gap-1.5 sm:ml-0 sm:w-auto">
                    <div className="flex items-center justify-between text-xs"><span className={`font-black tracking-tight ${params.ordering === "rank" ? "text-zinc-900" : "text-zinc-600"}`}>{e.rr} RR</span><span className="sm:hidden"><TierBadge tier={e.tier} /></span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-100"><div className={`h-full rounded-full ${tier.bar}`} style={{ width: rrBarWidth(e.rr) }} /></div>
                    {params.ordering !== "rank" && <span className="text-right text-[10px] font-bold text-zinc-500 sm:hidden">{headerLabel(params.ordering)}: <RightCell e={e} ordering={params.ordering} /></span>}
                  </div>
                  <div className={`hidden text-right text-xs sm:block ${params.ordering !== "rank" ? "rounded-full bg-zinc-900 px-2.5 py-1 text-white" : ""}`}>
                    <RightCell e={e} ordering={params.ordering} />
                  </div>
                </div>
              );
            })}
          </div>
          {meta && meta.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button disabled={params.page <= 1} onClick={() => onPage(params.page - 1)} className="rounded-full border bg-white px-4 py-1.5 text-xs font-bold disabled:opacity-40">Prev</button>
              <span className="text-xs text-zinc-500">Page {meta.page} / {meta.pages} · {meta.total} players</span>
              <button disabled={params.page >= meta.pages} onClick={() => onPage(params.page + 1)} className="rounded-full border bg-white px-4 py-1.5 text-xs font-bold disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}

      {me && !data.some((d) => d.learner.id === me.learner.id) && (
        <div className="sticky bottom-3 flex items-center gap-3 rounded-2xl border bg-zinc-900 px-4 py-3 text-white shadow-lg">
          <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ring-1 ${rankMedal(me.rank)}`}>{me.rank}</span>
          <span className="text-sm font-bold">You</span>
          <span className="text-xs text-white/70">{me.learner.city || "—"}</span>
          <TierBadge tier={me.tier} />
          <span className="ml-auto text-sm font-black">{me.rr} RR</span>
        </div>
      )}
    </div>
  );
}
