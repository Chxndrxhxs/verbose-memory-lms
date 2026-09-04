import { TopNav } from "./TopNav";
import { ActivityHeatmap, HeatmapLegend } from "./ActivityHeatmap";
import type { ActivityDay } from "../containers/Activity.container";

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
    <div className="min-h-screen bg-[#f6f5f1]">
      <TopNav />
      <div className="w-full px-4 py-6 sm:px-6">
        <div className="w-full rounded-[20px] bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight">Activity</h1>
          <p className="mt-1 text-sm text-zinc-500">GitHub-style tracker of every lesson you marked as done — including quizzes.</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-zinc-50 p-4"><p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Lessons done</p><p className="mt-1 text-2xl font-black">{total}</p><p className="text-xs text-zinc-500">marked as done (all kinds)</p></div>
            <div className="rounded-2xl bg-zinc-50 p-4"><p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Active days</p><p className="mt-1 text-2xl font-black">{activeDays}</p><p className="text-xs text-zinc-500">days with at least one completion</p></div>
            <div className="rounded-2xl bg-zinc-50 p-4"><p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Busiest day</p><p className="mt-1 text-2xl font-black">{maxCount}</p><p className="text-xs text-zinc-500">most lessons in a single day</p></div>
          </div>

          <div className="mt-6 rounded-[20px] border bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-black tracking-tight">Contribution graph</h2>
              <span className="rounded-full border bg-zinc-50 px-2.5 py-1 text-[11px] font-bold text-zinc-600">last 26 weeks</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">Hover a cell — it’s the exact count for that day. Includes <span className="font-semibold text-zinc-700">Mark as done</span> and quiz completions.</p>
            <div className="mt-5 rounded-xl border bg-white p-4 sm:p-6">
              {isLoading ? <p className="text-sm text-zinc-500">Loading…</p> : <ActivityHeatmap cells={cells} weeks={26} />}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-[11px] text-zinc-400">Sun / Wed / Fri on the left • months on top</p>
              <HeatmapLegend />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
