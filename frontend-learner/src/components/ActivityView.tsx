import { TopNav } from "./TopNav";
import { ActivityHeatmap, HeatmapLegend } from "./ActivityHeatmap";
import type { ActivityDay } from "../containers/Activity.container";
import { PageShell } from "./Panel";

function levelFromCount(count: number, max: number): number {
  if (count === 0 || max === 0) return 0;
  const pct = count / max;
  if (pct <= 0.25) return 1;
  if (pct <= 0.5) return 2;
  if (pct <= 0.75) return 3;
  return 4;
}

export function ActivityView({
  activity,
  isLoading,
}: {
  activity: ActivityDay[];
  isLoading: boolean;
}) {
  const total = activity.reduce((s, d) => s + d.count, 0);
  const maxCount = activity.reduce((m, d) => (d.count > m ? d.count : m), 0);
  const cells = activity.map((d) => ({
    date: d.date,
    level: levelFromCount(d.count, maxCount),
    count: d.count,
  }));
  const activeDays = activity.filter((d) => d.count > 0).length;

  return (
    <div className="min-h-screen bg-room">
      <TopNav />
      <PageShell>
          <h1 className="text-2xl font-semibold text-ink">Activity</h1>
          <p className="measure mt-1 text-sm text-ink-muted">GitHub-style tracker of every lesson you marked as done — including quizzes.</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="border border-rule bg-room-sunk p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Lessons done</p><p className="tnum mt-1 text-2xl font-semibold text-ink">{total}</p><p className="text-xs text-ink-muted">marked as done (all kinds)</p></div>
            <div className="border border-rule bg-room-sunk p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Active days</p><p className="tnum mt-1 text-2xl font-semibold text-ink">{activeDays}</p><p className="text-xs text-ink-muted">days with at least one completion</p></div>
            <div className="border border-rule bg-room-sunk p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Busiest day</p><p className="tnum mt-1 text-2xl font-semibold text-ink">{maxCount}</p><p className="text-xs text-ink-muted">most lessons in a single day</p></div>
          </div>

          <div className="mt-6 border border-rule bg-room-raised p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-ink">Contribution graph</h2>
              <span className="tnum border border-rule bg-room-sunk px-2.5 py-1 text-[11px] font-semibold text-ink-muted">last 26 weeks</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">Hover a cell — it’s the exact count for that day. Includes <span className="font-semibold text-ink">Mark as done</span> and quiz completions.</p>
            <div className="mt-5 border border-rule bg-room-sunk p-4 sm:p-6">
              {isLoading ? <p className="text-sm text-ink-muted">Loading…</p> : <ActivityHeatmap cells={cells} weeks={26} />}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-[11px] text-ink-faint">Sun / Wed / Fri on the left • months on top</p>
              <HeatmapLegend />
            </div>
          </div>
      </PageShell>
    </div>
  );
}
