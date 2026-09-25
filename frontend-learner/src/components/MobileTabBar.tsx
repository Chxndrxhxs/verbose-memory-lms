import { NavLink } from "react-router-dom";
import { Activity, BookOpen, FileText, Home, Trophy } from "@masterlms/shared";

const TABS = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/courses", label: "Courses", Icon: BookOpen },
  { to: "/activity", label: "Activity", Icon: Activity },
  { to: "/leaderboard", label: "Ranks", Icon: Trophy },
  { to: "/assignments", label: "Tests", Icon: FileText },
];

export function MobileTabBar() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <div className="grid grid-cols-5">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${
                isActive ? "text-zinc-900" : "text-zinc-400"
              }`
            }
          >
            <Icon size={20} strokeWidth={2.2} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
