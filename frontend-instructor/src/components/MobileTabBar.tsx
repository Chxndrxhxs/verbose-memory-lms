import { NavLink } from "react-router-dom";
import {
  Activity,
  BarChart3,
  BookOpen,
  FileText,
  Layers,
  LayoutGrid,
  Trophy,
} from "@masterlms/shared";
import { cn } from "../lib/utils";

/*
 * Seven destinations, matching the desktop nav. Packs and Leaderboard
 * were desktop-only, so both were unreachable on a phone.
 */
const TABS = [
  { to: "/dashboard", label: "Home", Icon: LayoutGrid },
  { to: "/courses", label: "Courses", Icon: BookOpen },
  { to: "/assignments", label: "Tests", Icon: FileText },
  { to: "/packs", label: "Packs", Icon: Layers },
  { to: "/analytics", label: "Stats", Icon: BarChart3 },
  { to: "/activity", label: "Activity", Icon: Activity },
  { to: "/leaderboard", label: "Ranks", Icon: Trophy },
];

export function MobileTabBar() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-slate-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <div className="grid grid-cols-7">
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