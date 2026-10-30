import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
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
  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      setUser(false);
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    setUser(data);
    return data;
  };
  const register = async (body: any) => {
    const { data } = await api.post("/auth/register", body);
    setUser(data);
    return data;
  };
  const logout = async () => {
    await api.post("/auth/logout").catch(() => undefined);
    setUser(false);
  };
  const can = (perm: string) => !!user && (user.permissions || []).includes(perm);
  return <Ctx.Provider value={{ user, refresh, login, register, logout, can }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
