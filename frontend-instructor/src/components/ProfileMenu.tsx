import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, User } from "@masterlms/shared";
import { useAuth } from "../hooks/useAuth";
import { cn } from "../lib/utils";

export function ProfileMenu() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  if (!user) return null;
  const initial = user.name?.trim()?.[0]?.toUpperCase() ?? "?";

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={user.name}
        className="flex h-10 items-center gap-2 rounded-full border border-zinc-200 bg-white py-1 pl-1 pr-2.5 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
      >
        {user.avatar ? (
          <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover ring-1 ring-zinc-200" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0f172a] text-xs font-bold text-white">
            {initial}
          </span>
        )}
        <span className="hidden max-w-[120px] truncate text-sm font-semibold text-zinc-900 sm:block">
          {user.name}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2.5}
          className={cn("shrink-0 text-zinc-500 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
          <div className="flex items-center gap-2.5 border-b border-zinc-100 px-3.5 py-3">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-zinc-200" />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0f172a] text-sm font-bold text-white">
                {initial}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-zinc-900">{user.name}</p>
              {user.email && <p className="truncate text-xs text-zinc-500">{user.email}</p>}
            </div>
          </div>
          <div role="menu" className="p-1.5">
            <Link
              to="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              <User size={15} strokeWidth={2.25} className="text-zinc-500" /> Profile
            </Link>
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false);
                logout();
                nav("/login");
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={15} strokeWidth={2.25} className="text-zinc-500" /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
