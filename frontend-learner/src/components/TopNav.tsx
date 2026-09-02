import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ProfileMenu } from "./ProfileMenu";

export function TopNav() {
  const user = useAuth((s) => s.user);
  return (
    <div className="sticky top-0 z-30 flex w-full items-center justify-between bg-white px-4 py-3 shadow-sm sm:px-6">
      <Link to="/" className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0f172a] text-xs font-bold text-white">Q</span>
        <span className="text-sm font-bold tracking-tight">QTNXT</span>
      </Link>
      <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-5 text-sm font-medium text-zinc-600 sm:flex">
        <NavLink to="/" className={({ isActive }) => (isActive ? "text-zinc-900" : "hover:text-zinc-900")}>Home</NavLink>
        <NavLink to="/courses" className={({ isActive }) => (isActive ? "text-zinc-900" : "hover:text-zinc-900")}>Courses</NavLink>
        <NavLink to="/activity" className={({ isActive }) => (isActive ? "text-zinc-900" : "hover:text-zinc-900")}>Activity</NavLink>
        <NavLink to="/leaderboard" className={({ isActive }) => (isActive ? "text-zinc-900" : "hover:text-zinc-900")}>Leaderboard</NavLink>
        <NavLink to="/assignments" className={({ isActive }) => (isActive ? "text-zinc-900" : "hover:text-zinc-900")}>Assignments</NavLink>
        <a href="/#faq" className="hover:text-zinc-900">About</a>
      </nav>
      {user ? <ProfileMenu /> : <Link to="/login" className="rounded-full bg-[#0f172a] px-4 py-1.5 text-sm font-semibold text-white">Get Started</Link>}
    </div>
  );
}
