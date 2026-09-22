import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { Menu, X, canTeach } from "@masterlms/shared";
import { useAuth } from "../hooks/useAuth";
import { ProfileMenu } from "./ProfileMenu";
import { cn } from "../lib/utils";

const LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/courses", label: "Courses" },
  { to: "/activity", label: "Activity" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/analytics", label: "Analytics" },
  { to: "/assignments", label: "Assignments" },
];

export function InstructorHeader() {
  const user = useAuth((s) => s.user);
  const [menuOpen, setMenuOpen] = useState(false);
  // A learner session can land here via shared auth cookies — every instructor
  // link would bounce, so hide the nav instead of showing dead links.
  const showNav = !user || canTeach(user);
  return (
    <div className="sticky top-0 z-30 w-full bg-white px-4 py-3 shadow-sm sm:px-6">
      <div className="flex w-full items-center justify-between">
        <Link to={showNav && user ? "/dashboard" : "/"} className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0f172a] text-xs font-bold text-white">Q</span>
          <span className="text-sm font-bold tracking-tight">QTNXT</span>
          <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-zinc-900">Teach</span>
        </Link>
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-5 text-sm font-medium text-zinc-600 lg:flex">
          {showNav && LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? "text-zinc-900 font-semibold" : "hover:text-zinc-900")}>{l.label}</NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? <ProfileMenu /> : <Link to="/login" className="rounded-full bg-[#0f172a] px-4 py-1.5 text-sm font-semibold text-white">Login</Link>}
          <Link to="/courses/create" className="rounded-full bg-[#0f172a] px-4 py-1.5 text-sm font-semibold text-white hidden sm:inline-flex">+ Create course</Link>
          {showNav && (
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 lg:hidden"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </div>
      {menuOpen && showNav && (
        <nav className="mt-2 grid gap-1 border-t border-zinc-100 pt-2 lg:hidden">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  "rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                  isActive && "bg-zinc-100 font-semibold text-zinc-900"
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
