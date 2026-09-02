import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ProfileMenu } from "./ProfileMenu";

export function InstructorHeader() {
  const user = useAuth((s) => s.user);
  return (
    <div className="sticky top-0 z-30 flex w-full items-center justify-between bg-white px-4 py-3 shadow-sm sm:px-6">
      <Link to="/" className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0f172a] text-xs font-bold text-white">Q</span>
        <span className="text-sm font-bold tracking-tight">QTNXT</span>
        <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-zinc-900">Teach</span>
      </Link>
      <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-5 text-sm font-medium text-zinc-600 lg:flex">
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "text-zinc-900 font-semibold" : "hover:text-zinc-900")}>Dashboard</NavLink>
        <NavLink to="/courses" className={({ isActive }) => (isActive ? "text-zinc-900 font-semibold" : "hover:text-zinc-900")}>Courses</NavLink>
        <NavLink to="/activity" className={({ isActive }) => (isActive ? "text-zinc-900 font-semibold" : "hover:text-zinc-900")}>Activity</NavLink>
        <NavLink to="/leaderboard" className={({ isActive }) => (isActive ? "text-zinc-900 font-semibold" : "hover:text-zinc-900")}>Leaderboard</NavLink>
        <NavLink to="/analytics" className={({ isActive }) => (isActive ? "text-zinc-900 font-semibold" : "hover:text-zinc-900")}>Analytics</NavLink>
        <NavLink to="/assignments" className={({ isActive }) => (isActive ? "text-zinc-900 font-semibold" : "hover:text-zinc-900")}>Assignments</NavLink>
      </nav>
        <div className="flex items-center gap-2">
          {user ? <ProfileMenu /> : <Link to="/login" className="rounded-full bg-[#0f172a] px-4 py-1.5 text-sm font-semibold text-white">Login</Link>}
          <Link to="/courses/create" className="rounded-full bg-[#0f172a] px-4 py-1.5 text-sm font-semibold text-white hidden sm:inline-flex">+ Create course</Link>
        </div>
    </div>
  );
}
