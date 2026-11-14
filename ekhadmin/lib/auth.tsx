"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, ApiError, getToken, setToken, type StaffUser } from "./api";

type AuthCtx = {
  user: StaffUser | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setReady(true);
      return;
    }
    try {
      const data = await api<{ user: StaffUser }>("/api/auth/me");
      setUser(data.user);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setToken(null);
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!ready) return;
    const publicPath = pathname === "/login" || pathname === "/privacy";
    if (!user && !publicPath) router.replace("/login");
    if (user && pathname === "/login") {
      router.replace(user.role === "superadmin" ? "/admin" : "/dashboard");
    }
    if (user?.role === "superadmin" && pathname && !pathname.startsWith("/admin") && !publicPath) {
      router.replace("/admin");
    }
    if (user && user.role !== "superadmin" && pathname?.startsWith("/admin")) {
      router.replace("/dashboard");
    }
  }, [ready, user, pathname, router]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const data = await api<{ token: string; user: StaffUser }>("/api/auth/staff/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setToken(data.token);
      setUser(data.user);
      router.replace(data.user.role === "superadmin" ? "/admin" : "/dashboard");
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Нэвтрэх амжилтгүй.";
    }
  }, [router]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    router.replace("/login");
  }, [router]);

  const value = useMemo(() => ({ user, ready, login, logout }), [user, ready, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
