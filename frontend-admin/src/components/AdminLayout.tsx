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

const NAV: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: "/", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/users", label: "Users", icon: Users },
  { to: "/courses", label: "Courses", icon: FileText },
  { to: "/enrollments", label: "Enrollments", icon: UserPlus },
  { to: "/payments", label: "Payments", icon: Receipt },
  { to: "/assignments", label: "Assignments", icon: ListChecks },
  { to: "/categories", label: "Categories", icon: Network },
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
    <div className="min-h-screen bg-[#f6f5f1]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-[#0f172a] p-4 md:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white text-sm font-black text-[#0f172a]">Q</span>
          <div className="leading-none">
            <p className="text-sm font-bold tracking-tight text-white">QTNXT</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Admin</p>
          </div>
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  isActive ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                )
              }
            >
              <item.icon size={16} strokeWidth={2.5} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white"
        >
          <LogOut size={16} strokeWidth={2.5} />
          Logout
        </button>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between bg-white px-4 py-3 shadow-sm md:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0f172a] text-xs font-black text-white">Q</span>
          <div className="leading-none">
            <p className="text-sm font-bold tracking-tight">QTNXT</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="max-w-[120px] truncate text-xs font-semibold text-zinc-600">{user?.name}</p>
          <button onClick={handleLogout} className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100" aria-label="Logout">
            <LogOut size={16} strokeWidth={2.5} />
          </button>
        </div>
      </header>
      <div className="flex gap-1 overflow-x-auto bg-[#0f172a] px-3 py-2 md:hidden">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
                isActive ? "bg-white text-[#0f172a]" : "text-zinc-300 hover:bg-white/10"
              )
            }
          >
            <item.icon size={14} strokeWidth={2.5} />
            {item.label}
          </NavLink>
        ))}
      </div>

      <main className="px-3 py-6 sm:px-6 md:ml-60 md:py-8">
        <div className="mx-auto max-w-[1280px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}