import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ProfileMenu } from "./ProfileMenu";
import { MobileTabBar } from "./MobileTabBar";
import { cn } from "../lib/utils";

const LINKS = [
  { to: "/courses", label: "Courses" },
  { to: "/assignments", label: "Assignments" },
  { to: "/activity", label: "Activity" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/about", label: "About" },
];

export function Header() {
  const user = useAuth((s) => s.user);

  return (
    <>
      {/*
        Sticky, not fixed: it holds its own space in the flow so no page needs
        a manual top offset.
      */}
      <header className="sticky top-0 z-40 border-b border-rule bg-room-raised/95 backdrop-blur supports-[backdrop-filter]:bg-room-raised/80">
        <div className="mx-auto flex h-14 w-full max-w-[1560px] items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#main" className="skip-link">Skip to content</a>
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center bg-ink text-[13px] font-bold text-ink-inverse">
              Q
            </span>
            <span className="text-sm font-semibold tracking-tight text-ink">QTNXT</span>
          </Link>

          <nav aria-label="Primary" className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 sm:flex">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    "relative px-3 py-2 text-[13px] font-medium transition-colors",
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
                        "absolute inset-x-3 -bottom-px h-[2px] bg-ink transition-opacity",
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
              <>
                <Link
                  to="/login"
                  className="hidden h-9 items-center px-3 text-sm font-medium text-ink-muted transition-colors hover:text-ink sm:inline-flex"
                >
                  Sign in
                </Link>
                <Link
                  to="/login"
                  className="inline-flex h-9 items-center border border-ink bg-ink px-4 text-sm font-semibold text-ink-inverse transition-colors hover:bg-ink/88"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <MobileTabBar />
    </>
  );
}