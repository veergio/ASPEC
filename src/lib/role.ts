import { useEffect, useState, useCallback } from "react";

export type Role = "manager" | "teknisi" | "admin";

export interface AuthUser {
  user_id: number;
  name: string;
  email: string;
  role: string;
}

const AUTH_CHANGE_EVENT = "aspec-auth-change";

/**
 * Notify all useRole / useAuth hooks to re-fetch.
 */
export function dispatchAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
}

/**
 * Hook that fetches the current user from /api/auth/me.
 * Re-fetches whenever an auth-change event fires.
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    window.addEventListener(AUTH_CHANGE_EVENT, fetchUser);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, fetchUser);
  }, [fetchUser]);

  return { user, loading };
}

/**
 * Backwards-compatible hook: returns the role string.
 * Maps DB roles to the UI role system.
 */
export function useRole(): Role {
  const { user } = useAuth();

  if (!user) return "teknisi";

  // Map DB role → UI role
  switch (user.role) {
    case "manager":
      return "manager";
    case "admin":
      return "admin";
    case "teknisi":
    default:
      return "teknisi";
  }
}

/**
 * Logout: hit the API, clear state, redirect.
 */
export async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  dispatchAuthChange();
  window.location.href = "/login";
}