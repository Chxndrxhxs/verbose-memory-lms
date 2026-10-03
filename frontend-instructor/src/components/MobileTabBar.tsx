import { NavLink } from "react-router-dom";
import { Activity, BarChart3, BookOpen, FileText, LayoutGrid } from "@masterlms/shared";
import { cn } from "../lib/utils";

/*
 * Five destinations, not six. The old bar carried Tests and Ranks but dropped
 * Packs entirely, so a whole product area was unreachable on mobile.
 */
const TABS = [
  { to: "/dashboard", label: "Home", Icon: LayoutGrid },
  { to: "/courses", label: "Courses", Icon: BookOpen },
  { to: "/assignments", label: "Tests", Icon: FileText },
  { to: "/analytics", label: "Stats", Icon: BarChart3 },
  { to: "/activity", label: "Activity", Icon: Activity },
];

export function MobileTabBar() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-slate-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <div className="grid grid-cols-5">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex min-w-0 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors",
                isActive ? "text-ink" : "text-ink-faint",
              )
            }
          >
            <Icon size={19} strokeWidth={2.1} aria-hidden />
            <span className="max-w-full truncate">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}