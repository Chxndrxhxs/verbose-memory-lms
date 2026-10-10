import { Link, NavLink } from "react-router-dom";
import { canTeach } from "@masterlms/shared";
import { useAuth } from "../hooks/useAuth";
import { MobileTabBar } from "./MobileTabBar";
import { ProfileMenu } from "./ProfileMenu";
import { TeachMark } from "./Badge";
import { cn } from "../lib/utils";

const LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/courses", label: "Courses" },
  { to: "/assignments", label: "Assignments" },
  { to: "/packs", label: "Packs" },
  { to: "/analytics", label: "Analytics" },
  { to: "/activity", label: "Activity" },
  { to: "/leaderboard", label: "Leaderboard" },
];

export function InstructorHeader() {
  const user = useAuth((s) => s.user);
  // A learner session can land here via shared auth cookies — every instructor
  // link would bounce, so hide the nav instead of showing dead links.
  const showNav = !user || canTeach(user);

  return (
    <>
      {/*
        Sticky, not fixed: it keeps its place in the flow, so no page needs a
        manual top offset. The builder bar measures this element to sit flush
        beneath it.
      */}
      <header
        data-site-header
        className="sticky top-0 z-40 border-b border-rule bg-slate-panel/95 backdrop-blur supports-[backdrop-filter]:bg-slate-panel/80"
      >
        <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            to={showNav && user ? "/dashboard" : "/"}
            className="flex shrink-0 items-center gap-2"
          >
            <span className="flex h-7 w-7 items-center justify-center bg-ink text-[13px] font-bold text-ink-inverse">
              Q
            </span>
            <span className="text-sm font-semibold tracking-tight text-ink">QTNXT</span>
            <TeachMark />
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex" aria-label="Primary">
            {showNav &&
              LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    cn(
                      "relative px-2.5 py-2 text-[13px] font-medium transition-colors",
                      isActive ? "text-ink" : "text-ink-muted hover:text-ink",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {l.label}
                      {/* Active marker is an underline rule, not a filled pill. */}
                      <span
                        aria-hidden
                        className={cn(
                          "absolute inset-x-2.5 -bottom-px h-[2px] bg-ink transition-opacity",
                          isActive ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </>
                  )}
                </NavLink>
              ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {user ? (
              <ProfileMenu />
            ) : (
              <Link
                to="/login"
                className="inline-flex h-8 items-center border border-ink bg-ink px-3 text-xs font-semibold text-ink-inverse transition-colors hover:bg-ink/88"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {showNav && <MobileTabBar />}
    </>
  );
}