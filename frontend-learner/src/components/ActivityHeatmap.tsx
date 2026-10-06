type Cell = { date: string; level: number; count?: number };

const CELL = 22;
const GAP = 6;
const GUTTER = 36;
const MONTH_GAP = 22;

export function ActivityHeatmap({ cells, weeks = 26 }: { cells: Cell[]; weeks?: number }) {
  const byDate = new Map(cells.map((c) => [c.date, c] as const));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastColDays = today.getDay() + 1;
  const start = new Date(today);
  start.setDate(today.getDate() - (weeks - 1) * 7 - lastColDays + 1);

  const colors = [
    "bg-room-sunk border-rule",
    "bg-gold-wash border-gold/25",
    "bg-gold/40 border-gold/40",
    "bg-gold/70 border-gold-deep/45",
    "bg-gold-deep border-gold-deep",
  ];
  const monthFmt = new Intl.DateTimeFormat("en", { month: "short" });

  type WeekCol = { weekIndex: number; month: number; monthLabel: string; isFirstOfMonth: boolean; isLastOfMonth: boolean };
  const cols: WeekCol[] = [];
  for (let w = 0; w < weeks; w++) {
    const colStart = new Date(start);
    colStart.setDate(start.getDate() + w * 7);
    const colEnd = new Date(colStart);
    colEnd.setDate(colStart.getDate() + 6);
    const isFirstOfMonth = colStart.getDate() <= 7;
    const month = colStart.getMonth();
    cols.push({
      weekIndex: w,
      month,
      monthLabel: monthFmt.format(colStart),
      isFirstOfMonth,
      isLastOfMonth: colEnd.getMonth() !== month,
    });
  }

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex w-fit items-start">
        {/* weekday gutter */}
        <div className="flex shrink-0 flex-col pr-2" style={{ rowGap: GAP, width: GUTTER, paddingTop: 18 }}>
          {weekdays.map((d) => {
            const visible = d === "Sun" || d === "Wed" || d === "Fri";
            return (
              <span
                key={d}
                className={`text-[11px] font-semibold uppercase tracking-wider leading-none ${visible ? "text-ink-muted" : "text-transparent"}`}
                style={{ height: CELL }}
              >
                {d}
              </span>
            );
          })}
        </div>

        <div className="flex">
          {cols.map((col, idx) => {
            const showLabel = col.isFirstOfMonth;
            const nextIsNewMonth = idx < cols.length - 1 && cols[idx + 1].isFirstOfMonth;
            // First and last row of the column belong to the labeled month;
            // rows between them follow the actual date's month.
            const firstRowMonth = new Date(start);
            firstRowMonth.setDate(start.getDate() + col.weekIndex * 7);
            const lastRowMonth = new Date(firstRowMonth);
            lastRowMonth.setDate(firstRowMonth.getDate() + 6);
            return (
              <div key={col.weekIndex} className="flex items-start" style={{ marginRight: nextIsNewMonth ? MONTH_GAP : GAP }}>
                <div className="flex flex-col">
                  <div className="h-[18px] text-[11px] font-semibold uppercase tracking-[0.14em] leading-none text-ink-muted">
                    {showLabel ? col.monthLabel : ""}
                  </div>
                  <div className="flex flex-col" style={{ rowGap: GAP }}>
                    {Array.from({ length: 7 }).map((__, d) => {
                      const date = new Date(start);
                      date.setDate(start.getDate() + col.weekIndex * 7 + d);
                      const cellMonth = date.getMonth();
                      const inMonth = showLabel ? cellMonth === col.month : true;
                      const isFuture = date > today;
                      if (!inMonth || isFuture) {
                        return (
                          <span key={d} style={{ width: CELL, height: CELL }} aria-hidden="true" />
                        );
                      }
                      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                      const cell = byDate.get(key);
                      const level = cell?.level ?? 0;
                      const count = cell?.count ?? 0;
                      const label = count === 0 ? `No activity on ${key}` : `${count} lesson${count === 1 ? "" : "s"} on ${key}`;
                      return (
                        <span
                          key={d}
                          title={label}
                          className={`border transition-colors hover:brightness-105 ${colors[level]}`}
                          style={{ width: CELL, height: CELL }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function HeatmapLegend() {
  return (
    <div className="flex items-center gap-2 text-[11px] font-medium text-ink-muted">
      <span>Less</span>
      <span className="h-[18px] w-[18px] border border-rule bg-room-sunk" />
      <span className="h-[18px] w-[18px] border border-gold/25 bg-gold-wash" />
      <span className="h-[18px] w-[18px] border border-gold/40 bg-gold/40" />
      <span className="h-[18px] w-[18px] border border-gold-deep/45 bg-gold/70" />
      <span className="h-[18px] w-[18px] border border-gold-deep bg-gold-deep" />
      <span>More</span>
    </div>
  );
}