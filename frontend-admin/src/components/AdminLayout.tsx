import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FileText,
  LayoutGrid,
  ListChecks,
  LogOut,
  Network,
  Receipt,
  UserPlus,
  Users,
  type LucideIcon,
} from "@masterlms/shared";
import { cn } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";

const NAV: { to: string; label: string; icon: LucideIcon; end?: boolean; count?: string }[] = [
  { to: "/", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/users", label: "Users", icon: Users, count: "Accounts" },
  { to: "/courses", label: "Courses", icon: FileText, count: "Catalogue" },
  { to: "/enrollments", label: "Enrollments", icon: UserPlus, count: "Activity" },
  { to: "/payments", label: "Payments", icon: Receipt, count: "Ledger" },
  { to: "/assignments", label: "Assignments", icon: ListChecks, count: "Assessments" },
  { to: "/categories", label: "Categories", icon: Network, count: "Taxonomy" },
];

export function AdminLayout() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const nav = useNavigate();

  const handleLogout = async () => {
    await logout();
    nav("/login");
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* Desktop rail: bordered, not floating. Structure from rules, not shadow. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-rule bg-paper-raised md:flex">
        <div className="flex h-14 items-center gap-2.5 border-b border-rule px-4">
          <span className="flex h-7 w-7 items-center justify-center bg-ink text-[13px] font-bold text-paper-raised">
            Q
          </span>
          <div className="leading-none">
            <p className="text-[13px] font-semibold tracking-tight text-ink">QTNXT</p>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
              Admin
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto p-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium transition-colors duration-100",
                  isActive
                    ? "bg-paper-sunk text-ink"
                    : "text-ink-muted hover:bg-paper-sunk hover:text-ink",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active marker is a rail, not a filled pill. */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 bg-ink transition-opacity",
                      isActive ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <item.icon size={15} strokeWidth={2.2} aria-hidden />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-rule p-2">
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="h-7 w-7 shrink-0 object-cover" />
            ) : (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-ink text-[11px] font-semibold text-paper-raised">
                {(user?.name?.[0] ?? "A").toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-xs font-semibold text-ink">{user?.name}</p>
              <p className="truncate text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                Administrator
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium text-ink-muted transition-colors hover:bg-paper-sunk hover:text-halt"
          >
            <LogOut size={15} strokeWidth={2.2} aria-hidden />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-rule bg-paper-raised px-4 md:hidden">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center bg-ink text-[13px] font-bold text-paper-raised">
            Q
          </span>
          <p className="text-[13px] font-semibold tracking-tight text-ink">QTNXT Admin</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex h-9 w-9 items-center justify-center text-ink-muted transition-colors hover:bg-paper-sunk"
          aria-label="Log out"
        >
          <LogOut size={16} strokeWidth={2.2} />
        </button>
      </header>

      {/* Mobile nav: a horizontal ledger strip, not pill chips. */}
      <nav className="flex gap-0 overflow-x-auto border-b border-rule bg-paper px-3 md:hidden">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold transition-colors",
                isActive
                  ? "border-ink text-ink"
                  : "border-transparent text-ink-faint hover:text-ink-muted",
              )
            }
          >
            <item.icon size={13} strokeWidth={2.2} aria-hidden />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className="px-4 py-6 sm:px-6 md:ml-56 md:py-8">
        <div className="mx-auto max-w-[1400px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}