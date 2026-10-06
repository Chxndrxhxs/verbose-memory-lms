import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Heart, LogOut, User } from "@masterlms/shared";
import { useAuth } from "../hooks/useAuth";
import { useWishlistIds } from "../hooks/useWishlist";
import { cn } from "../lib/utils";

export function ProfileMenu() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { data: wishlistIds } = useWishlistIds();
  const wishlistCount = wishlistIds?.length ?? 0;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;
  const initial = user.name?.trim()?.[0]?.toUpperCase() ?? "?";

  const Avatar = ({ size = "h-8 w-8" }: { size?: string }) =>
    user.avatar ? (
      <img src={user.avatar} alt="" className={cn("shrink-0 object-cover", size)} />
    ) : (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center bg-ink font-semibold text-ink-inverse",
          size,
          size.includes("h-8") ? "text-xs" : "text-sm",
        )}
      >
        {initial}
      </span>
    );

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={user.name}
        className="flex h-9 items-center gap-2 border border-rule bg-room-raised px-1.5 transition-colors hover:bg-room-sunk"
      >
        <Avatar />
        <span className="hidden max-w-[120px] truncate text-[13px] font-medium text-ink sm:block">
          {user.name}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2.5}
          aria-hidden
          className={cn("shrink-0 text-ink-faint transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-60 border border-rule-strong bg-room-raised shadow-[0_18px_44px_-12px_rgba(30,18,36,0.26)]">
          <div className="flex items-center gap-2.5 border-b border-rule px-3.5 py-3">
            <Avatar size="h-9 w-9" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-ink">{user.name}</p>
              {user.email && <p className="truncate text-xs text-ink-faint">{user.email}</p>}
            </div>
          </div>

          <div role="menu" className="p-1">
            <Link
              to="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-ink-muted transition-colors hover:bg-room-sunk hover:text-ink"
            >
              <User size={15} strokeWidth={2.25} aria-hidden /> Profile
            </Link>
            <Link
              to="/wishlist"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-ink-muted transition-colors hover:bg-room-sunk hover:text-ink"
            >
              <Heart size={15} strokeWidth={2.25} aria-hidden /> Wishlist
              {wishlistCount > 0 && (
                <span className="tnum ml-auto border border-rule bg-room-sunk px-1.5 py-0.5 text-[10px] font-semibold text-ink">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false);
                logout();
                nav("/login");
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium text-ink-muted transition-colors hover:bg-halt-soft hover:text-halt"
            >
              <LogOut size={15} strokeWidth={2.25} aria-hidden /> Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}