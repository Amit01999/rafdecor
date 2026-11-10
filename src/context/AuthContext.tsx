import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api, markAuthSessionAuthenticated, markAuthSessionLoggedOut, onAuthSessionExpired } from "@/lib/api";
import type { User } from "@/types";

interface AuthCtx {
  user: User | null | false;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
  can: (perm: string) => boolean;
}

const Ctx = createContext<AuthCtx>(null as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | false>(null);
  const authEpoch = useRef(0);
  const refresh = useCallback(async () => {
    const requestEpoch = authEpoch.current;
    try {
      const { data } = await api.get("/auth/me");
      if (requestEpoch === authEpoch.current) setUser(data);
    } catch {
      if (requestEpoch === authEpoch.current) setUser(false);
    }
  }, []);
  useEffect(() => onAuthSessionExpired(() => {
    authEpoch.current += 1;
    setUser(false);
  }), []);
  useEffect(() => { refresh(); }, [refresh]);
  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    authEpoch.current += 1;
    markAuthSessionAuthenticated();
    setUser(data);
    return data;
  };
  const register = async (body: any) => {
    const { data } = await api.post("/auth/register", body);
    authEpoch.current += 1;
    markAuthSessionAuthenticated();
    setUser(data);
    return data;
  };
  const logout = async () => {
    const requestEpoch = ++authEpoch.current;
    markAuthSessionLoggedOut();
    await api.post("/auth/logout").catch(() => undefined);
    if (requestEpoch === authEpoch.current) setUser(false);
  };
  const can = (perm: string) => !!user && (user.permissions || []).includes(perm);
  return <Ctx.Provider value={{ user, refresh, login, register, logout, can }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
