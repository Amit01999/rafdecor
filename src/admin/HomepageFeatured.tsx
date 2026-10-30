import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { GripVertical, ArrowUp, ArrowDown, X } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { money, cldImg } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { PageLoader, StatusBadge } from "@/components/common";
import { AdminPage, Table, Td, Pager, Card, inp } from "./ui";

// Manages which products appear in the homepage's "Exquisite Creations —
// আমাদের সিগনেচার কালেকশন" section, and their display order. This is a
// dedicated page (not a Products sub-feature): it reuses the existing
// Product model's `featured`/`sort_order` fields and the existing
// /admin/products, /admin/products/bulk and /admin/products/reorder
// endpoints — there is no separate "featured product" model or API.
export function AdminHomepageFeatured() {
  const { can } = useAuth();
  const writable = can("products.write");
  const [dragId, setDragId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const { data: featured, refetch: refetchFeatured } = useQuery({
    queryKey: ["admin-homepage-featured"],
    queryFn: async () => (await api.get("/admin/products", { params: { featured: true, limit: 100 } })).data.items,
  });
  const { data: browse, refetch: refetchBrowse } = useQuery({
    queryKey: ["admin-homepage-browse", q, page],
    queryFn: async () => (await api.get("/admin/products", { params: { q: q || undefined, page } })).data,
  });

  const refetchAll = () => { refetchFeatured(); refetchBrowse(); };

  const toggleFeatured = async (p: any, next: boolean) => {
    try {
      await api.post("/admin/products/bulk", { ids: [p.id], action: next ? "feature" : "unfeature" });
      toast.success(next ? `Added “${p.name}” to Exquisite Creations` : `Removed “${p.name}” from Exquisite Creations`);
      refetchAll();
    } catch (x) { toast.error(errorMessage(x)); }
  };

  const reorder = async (ids: string[]) => {
    try { await api.post("/admin/products/reorder", { ids }); refetchFeatured(); } catch (x) { toast.error(errorMessage(x)); }
  };
  const move = (i: number, d: number) => { const ids = featured.map((p: any) => p.id); [ids[i], ids[i + d]] = [ids[i + d], ids[i]]; reorder(ids); };
  const drop = (targetIndex: number) => {
    if (!dragId) return;
    const ids = featured.map((p: any) => p.id);
    const from = ids.indexOf(dragId);
    setDragId(null);
    if (from === -1 || from === targetIndex) return;
    ids.splice(from, 1);
    ids.splice(targetIndex, 0, dragId);
    reorder(ids);
  };

  return (
    <AdminPage title="Homepage Featured Products" sub="Choose which products appear in the homepage’s Exquisite Creations — আমাদের সিগনেচার কালেকশন section, and drag to set their order." testId="admin-homepage-featured">
      <Card title="Exquisite Creations — current order" className="mb-6"
        actions={<span className="text-xs text-[#7A6960]">{featured?.length || 0} selected{featured?.length ? " · drag to reorder" : ""}</span>}>
        {!featured ? (
          <p className="text-sm text-[#7A6960]">Loading…</p>
        ) : featured.length === 0 ? (
          <p className="text-sm text-[#7A6960]">No products are featured yet. Check products below to add them here.</p>
        ) : (
          <ul className="divide-y divide-[#EFE7DA]" data-testid="featured-products-list">
            {featured.map((p: any, i: number) => (
              <li
                key={p.id}
                draggable={writable}
                onDragStart={() => setDragId(p.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => drop(i)}
                className={`flex items-center gap-3 py-2.5 transition-opacity ${dragId === p.id ? "opacity-40" : ""}`}
                data-testid={`featured-product-${p.slug}`}
              >
                {writable && <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-[#A89A90]" aria-hidden="true" />}
                <img src={cldImg(p.images?.[0]?.url, 80)} alt="" className="h-10 w-9 shrink-0 object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-[#7A6960]">{money(p.effective_price)}</p>
                </div>
                {writable && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${p.name} up`} className="disabled:opacity-30" data-testid={`featured-up-${p.slug}`}><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button disabled={i === featured.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${p.name} down`} className="disabled:opacity-30" data-testid={`featured-down-${p.slug}`}><ArrowDown className="h-3.5 w-3.5" /></button>
                    <button onClick={() => toggleFeatured(p, false)} aria-label={`Remove ${p.name} from Exquisite Creations`} data-testid={`featured-remove-${p.slug}`}><X className="h-3.5 w-3.5 text-red-800" /></button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="All products">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Search name, SKU, slug"
          className={`${inp} mb-4 w-64`}
          data-testid="homepage-featured-search"
        />
        {!browse ? <PageLoader /> : (
          <>
            <Table head={["Featured", "Product", "Status", "Price", ""]} testId="homepage-featured-browse-table">
              {browse.items.map((p: any) => (
                <tr key={p.id} className="hover:bg-[#FAF7F2]">
                  <Td>
                    <input
                      type="checkbox"
                      checked={!!p.featured}
                      disabled={!writable}
                      onChange={(e) => toggleFeatured(p, e.target.checked)}
                      aria-label={`Feature ${p.name} on homepage`}
                      className="accent-[#4E3629]"
                      data-testid={`toggle-featured-${p.slug}`}
                    />
                  </Td>
                  <Td><div className="flex items-center gap-3"><img src={cldImg(p.images?.[0]?.url, 100)} alt="" className="h-11 w-10 object-cover" /><span className="font-medium">{p.name}</span></div></Td>
                  <Td><StatusBadge status={p.status} /></Td>
                  <Td>{money(p.effective_price)}{p.on_sale && <span className="ml-1 text-xs text-[#B07A5B]">sale</span>}</Td>
                  <Td>{p.featured && <span className="text-xs text-[#7A6960]">In Exquisite Creations</span>}</Td>
                </tr>
              ))}
            </Table>
            <Pager page={page} total={browse.total} limit={20} onPage={setPage} />
          </>
        )}
      </Card>
    </AdminPage>
  );
}
