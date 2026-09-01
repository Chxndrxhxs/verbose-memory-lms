type Cell = { date: string; level: number };

export function ActivityHeatmap({ cells, weeks = 26 }: { cells: Cell[]; weeks?: number }) {
  const byDate = new Map(cells.map((c) => [c.date, c.level]));
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - (weeks * 7 - 1));
  const colors = ["bg-zinc-100", "bg-emerald-200", "bg-emerald-400", "bg-emerald-600", "bg-emerald-800"];

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-fit">
        {Array.from({ length: weeks }).map((_, w) => (
          <div key={w} className="grid grid-rows-7 gap-1">
            {Array.from({ length: 7 }).map((__, d) => {
              const date = new Date(start);
              date.setDate(start.getDate() + w * 7 + d);
              const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
              const level = byDate.get(key) ?? 0;
              return <span key={d} className={`h-3 w-3 rounded-sm ${colors[level]}`} />;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeatmapLegend() {
  return (
    <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-500">
      <span>Less</span>
      <span className="h-3 w-3 rounded-sm bg-zinc-100" />
      <span className="h-3 w-3 rounded-sm bg-emerald-200" />
      <span className="h-3 w-3 rounded-sm bg-emerald-400" />
      <span className="h-3 w-3 rounded-sm bg-emerald-600" />
      <span className="h-3 w-3 rounded-sm bg-emerald-800" />
      <span>More</span>
    </div>
  );
}