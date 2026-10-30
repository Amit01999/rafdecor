import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { track } from "@/lib/seo";
import { useAuth } from "./AuthContext";
import type { CartLine, Quote } from "@/types";

interface CartCtx {
  items: CartLine[];
  quote?: Quote;
  quoteLoading: boolean;
  count: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (line: CartLine, name?: string) => void;
  setQty: (product_id: string, variant_id: string | null | undefined, qty: number) => void;
  remove: (product_id: string, variant_id?: string | null) => void;
  clear: () => void;
}

const Ctx = createContext<CartCtx>(null as any);
const KEY = "rd_cart";
const same = (a: CartLine, pid: string, vid?: string | null) => a.product_id === pid && (a.variant_id || null) === (vid || null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartLine[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
  });
  const [open, setOpen] = useState(false);
  const synced = useRef<string | null>(null);

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(items)); }, [items]);

  useEffect(() => {
    if (!user || synced.current === user.id) return;
    synced.current = user.id;
    api.get("/cart").then(({ data }) => {
      setItems((local) => {
        const merged = [...data.items];
        local.forEach((l) => {
          const ex = merged.find((m) => same(m, l.product_id, l.variant_id));
          if (ex) ex.quantity = Math.max(ex.quantity, l.quantity);
          else merged.push(l);
        });
        return merged;
      });
    }).catch(() => undefined);
  }, [user]);

  useEffect(() => {
    if (!user || synced.current !== user.id) return;
    const t = setTimeout(() => api.put("/cart", { items }).catch(() => undefined), 500);
    return () => clearTimeout(t);
  }, [items, user]);

  const { data: quote, isFetching } = useQuery<Quote>({
    queryKey: ["quote", items],
    queryFn: async () => (await api.post("/cart/quote", { items })).data,
    enabled: items.length > 0,
    staleTime: 15_000,
  });

  const add = useCallback((line: CartLine, name?: string) => {
    setItems((prev) => {
      const ex = prev.find((p) => same(p, line.product_id, line.variant_id));
      if (ex) return prev.map((p) => (p === ex ? { ...p, quantity: Math.min(99, p.quantity + line.quantity) } : p));
      return [...prev, { ...line, variant_id: line.variant_id || null }];
    });
    track("add_to_cart", { product_id: line.product_id, quantity: line.quantity });
    toast.success(name ? `${name} added to your cart` : "Added to cart");
    setOpen(true);
  }, []);

  const setQty = (pid: string, vid: string | null | undefined, qty: number) =>
    setItems((prev) => prev.map((p) => (same(p, pid, vid) ? { ...p, quantity: Math.max(1, Math.min(99, qty)) } : p)));

  const remove = (pid: string, vid?: string | null) => {
    setItems((prev) => prev.filter((p) => !same(p, pid, vid)));
    track("remove_from_cart", { product_id: pid });
  };

  const clear = () => setItems([]);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  return (
    <Ctx.Provider value={{ items, quote: items.length ? quote : undefined, quoteLoading: isFetching, count, open, setOpen, add, setQty, remove, clear }}>
      {children}
    </Ctx.Provider>
  );
}

export const useCart = () => useContext(Ctx);
