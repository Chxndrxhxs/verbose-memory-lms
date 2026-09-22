import { create, type StateCreator } from "zustand";
import { api } from "./api-client";
import type { Role, SharedUser } from "./types";

export type AuthUser = SharedUser;

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
};

function loadUser(storageKey: string): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function persistUser(storageKey: string, user: AuthUser | null): void {
  try {
    if (user) sessionStorage.setItem(storageKey, JSON.stringify(user));
    else sessionStorage.removeItem(storageKey);
  } catch {
  }
}

export function createAuthStore(storageKey: string) {
  const creator: StateCreator<AuthState> = (set) => ({
    user: loadUser(storageKey),
    isLoading: true,
    setUser: (user) => {
      persistUser(storageKey, user);
      set({ user });
    },
    logout: async () => {
      try {
        await api("/auth/logout", { method: "POST" });
      } catch {
      }
      persistUser(storageKey, null);
      set({ user: null });
    },
    fetchMe: async () => {
      set({ isLoading: true });
      try {
        const user = await api<AuthUser>("/users/me");
        persistUser(storageKey, user);
        set({ user, isLoading: false });
      } catch {
        persistUser(storageKey, null);
        set({ user: null, isLoading: false });
      }
    },
  });
  return create<AuthState>()(creator);
}

export function hasRole(user: AuthUser | null, role: Role): boolean {
  return user?.role === role;
}

export function canTeach(user: AuthUser | null): boolean {
  return user?.role === "instructor" || user?.role === "admin";
}
