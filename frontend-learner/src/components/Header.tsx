import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ProfileMenu } from "./ProfileMenu";

export function Header() {
  const user = useAuth((s) => s.user);
  return (
    <header className="absolute left-1/2 top-4 z-20 flex w-[92%] max-w-[720px] -translate-x-1/2 items-center justify-between rounded-full bg-white px-2 py-2 shadow-lg sm:px-3">
      <div className="flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0f172a] text-xs font-bold text-white">
            K
          </span>
          <span className="text-sm font-bold tracking-tight">Knoova</span>
        </Link>
        <nav className="ml-4 hidden items-center gap-4 text-sm font-medium text-zinc-600 sm:flex">
          <NavLink to="/" className={({ isActive }) => (isActive ? "text-zinc-900" : "hover:text-zinc-900")}>
            Home
          </NavLink>
          <NavLink to="/courses" className={({ isActive }) => (isActive ? "text-zinc-900" : "hover:text-zinc-900")}>
            Courses
          </NavLink>
          <NavLink to="/assignments" className={({ isActive }) => (isActive ? "text-zinc-900" : "hover:text-zinc-900")}>
            Assignments
          </NavLink>
          <a href="#faq" className="hover:text-zinc-900">
            About
          </a>
        </nav>
      </div>
      <div className="flex items-center gap-2">
        {user ? (
          <ProfileMenu />
        ) : (
          <>
            <Link to="/login" className="hidden rounded-full px-4 py-1.5 text-sm font-medium sm:block">Login</Link>
            <Link to="/login" className="rounded-full bg-[#0f172a] px-4 py-1.5 text-sm font-semibold text-white">Get Started</Link>
          </>
        )}
      </div>
    </header>
  );
}
