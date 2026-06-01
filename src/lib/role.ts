import { useEffect, useState } from "react";

export type Role = "manager" | "technician";
const KEY = "aspec_role";

export function getRole(): Role | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  return v === "manager" || v === "technician" ? v : null;
}

export function setRole(role: Role) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, role);
  // Simpan juga ke cookie untuk middleware
  document.cookie = `${KEY}=${role}; path=/`;
  window.dispatchEvent(new Event("aspec-role-change"));
}

export function clearRole() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  // Hapus cookie
  document.cookie = `${KEY}=; path=/; max-age=0`;
  window.dispatchEvent(new Event("aspec-role-change"));
}

export function useRole(): Role {
  const [role, setR] = useState<Role>("manager");
  useEffect(() => {
    const sync = () => setR(getRole() ?? "manager");
    sync();
    window.addEventListener("aspec-role-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("aspec-role-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return role;
}