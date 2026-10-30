import { useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { SlidersHorizontal, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { track, useSeo } from "@/lib/seo";
import { useCategories } from "@/context/SiteContext";
import { ProductCard, ProductGridSkeleton } from "@/components/store/ProductCard";
import { Breadcrumbs, EmptyState, ErrorState } from "@/components/common";
import type { Product } from "@/types";

const SORTS = [["featured", "Featured"], ["newest", "Newest"], ["popular", "Most popular"], ["price_asc", "Price: low to high"], ["price_desc", "Price: high to low"], ["name", "Name A–Z"]];

function Filters({ params, set, facets }: { params: URLSearchParams; set: (k: string, v?: string) => void; facets: any }) {
  const { data: cats } = useCategories();
  const { slug } = useParams();
  return (
    <div className="space-y-9" data-testid="shop-filters">
      <div>
        <h4 className="label-rd">Category</h4>
        <ul className="mt-3 space-y-2 text-sm">
          <li><Link to={`/shop?${params}`} className={!slug ? "font-medium text-[#4E3629]" : "text-[#594940] hover:text-[#2C1E18]"}>All products</Link></li>
          {cats?.map((c) => <li key={c.id}><Link to={`/product-category/${c.slug}`} className={slug === c.slug ? "font-medium text-[#4E3629]" : "text-[#594940] hover:text-[#2C1E18]"} data-testid={`filter-category-${c.slug}`}>{c.name} <span className="text-[#A89A90]">({c.product_count})</span></Link></li>)}
        </ul>
      </div>
      <div>
        <h4 className="label-rd">Price (৳)</h4>
        <form className="mt-3 flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); set("min_price", String(f.get("min") || "")); set("max_price", String(f.get("max") || "")); }}>
          <input name="min" type="number" min={0} defaultValue={params.get("min_price") || ""} placeholder={String(Math.floor(facets?.price_min || 0))} className="input-rd h-10" aria-label="Minimum price" data-testid="filter-min-price" />
          <span className="text-[#A89A90]">–</span>
          <input name="max" type="number" min={0} defaultValue={params.get("max_price") || ""} placeholder={String(Math.ceil(facets?.price_max || 0))} className="input-rd h-10" aria-label="Maximum price" data-testid="filter-max-price" />
          <button className="h-10 border border-[#4E3629] px-3 text-xs uppercase tracking-wider hover:bg-[#4E3629] hover:text-white" data-testid="filter-price-apply">Go</button>
        </form>
      </div>
      <div>
        <h4 className="label-rd">Availability</h4>
        {[["in_stock_only", "In stock only"], ["on_sale_only", "On sale"]].map(([k, l]) => (
          <label key={k} className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-[#4E3629]" checked={params.get(k) === "true"} onChange={(e) => set(k, e.target.checked ? "true" : undefined)} data-testid={`filter-${k}`} />{l}
          </label>
        ))}
      </div>
      {facets?.attributes?.map((a: any) => (
        <div key={a.name}>
          <h4 className="label-rd">{a.name}</h4>
          <div className="mt-3 flex flex-wrap gap-2">
            {a.values.map((v: string) => {
              const val = `${a.name}:${v}`;
              const on = params.get("attr") === val;
              return <button key={v} onClick={() => set("attr", on ? undefined : val)} className={`border px-3 py-1.5 text-xs ${on ? "border-[#4E3629] bg-[#4E3629] text-white" : "border-[#E6DDD0] bg-white hover:border-[#4E3629]"}`} data-testid={`filter-attr-${v}`}>{v}</button>;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Shop() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page") || 1);
  const q = params.get("q") || "";
  const set = (k: string, v?: string) => { const n = new URLSearchParams(params); if (v) n.set(k, v); else n.delete(k); if (k !== "page") n.delete("page"); setParams(n); };
  const { data: cat, isError: catErr } = useQuery({ queryKey: ["category", slug], queryFn: async () => (await api.get(`/categories/${slug}`)).data, enabled: !!slug, retry: false });
  const query = useQuery({
    queryKey: ["products", slug, params.toString()],
    queryFn: async () => (await api.get("/products", { params: { ...Object.fromEntries(params), category: slug, limit: 12 } })).data,
    placeholderData: keepPreviousData, retry: false,
  });
  useEffect(() => { if (q) track("search", { query: q }); }, [q]);
  useSeo({ title: cat?.name || (q ? `Search: ${q}` : "Shop"), description: cat?.description || "Shop premium handcrafted wooden furniture, kitchenware and home decor by Raf Decor." });
  const items: Product[] = query.data?.items || [];
  if (slug && catErr) return <div className="container-rd py-24"><EmptyState title="Category not found" body="This category may have been moved or archived." action={<Link to="/shop" className="btn-primary">Browse all products</Link>} /></div>;
  return (
    <div className="container-rd py-10" data-testid="shop-page">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Shop", to: slug ? "/shop" : undefined }, ...(cat ? [{ label: cat.name }] : [])]} />
      <div className="mt-6 flex flex-col gap-4 border-b border-[#E6DDD0] pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl tracking-tight sm:text-5xl">{cat?.name || (q ? `“${q}”` : "The Collection")}</h1>
          <p className="mt-3 text-sm text-[#7A6960]" data-testid="shop-result-count">{query.data ? `${query.data.total} ${query.data.total === 1 ? "product" : "products"}` : "Loading…"}{q && " matching your search"}</p>
        </div>
        <div className="flex items-center gap-3">
          <form onSubmit={(e) => { e.preventDefault(); set("q", String(new FormData(e.currentTarget).get("q") || "") || undefined); }} className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A89A90]" />
            <input name="q" defaultValue={q} key={q} placeholder="Search" className="input-rd w-56 pl-9" data-testid="shop-search-input" />
          </form>
          <Sheet>
            <SheetContent side="left" className="w-[86vw] max-w-sm overflow-y-auto bg-[#FAF7F2]"><SheetTitle className="mb-6 font-serif font-normal">Filters</SheetTitle><Filters params={params} set={set} facets={query.data?.facets} /></SheetContent>
            <MobileFilterTrigger />
          </Sheet>
          <Select value={params.get("sort") || "featured"} onValueChange={(v) => set("sort", v)}>
            <SelectTrigger className="h-11 w-48 rounded-[3px] border-[#E6DDD0] bg-white" data-testid="shop-sort-select"><SelectValue /></SelectTrigger>
            <SelectContent>{SORTS.map(([v, l]) => <SelectItem key={v} value={v} data-testid={`sort-option-${v}`}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-10 grid gap-12 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block"><Filters params={params} set={set} facets={query.data?.facets} /></aside>
        <div>
          {query.isLoading ? <ProductGridSkeleton /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : items.length === 0 ? (
            <EmptyState title="No products found" body="Try removing a filter or searching for something else." action={<button className="btn-outline" onClick={() => setParams(new URLSearchParams())} data-testid="shop-clear-filters">Clear all filters</button>} />
          ) : (
            <div className={`grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 transition-opacity ${query.isFetching ? "opacity-60" : ""}`} data-testid="shop-grid">{items.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}</div>
          )}
          {query.data?.pages > 1 && (
            <nav className="mt-14 flex justify-center gap-2" aria-label="Pagination" data-testid="shop-pagination">
              {Array.from({ length: query.data.pages }).map((_, i) => (
                <button key={i} onClick={() => set("page", String(i + 1))} className={`h-10 w-10 border text-sm ${page === i + 1 ? "border-[#4E3629] bg-[#4E3629] text-white" : "border-[#E6DDD0] hover:border-[#4E3629]"}`} data-testid={`page-btn-${i + 1}`}>{i + 1}</button>
              ))}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

function MobileFilterTrigger() {
  return <SheetTrigger className="inline-flex h-11 items-center gap-2 border border-[#E6DDD0] bg-white px-4 text-sm lg:hidden" data-testid="mobile-filters-btn"><SlidersHorizontal className="h-4 w-4" />Filters</SheetTrigger>;
}
