import { Link } from "react-router-dom";
import { TIER_META, type LeaderboardEntry, type LeaderboardResponse } from "@masterlms/shared";
import { PageHeader } from "./Panel";
import { ListMessage, ListPanel, Pager } from "./DataGrid";
import { Segmented } from "./Button";
import { Select } from "./Controls";
import { TierBadge } from "./TierBadge";
import { cn } from "../lib/utils";

const SORTS = [
  { value: "rank", label: "Rank" },
  { value: "-quiz_accuracy", label: "Quiz" },
  { value: "-completion", label: "Completion" },
  { value: "-certificates", label: "Certs" },
  { value: "-streak", label: "Streak" },
];

function headerLabel(ordering: string): string {
  if (ordering === "-quiz_accuracy") return "Quiz";
  if (ordering === "-completion") return "Completion";
  if (ordering === "-certificates") return "Certs";
  if (ordering === "-streak") return "Streak";
  return "Quiz · Done";
}

function RightCell({ e, ordering }: { e: LeaderboardEntry; ordering: string }) {
  if (ordering === "-quiz_accuracy") return <>{e.stats.quiz_accuracy}%</>;
  if (ordering === "-completion") return <>{e.stats.completion_rate}%</>;
  if (ordering === "-certificates") return <>{e.stats.certificates}</>;
  if (ordering === "-streak") return <>{e.stats.streak}d</>;
  return (
    <>
      {e.stats.quiz_accuracy}% · {e.stats.completion_rate}%
    </>
  );
}

function rrBarWidth(rr: number): string {
  return `${Math.max(4, Math.min(100, rr / 10))}%`;
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
  const isScoped = scope === "my_students";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Rankings"
        title="Leaderboard"
        description={
          isScoped
            ? "Your learners, ranked on this season's activity."
            : "Every learner on QTNXT, ranked on quiz accuracy, completion, certificates and streak."
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              ariaLabel="Season"
              size="sm"
              value={params.season}
              onChange={(v) => onSeason(v)}
              options={[
                { value: "current", label: "This month" },
                { value: "alltime", label: "All time" },
              ]}
            />
            <Segmented
              ariaLabel="Scope"
              size="sm"
              value={scope}
              onChange={(v) => onScope(v)}
              options={[
                {
                  value: "my_students",
                  label: isScoped && meta?.total != null ? `My students (${meta.total})` : "My students",
                },
                { value: "global", label: "All learners" },
              ]}
            />
          </div>
        }
      />

      <ListPanel
        toolbar={
          <>
            <Select
              value={params.city}
              onChange={(e) => onCity(e.target.value)}
              aria-label="Filter by city"
              className="w-full min-w-[150px] sm:w-auto"
            >
              <option value="">All cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select
              value={params.category}
              onChange={(e) => onCategory(e.target.value)}
              aria-label="Filter by category"
              className="w-full min-w-[150px] sm:w-auto"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select
              value={params.ordering}
              onChange={(e) => onOrdering(e.target.value)}
              aria-label="Sort leaderboard"
              className="w-full min-w-[160px] sm:ml-auto sm:w-auto"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  Sort: {s.label}
                </option>
              ))}
            </Select>
          </>
        }
        footer={
          meta && meta.pages > 1 ? (
            <Pager
              page={meta.page}
              pages={meta.pages}
              total={meta.total}
              onChange={onPage}
              noun="player"
            />
          ) : null
        }
      >
        {isLoading ? (
          <ul className="divide-y divide-rule">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-4">
                <div className="h-7 w-7 shrink-0 animate-pulse bg-slate-sunk" />
                <div className="h-9 w-9 shrink-0 animate-pulse bg-slate-sunk" />
                <div className="min-w-0 flex-1">
                  <div className="h-3 w-32 animate-pulse bg-slate-sunk" />
                </div>
              </li>
            ))}
          </ul>
        ) : data.length === 0 ? (
          <ListMessage
            kind="empty"
            title={isScoped ? "No students enrolled yet" : "No learners match these filters"}
            body={
              isScoped
                ? "Share your course link to get your first learners. They will appear here as soon as they enrol."
                : "Try a different city, category or sort order."
            }
            action={
              isScoped ? (
                <Link
                  to="/courses/create"
                  className="inline-flex h-9 items-center border border-ink bg-ink px-4 text-xs font-semibold text-ink-inverse transition-colors hover:bg-ink/88"
                >
                  Create a course
                </Link>
              ) : null
            }
          />
        ) : (
          <>
            {/* Real table on desktop, stacked rows on mobile — one source of truth. */}
            <div className="hidden grid-cols-[56px_1fr_132px_150px_120px] gap-3 border-b border-rule-strong bg-slate-ground px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint sm:grid">
              <button
                onClick={() => onOrdering("rank")}
                className={cn(
                  "text-left transition-colors hover:text-ink",
                  params.ordering === "rank" && "text-ink",
                )}
              >
                #
              </button>
              <span>Learner</span>
              <span>Tier</span>
              <button
                onClick={() => onOrdering("rank")}
                className={cn(
                  "text-left transition-colors hover:text-ink",
                  params.ordering === "rank" && "text-ink",
                )}
              >
                Rank points
              </button>
              <button
                onClick={() => onOrdering(params.ordering)}
                className={cn(
                  "text-right transition-colors hover:text-ink",
                  params.ordering !== "rank" && "text-ink",
                )}
              >
                {headerLabel(params.ordering)}
              </button>
            </div>

            <ul className="divide-y divide-rule">
              {data.map((e) => {
                const tier = TIER_META[e.tier] ?? TIER_META.Iron;
                const podium = e.rank <= 3;
                return (
                  <li
                    key={e.learner.id}
                    className={cn(
                      "row-hover flex flex-wrap items-center gap-3 px-4 py-3 sm:grid sm:grid-cols-[56px_1fr_132px_150px_120px]",
                      podium && "bg-signal-wash/45",
                    )}
                  >
                    <span
                      className={cn(
                        "tnum flex h-7 w-7 shrink-0 items-center justify-center border text-xs font-semibold",
                        podium
                          ? "border-signal-deep/40 bg-signal font-bold text-ink"
                          : "border-rule bg-slate-sunk text-ink-muted",
                      )}
                    >
                      {e.rank}
                    </span>

                    <div className="flex min-w-0 items-center gap-3">
                      {e.learner.avatar ? (
                        <img
                          src={e.learner.avatar}
                          alt=""
                          className="h-9 w-9 shrink-0 object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-slate-sunk text-xs font-semibold text-ink-muted">
                          {(e.learner.name[0] ?? "?").toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{e.learner.name}</p>
                        <p className="tnum truncate text-xs text-ink-faint">
                          {[e.learner.city || "—", `${e.stats.lessons_completed} done`, `${e.stats.certificates} certs`, `${e.stats.streak}d streak`].join(" · ")}
                        </p>
                      </div>
                    </div>

                    <div className="hidden sm:block">
                      <TierBadge tier={e.tier} />
                    </div>

                    <div className="hidden sm:block">
                      <p className="tnum text-sm font-semibold text-ink">{e.rr} RP</p>
                      <div
                        className="mt-1 h-1.5 w-full bg-rule/45"
                        role="img"
                        aria-label={`${e.rr} rank points`}
                      >
                        <div
                          className={cn("h-full transition-[width] duration-500 ease-out", tier.bar)}
                          style={{ width: rrBarWidth(e.rr) }}
                        />
                      </div>
                    </div>

                    <div className="ml-auto text-right sm:ml-0 sm:text-right">
                      <p className="tnum text-sm text-ink">
                        <RightCell e={e} ordering={params.ordering} />
                      </p>
                      <p className="mt-1 sm:hidden">
                        <TierBadge tier={e.tier} />
                      </p>
                      <p className="tnum mt-1 text-xs text-ink-faint sm:hidden">{e.rr} RP</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </ListPanel>

      {me && !data.some((d) => d.learner.id === me.learner.id) && (
        <div className="sticky bottom-3 flex items-center gap-3 border border-rule-strong bg-ink px-4 py-3 text-ink-inverse">
          <span className="tnum flex h-7 w-7 items-center justify-center border border-signal-deep/50 bg-signal text-xs font-bold text-ink">
            {me.rank}
          </span>
          <span className="text-sm font-semibold">You</span>
          <span className="hidden text-xs text-ink-inverse/70 sm:inline">
            {me.learner.city || "—"}
          </span>
          <span className="hidden sm:inline-flex">
            <TierBadge tier={me.tier} />
          </span>
          <span className="tnum ml-auto text-sm font-semibold">{me.rr} RP</span>
        </div>
      )}
    </div>
  );
}