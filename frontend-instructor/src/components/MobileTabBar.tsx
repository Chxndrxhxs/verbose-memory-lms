import { NavLink } from "react-router-dom";
import { Activity, BarChart3, BookOpen, FileText, LayoutGrid, Trophy } from "@masterlms/shared";

const TABS = [
  { to: "/dashboard", label: "Home", Icon: LayoutGrid },
  { to: "/courses", label: "Courses", Icon: BookOpen },
  { to: "/activity", label: "Activity", Icon: Activity },
  { to: "/leaderboard", label: "Ranks", Icon: Trophy },
  { to: "/analytics", label: "Stats", Icon: BarChart3 },
  { to: "/assignments", label: "Tests", Icon: FileText },
];

export function MobileTabBar() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <div className="grid grid-cols-6">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex min-w-0 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${
                isActive ? "text-zinc-900" : "text-zinc-400"
              }`
            }
          >
            <Icon size={20} strokeWidth={2.2} />
            <span className="max-w-full truncate">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
