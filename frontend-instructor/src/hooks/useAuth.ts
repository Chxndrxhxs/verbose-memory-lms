import { create } from "zustand";
import type { SharedUser as User } from "@masterlms/shared";
type State = {
  user: User | null;
  isLoading: boolean;
  setUser: (u: User | null) => void;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
};

const STORAGE_KEY = "knoova_instructor_auth";

function loadUser(): User | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export const useAuth = create<State>((set) => ({
  user: loadUser(),
  isLoading: true,
  setUser: (user) => {
    try {
      if (user) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
    set({ user });
  },
  logout: async () => {
    try { await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1"}/auth/logout`, { method: "POST", credentials: "include" }); } catch {}
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
    set({ user: null });
  },
  fetchMe: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1"}/users/me`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const json = await res.json();
      const user = json.data as User;
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user)); } catch {}
      set({ user, isLoading: false });
    } catch {
      try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
      set({ user: null, isLoading: false });
    }
  },
}));
