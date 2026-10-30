import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "./AuthContext";
import type { Category } from "@/types";

export function useSite() {
  return useQuery({ queryKey: ["site"], queryFn: async () => (await api.get("/content/site")).data, staleTime: 300_000 });
}

export function useCategories() {
  return useQuery<Category[]>({ queryKey: ["categories"], queryFn: async () => (await api.get("/categories")).data.items, staleTime: 300_000 });
}

export function useWishlist() {
  const { user } = useAuth();
  const nav = useNavigate();
  const q = useQuery<{ ids: string[] }>({ queryKey: ["wishlist", user && user.id], queryFn: async () => (await api.get("/wishlist")).data, enabled: !!user });
  const ids = q.data?.ids || [];
  const toggle = async (productId: string) => {
    if (!user) {
      toast("Sign in to save items to your wishlist");
      nav("/login?next=" + encodeURIComponent(window.location.pathname));
      return;
    }
    const has = ids.includes(productId);
    try {
      if (has) await api.delete(`/wishlist/${productId}`);
      else await api.post(`/wishlist/${productId}`);
      toast.success(has ? "Removed from wishlist" : "Saved to wishlist");
      q.refetch();
    } catch {
      toast.error("Could not update wishlist");
    }
  };
  return { ids, toggle, has: (id: string) => ids.includes(id) };
}
