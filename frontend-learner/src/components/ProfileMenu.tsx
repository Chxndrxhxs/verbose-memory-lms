import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export function ProfileMenu() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  if (!user) return null;
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-full bg-zinc-50 px-2 py-1 pr-3 hover:bg-zinc-100">
        {user.avatar ? <img src={user.avatar} alt="" className="h-6 w-6 rounded-full object-cover" /> : <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0f172a] text-[10px] text-white">{user.name[0]}</span>}
        <span className="hidden sm:block text-xs font-semibold">{user.name}</span>
        <span className="text-[10px] text-zinc-400">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full pt-2">
          <div className="w-44 rounded-2xl bg-white p-2 shadow-xl border">
            <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-zinc-50">👤 Profile</Link>
            <button onClick={() => { setOpen(false); logout(); nav("/login"); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-zinc-50 text-left">↩ Logout</button>
          </div>
        </div>
      )}
    </div>
  );
}
