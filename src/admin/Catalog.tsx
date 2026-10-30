import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, ArrowUp, ArrowDown, Trash2, Upload, ExternalLink, Pencil, Zap, ArrowLeft } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { money, fmtDate, cldImg } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { PageLoader, StatusBadge, Spinner } from "@/components/common";
import { AdminPage, Table, Td, Pager, Card, useConfirm, btn, btnOutline, inp } from "./ui";

export function AdminProducts() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState<string[]>([]);
  const [qe, setQe] = useState<any>(null);
  const [qeBusy, setQeBusy] = useState(false);
  const { can } = useAuth();
  const { confirm, dialog } = useConfirm();
  const { data, refetch } = useQuery({ queryKey: ["admin-products", q, status, page], queryFn: async () => (await api.get("/admin/products", { params: { q: q || undefined, status: status || undefined, page } })).data });
  const bulk = async (action: string) => { try { const { data: r } = await api.post("/admin/products/bulk", { ids: sel, action }); toast.success(`${r.modified} updated`); setSel([]); refetch(); } catch (x) { toast.error(errorMessage(x)); } };
  const openQuick = async (p: any) => {
    try { setQe((await api.get(`/admin/products/${p.id}`)).data); } catch (x) { toast.error(errorMessage(x)); }
  };
  const saveQuick = async () => {
    setQeBusy(true);
    try {
      await api.put(`/admin/products/${qe.id}`, { ...qe, publish_at: qe.publish_at || null });
      toast.success("Product updated"); setQe(null); refetch();
    } catch (x) { toast.error(errorMessage(x)); } finally { setQeBusy(false); }
  };
  const del = async (p: any) => {
    if (!(await confirm(`Delete “${p.name}”?`, "Products referenced by orders are archived instead of deleted, preserving order history."))) return;
    try { const { data: r } = await api.delete(`/admin/products/${p.id}`); toast.success(r.message || "Product deleted"); refetch(); } catch (x) { toast.error(errorMessage(x)); }
  };
  return (
    <AdminPage title="Products" sub="Manage catalog, pricing, variants and visibility." testId="admin-products"
      actions={can("products.write") && <Link to="/admin/products/new" className={btn} data-testid="new-product-btn"><Plus className="h-4 w-4" />New product</Link>}>
      <div className="mb-4 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search name, SKU, slug" className={`${inp} w-64`} data-testid="admin-products-search" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inp} w-40`} data-testid="admin-products-status-filter"><option value="">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select>
        {sel.length > 0 && can("products.write") && <div className="flex gap-2">{["publish", "unpublish", "archive"].map((a) => <button key={a} onClick={() => bulk(a)} className={btnOutline} data-testid={`bulk-${a}`}>{a}</button>)}</div>}
      </div>
      {qe && (
        <Card title={`Quick edit — ${qe.name}`} className="mb-6">
          <div className="grid gap-3 sm:grid-cols-6">
            <div className="sm:col-span-3"><label className="label-rd">Name</label><input value={qe.name} onChange={(e) => setQe({ ...qe, name: e.target.value })} className={inp} data-testid="qe-name" /></div>
            <div><label className="label-rd">Status</label><select value={qe.status} onChange={(e) => setQe({ ...qe, status: e.target.value })} className={inp} data-testid="qe-status"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div>
            <div><label className="label-rd">SKU</label><input value={qe.sku || ""} onChange={(e) => setQe({ ...qe, sku: e.target.value })} className={inp} /></div>
            <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={qe.featured} onChange={(e) => setQe({ ...qe, featured: e.target.checked })} className="accent-[#4E3629]" />Featured</label>
            <div><label className="label-rd">Price (৳)</label><input type="number" min={0} value={qe.price} onChange={(e) => setQe({ ...qe, price: Number(e.target.value) })} className={inp} data-testid="qe-price" /></div>
            <div><label className="label-rd">Sale price</label><input type="number" min={0} value={qe.sale_price ?? ""} onChange={(e) => setQe({ ...qe, sale_price: e.target.value === "" ? null : Number(e.target.value) })} className={inp} data-testid="qe-sale" /></div>
            {qe.manage_stock && !qe.variants?.length && <div><label className="label-rd">Stock</label><input type="number" min={0} value={qe.stock_quantity ?? ""} onChange={(e) => setQe({ ...qe, stock_quantity: e.target.value === "" ? null : Number(e.target.value) })} className={inp} data-testid="qe-stock" /></div>}
            <div className="flex items-end gap-2 sm:col-span-6 sm:justify-end">
              {qe.variants?.length > 0 && <span className="mr-auto text-xs text-[#7A6960]">Variant prices and stock are edited in the full editor.</span>}
              <button className={btnOutline} onClick={() => setQe(null)}>Cancel</button>
              <button className={btn} onClick={saveQuick} disabled={qeBusy} data-testid="qe-save">{qeBusy ? "Saving…" : "Save changes"}</button>
            </div>
          </div>
        </Card>
      )}
      {!data ? <PageLoader /> : (
        <>
          <Table head={["", "Product", "Status", "Price", "Stock", "Views", "Sold", "Updated", ""]} testId="admin-products-table">
            {data.items.map((p: any) => (
              <tr key={p.id} className="hover:bg-[#FAF7F2]">
                <Td><input type="checkbox" checked={sel.includes(p.id)} onChange={(e) => setSel(e.target.checked ? [...sel, p.id] : sel.filter((x) => x !== p.id))} aria-label={`Select ${p.name}`} /></Td>
                <Td><div className="flex items-center gap-3"><img src={cldImg(p.images?.[0]?.url, 100)} alt="" className="h-11 w-10 object-cover" /><div><Link to={`/admin/products/${p.id}`} className="font-medium hover:underline" data-testid={`admin-product-link-${p.slug}`}>{p.name}</Link><p className="text-xs text-[#7A6960]">{p.sku || "No SKU"} {p.featured && "· Featured"} {p.variants?.length ? `· ${p.variants.length} variants` : ""}</p></div></div></Td>
                <Td><StatusBadge status={p.status} /></Td>
                <Td>{money(p.effective_price)}{p.on_sale && <span className="ml-1 text-xs text-[#B07A5B]">sale</span>}</Td>
                <Td>{p.manage_stock ? (p.variants?.length ? p.variants.map((v: any) => v.stock_quantity ?? 0).join(" / ") : p.stock_quantity) : <span className="text-xs text-[#7A6960]">{p.in_stock ? "Not tracked" : "Out"}</span>}</Td>
                <Td>{p.views || 0}</Td><Td>{p.sales_count || 0}</Td><Td className="text-xs text-[#7A6960]">{fmtDate(p.updated_at)}</Td>
                <Td><div className="flex gap-2">{can("products.write") && <><button onClick={() => openQuick(p)} aria-label="Quick edit" title="Quick edit" data-testid={`quick-edit-${p.slug}`}><Zap className="h-4 w-4 text-[#B07A5B]" /></button><Link to={`/admin/products/${p.id}`} aria-label="Edit" title="Edit" data-testid={`edit-product-${p.slug}`}><Pencil className="h-4 w-4 text-[#4E3629]" /></Link></>}<a href={`/product/${p.slug}`} target="_blank" rel="noreferrer" aria-label="Preview"><ExternalLink className="h-4 w-4 text-[#7A6960]" /></a>{can("products.write") && <button onClick={() => del(p)} aria-label="Delete" data-testid={`delete-product-${p.slug}`}><Trash2 className="h-4 w-4 text-red-800" /></button>}</div></Td>
              </tr>
            ))}
          </Table>
          <Pager page={page} total={data.total} limit={20} onPage={setPage} />
        </>
      )}
      {dialog}
    </AdminPage>
  );
}

const EMPTY = { name: "", slug: "", short_description: "", description: "", category_ids: [], status: "draft", featured: false, sku: "", price: 0, sale_price: null, manage_stock: false, stock_quantity: null, stock_status: "in_stock", low_stock_threshold: 2, attributes: [], variants: [], images: [], specs: [], dimensions: "", materials: "", shipping_charge: 0, tags: [], seo: { title: "", description: "" }, publish_at: null };

export function ProductEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const isNew = id === "new";
  const [p, setP] = useState<any>(isNew ? EMPTY : null);
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState<{ id: string; name: string; progress: number }[]>([]);
  const { data: cats } = useQuery({ queryKey: ["admin-cats"], queryFn: async () => (await api.get("/admin/categories")).data.items });
  useQuery({ queryKey: ["admin-product", id], enabled: !isNew, queryFn: async () => { const d = (await api.get(`/admin/products/${id}`)).data; setP(d); return d; } });
  if (!p) return <PageLoader />;
  const set = (k: string, v: any) => setP({ ...p, [k]: v });
  const num = (v: string) => (v === "" ? null : Number(v));
  const save = async () => {
    setBusy(true);
    try {
      const body = { ...p, publish_at: p.publish_at || null };
      if (isNew) await api.post("/admin/products", body); else await api.put(`/admin/products/${id}`, body);
      toast.success("Product saved");
      nav("/admin/products");
    } catch (x) { toast.error(errorMessage(x)); } finally { setBusy(false); }
  };
  const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
  const MAX_BYTES = 8 * 1024 * 1024;
  const upload = async (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) {
      if (!ACCEPTED_TYPES.includes(f.type)) { toast.error(`${f.name}: only JPEG, PNG, WebP or AVIF images are allowed`); continue; }
      if (f.size > MAX_BYTES) { toast.error(`${f.name}: must be 8 MB or smaller`); continue; }
      const id = `${f.name}-${Date.now()}-${Math.random()}`;
      setUploads((u) => [...u, { id, name: f.name, progress: 0 }]);
      const fd = new FormData(); fd.append("file", f);
      try {
        const { data } = await api.post("/admin/uploads", fd, {
          onUploadProgress: (e) => setUploads((u) => u.map((x) => x.id === id ? { ...x, progress: e.total ? Math.round((e.loaded / e.total) * 100) : x.progress } : x)),
        });
        setP((prev: any) => ({ ...prev, images: [...prev.images, { url: data.url, public_id: data.public_id, alt: prev.name }] }));
        toast.success(`${f.name} uploaded`);
      } catch (x) { toast.error(`${f.name}: ${errorMessage(x)}`); } finally { setUploads((u) => u.filter((x) => x.id !== id)); }
    }
  };
  const move = (i: number, d: number) => { const im = [...p.images]; [im[i], im[i + d]] = [im[i + d], im[i]]; set("images", im); };
  const L = ({ children }: any) => <label className="label-rd">{children}</label>;
  return (
    <AdminPage title={isNew ? "New product" : p.name} sub={!isNew ? `Created ${fmtDate(p.created_at, true)} · Updated ${fmtDate(p.updated_at, true)}${p.source?.wp_id ? ` · WordPress ID ${p.source.wp_id}` : ""}` : undefined} testId="product-editor"
      actions={<><Link to="/admin/products" className={btnOutline}><ArrowLeft className="h-4 w-4" />Back</Link>{!isNew && <a href={`/product/${p.slug}`} target="_blank" rel="noreferrer" className={btnOutline}>Preview</a>}<button onClick={save} disabled={busy} className={btn} data-testid="product-save-btn">{busy ? "Saving…" : "Save product"}</button></>}>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Details"><div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><L>Name</L><input value={p.name} onChange={(e) => set("name", e.target.value)} className="input-rd" data-testid="pe-name" /></div>
            <div><L>Slug (URL)</L><input value={p.slug || ""} onChange={(e) => set("slug", e.target.value)} className="input-rd" data-testid="pe-slug" /></div>
            <div><L>SKU</L><input value={p.sku || ""} onChange={(e) => set("sku", e.target.value)} className="input-rd" data-testid="pe-sku" /></div>
            <div className="sm:col-span-2"><L>Short description</L><textarea value={p.short_description} onChange={(e) => set("short_description", e.target.value)} rows={3} className="input-rd h-auto py-2" data-testid="pe-short" /></div>
            <div className="sm:col-span-2"><L>Full description</L><textarea value={p.description} onChange={(e) => set("description", e.target.value)} rows={8} className="input-rd h-auto py-2" data-testid="pe-desc" /></div>
            <div><L>Materials</L><input value={p.materials || ""} onChange={(e) => set("materials", e.target.value)} className="input-rd" /></div>
            <div><L>Dimensions</L><input value={p.dimensions || ""} onChange={(e) => set("dimensions", e.target.value)} className="input-rd" /></div>
          </div></Card>
          <Card title="Images" actions={<label className={`${btnOutline} cursor-pointer ${uploads.length ? "pointer-events-none opacity-60" : ""}`} data-testid="pe-upload-btn">{uploads.length ? <Spinner className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}{uploads.length ? `Uploading ${uploads.length}…` : "Upload"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="hidden" onChange={(e) => { upload(e.target.files); e.target.value = ""; }} disabled={uploads.length > 0} data-testid="pe-upload-input" /></label>}>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {p.images.map((im: any, i: number) => (
                <div key={i} className="group relative" data-testid={`pe-image-${i}`}><img src={cldImg(im.url, 240)} alt="" className="aspect-square w-full object-cover" />{i === 0 && <span className="absolute left-1 top-1 bg-[#4E3629] px-1.5 text-[10px] text-white">Main</span>}
                  <div className="mt-1 flex justify-between"><button disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move left"><ArrowUp className="h-3.5 w-3.5 -rotate-90" /></button><button disabled={i === p.images.length - 1} onClick={() => move(i, 1)} aria-label="Move right"><ArrowDown className="h-3.5 w-3.5 -rotate-90" /></button><button onClick={() => set("images", p.images.filter((_: any, k: number) => k !== i))} aria-label="Remove image" data-testid={`pe-remove-image-${i}`}><Trash2 className="h-3.5 w-3.5 text-red-800" /></button></div></div>
              ))}
              {uploads.map((u) => (
                <div key={u.id} className="relative flex aspect-square w-full flex-col items-center justify-center gap-1.5 border border-dashed border-[#E6DDD0] bg-[#FAF7F2]" data-testid="pe-image-uploading">
                  <Spinner className="h-5 w-5" />
                  <span className="text-[10px] text-[#7A6960]">{u.progress}%</span>
                </div>
              ))}
            </div>
            <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); const u = String(new FormData(e.currentTarget).get("u") || ""); if (u) set("images", [...p.images, { url: u, alt: p.name }]); e.currentTarget.reset(); }}><input name="u" placeholder="…or add image by URL" className={inp} /><button className={btnOutline}>Add</button></form>
          </Card>
          <Card title="Specifications" actions={<button className={btnOutline} onClick={() => set("specs", [...p.specs, { label: "", value: "" }])}>Add row</button>}>
            <div className="space-y-2">{p.specs.map((s: any, i: number) => (
              <div key={i} className="flex gap-2"><input value={s.label} onChange={(e) => set("specs", p.specs.map((x: any, k: number) => k === i ? { ...x, label: e.target.value } : x))} placeholder="Label" className={`${inp} w-1/3`} /><input value={s.value} onChange={(e) => set("specs", p.specs.map((x: any, k: number) => k === i ? { ...x, value: e.target.value } : x))} placeholder="Value" className={inp} /><button onClick={() => set("specs", p.specs.filter((_: any, k: number) => k !== i))} aria-label="Remove"><Trash2 className="h-4 w-4 text-red-800" /></button></div>
            ))}</div>
          </Card>
          <Card title="Variants" actions={<button className={btnOutline} onClick={() => set("variants", [...p.variants, { sku: "", attributes: Object.fromEntries(p.attributes.map((a: any) => [a.name, a.values[0] || ""])), price: p.price, sale_price: null, stock_quantity: null, stock_status: "in_stock" }])} data-testid="pe-add-variant">Add variant</button>}>
            <p className="mb-3 text-xs text-[#7A6960]">Attributes (one per line, “Name: value1, value2”)</p>
            <textarea rows={2} className="input-rd h-auto py-2 text-xs" defaultValue={p.attributes.map((a: any) => `${a.name}: ${a.values.join(", ")}`).join("\n")}
              onBlur={(e) => set("attributes", e.target.value.split("\n").filter((l) => l.includes(":")).map((l) => { const [n, v] = l.split(":"); return { name: n.trim(), values: v.split(",").map((x) => x.trim()).filter(Boolean) }; }))} data-testid="pe-attributes" />
            <div className="mt-4 space-y-3">{p.variants.map((v: any, i: number) => {
              const upd = (k: string, val: any) => set("variants", p.variants.map((x: any, j: number) => j === i ? { ...x, [k]: val } : x));
              return (
                <div key={v.id || i} className="grid items-end gap-2 border border-[#EFE7DA] p-3 sm:grid-cols-6" data-testid={`pe-variant-${i}`}>
                  {p.attributes.map((a: any) => <div key={a.name}><L>{a.name}</L><select value={v.attributes[a.name] || ""} onChange={(e) => upd("attributes", { ...v.attributes, [a.name]: e.target.value })} className={inp}>{a.values.map((x: string) => <option key={x}>{x}</option>)}</select></div>)}
                  <div><L>Price</L><input type="number" value={v.price || ""} onChange={(e) => upd("price", e.target.value === "" ? 0 : Number(e.target.value))} className={inp} /></div>
                  <div><L>Sale</L><input type="number" value={v.sale_price ?? ""} onChange={(e) => upd("sale_price", num(e.target.value))} className={inp} /></div>
                  <div><L>Stock</L><input type="number" value={v.stock_quantity ?? ""} onChange={(e) => upd("stock_quantity", num(e.target.value))} className={inp} disabled={!p.manage_stock} /></div>
                  <button onClick={() => set("variants", p.variants.filter((_: any, j: number) => j !== i))} className="h-9 text-xs text-red-800 underline">Remove</button>
                </div>
              );
            })}</div>
          </Card>
          <Card title="SEO"><div className="space-y-3"><div><L>Meta title</L><input value={p.seo?.title || ""} onChange={(e) => set("seo", { ...p.seo, title: e.target.value })} className="input-rd" /></div><div><L>Meta description</L><textarea value={p.seo?.description || ""} onChange={(e) => set("seo", { ...p.seo, description: e.target.value })} rows={2} className="input-rd h-auto py-2" /></div></div></Card>
        </div>
        <div className="space-y-6">
          <Card title="Visibility"><div className="space-y-4">
            <div><L>Status</L><select value={p.status} onChange={(e) => set("status", e.target.value)} className="input-rd" data-testid="pe-status"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div>
            <div><L>Schedule publish (optional)</L><input type="datetime-local" value={p.publish_at ? String(p.publish_at).slice(0, 16) : ""} onChange={(e) => set("publish_at", e.target.value ? new Date(e.target.value).toISOString() : null)} className="input-rd" /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.featured} onChange={(e) => set("featured", e.target.checked)} className="accent-[#4E3629]" data-testid="pe-featured" />Featured on homepage</label>
          </div></Card>
          <Card title="Pricing (৳)"><div className="grid grid-cols-2 gap-3">
            <div><L>Regular price</L><input type="number" value={p.price || ""} onChange={(e) => set("price", e.target.value === "" ? 0 : Number(e.target.value))} className="input-rd" data-testid="pe-price" /></div>
            <div><L>Sale price</L><input type="number" value={p.sale_price ?? ""} onChange={(e) => set("sale_price", num(e.target.value))} className="input-rd" data-testid="pe-sale-price" /></div>
            <div className="col-span-2"><L>Delivery charge</L><input type="number" value={p.shipping_charge || ""} onChange={(e) => set("shipping_charge", e.target.value === "" ? 0 : Number(e.target.value))} className="input-rd" data-testid="pe-shipping" /></div>
          </div></Card>
          <Card title="Inventory"><div className="space-y-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.manage_stock} onChange={(e) => set("manage_stock", e.target.checked)} className="accent-[#4E3629]" data-testid="pe-manage-stock" />Track stock quantity</label>
            {p.manage_stock ? (!p.variants.length && <div className="grid grid-cols-2 gap-3"><div><L>Quantity</L><input type="number" min={0} value={p.stock_quantity ?? ""} onChange={(e) => set("stock_quantity", num(e.target.value))} className="input-rd" data-testid="pe-stock" /></div><div><L>Low-stock at</L><input type="number" min={0} value={p.low_stock_threshold} onChange={(e) => set("low_stock_threshold", Number(e.target.value))} className="input-rd" /></div></div>)
              : <div><L>Availability</L><select value={p.stock_status} onChange={(e) => set("stock_status", e.target.value)} className="input-rd"><option value="in_stock">In stock</option><option value="out_of_stock">Out of stock</option></select></div>}
          </div></Card>
          <Card title="Categories"><div className="space-y-2">{(cats || []).map((c: any) => (
            <label key={c.id} className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-[#4E3629]" checked={p.category_ids.includes(c.id)} onChange={(e) => set("category_ids", e.target.checked ? [...p.category_ids, c.id] : p.category_ids.filter((x: string) => x !== c.id))} data-testid={`pe-cat-${c.slug}`} />{c.parent_id && "— "}{c.name}</label>
          ))}</div></Card>
        </div>
      </div>
    </AdminPage>
  );
}

export function AdminCategories() {
  const { data, refetch } = useQuery({ queryKey: ["admin-cats"], queryFn: async () => (await api.get("/admin/categories")).data.items });
  const [edit, setEdit] = useState<any>(null);
  const save = async () => {
    try { if (edit.id) await api.put(`/admin/categories/${edit.id}`, edit); else await api.post("/admin/categories", edit); toast.success("Category saved"); setEdit(null); refetch(); } catch (x) { toast.error(errorMessage(x)); }
  };
  const move = async (i: number, d: number) => { const ids = data.map((c: any) => c.id); [ids[i], ids[i + d]] = [ids[i + d], ids[i]]; await api.post("/admin/categories/reorder", { ids }); refetch(); };
  return (
    <AdminPage title="Categories" sub="Changes update the storefront navigation immediately." testId="admin-categories" actions={<button className={btn} onClick={() => setEdit({ name: "", description: "", featured: false, status: "active", sort_order: 0, parent_id: null, image: "" })} data-testid="new-category-btn"><Plus className="h-4 w-4" />New category</button>}>
      {edit && (
        <Card title={edit.id ? "Edit category" : "New category"} className="mb-6"><div className="grid gap-3 sm:grid-cols-3">
          <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="Name" className={inp} data-testid="cat-name" />
          <input value={edit.slug || ""} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} placeholder="Slug (auto)" className={inp} />
          <select value={edit.parent_id || ""} onChange={(e) => setEdit({ ...edit, parent_id: e.target.value || null })} className={inp}><option value="">No parent</option>{data?.filter((c: any) => c.id !== edit.id).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <input value={edit.image || ""} onChange={(e) => setEdit({ ...edit, image: e.target.value })} placeholder="Image URL" className={`${inp} sm:col-span-2`} />
          <select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })} className={inp}><option value="active">Active</option><option value="archived">Archived</option></select>
          <textarea value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} placeholder="Description" className="input-rd h-auto py-2 sm:col-span-3" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={edit.featured} onChange={(e) => setEdit({ ...edit, featured: e.target.checked })} />Feature on homepage</label>
          <div className="flex gap-2 sm:col-span-2 sm:justify-end"><button className={btnOutline} onClick={() => setEdit(null)}>Cancel</button><button className={btn} onClick={save} data-testid="cat-save-btn">Save</button></div>
        </div></Card>
      )}
      {!data ? <PageLoader /> : (
        <Table head={["Order", "Name", "Slug", "Parent", "Products", "Featured", "Status", ""]} testId="admin-categories-table">
          {data.map((c: any, i: number) => (
            <tr key={c.id}><Td><div className="flex gap-1"><button disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></button><button disabled={i === data.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></button></div></Td>
              <Td className="font-medium">{c.name}</Td><Td className="text-xs">{c.slug}</Td><Td>{data.find((x: any) => x.id === c.parent_id)?.name || "—"}</Td><Td>{c.product_count}</Td><Td>{c.featured ? "Yes" : "—"}</Td><Td><StatusBadge status={c.status} /></Td>
              <Td><button className="text-xs underline" onClick={() => setEdit(c)} data-testid={`edit-cat-${c.slug}`}>Edit</button></Td></tr>
          ))}
        </Table>
      )}
    </AdminPage>
  );
}

export function AdminInventory() {
  const [filter, setFilter] = useState("");
  const [adj, setAdj] = useState<any>(null);
  const { can } = useAuth();
  const { data, refetch } = useQuery({ queryKey: ["inventory", filter], queryFn: async () => (await api.get("/admin/inventory", { params: { filter: filter || undefined } })).data.items });
  const { data: mv, refetch: refMv } = useQuery({ queryKey: ["movements"], queryFn: async () => (await api.get("/admin/inventory/movements")).data.items });
  const submit = async () => {
    try { await api.post("/admin/inventory/adjust", { ...adj, delta: Number(adj.delta) }); toast.success("Stock adjusted"); setAdj(null); refetch(); refMv(); } catch (x) { toast.error(errorMessage(x)); }
  };
  const track = async (r: any, on: boolean) => { try { await api.post(`/admin/inventory/${r.product_id}/tracking`, { manage_stock: on, low_stock_threshold: r.threshold || 2 }); refetch(); } catch (x) { toast.error(errorMessage(x)); } };
  return (
    <AdminPage title="Inventory" sub="Atomic stock adjustments with a full movement history." testId="admin-inventory"
      actions={<select value={filter} onChange={(e) => setFilter(e.target.value)} className={`${inp} w-44`} data-testid="inventory-filter"><option value="">All items</option><option value="low">Low stock</option><option value="out">Out of stock</option><option value="ok">Healthy</option><option value="untracked_in">Not tracked</option></select>}>
      {adj && (
        <Card title={`Adjust stock — ${adj.label}`} className="mb-6"><div className="grid gap-3 sm:grid-cols-4">
          <input type="number" value={adj.delta} onChange={(e) => setAdj({ ...adj, delta: e.target.value })} placeholder="+5 or -2" className={inp} data-testid="adjust-delta" />
          <select value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })} className={inp} data-testid="adjust-reason">{["restock", "damaged", "correction", "returned_resalable", "lost", "other"].map((r) => <option key={r}>{r}</option>)}</select>
          <input value={adj.note} onChange={(e) => setAdj({ ...adj, note: e.target.value })} placeholder="Note" className={inp} />
          <div className="flex gap-2"><button className={btnOutline} onClick={() => setAdj(null)}>Cancel</button><button className={btn} onClick={submit} data-testid="adjust-submit-btn">Apply</button></div>
        </div></Card>
      )}
      {!data ? <PageLoader /> : (
        <Table head={["Item", "SKU", "Tracking", "On hand", "Low at", "State", ""]} testId="inventory-table">
          {data.map((r: any) => (
            <tr key={r.product_id + (r.variant_id || "")}><Td><span className="font-medium">{r.name}</span>{r.variant && <span className="ml-2 text-xs text-[#7A6960]">{r.variant}</span>}</Td><Td className="text-xs">{r.sku || "—"}</Td>
              <Td>{can("inventory.write") && !r.variant_id || can("inventory.write") ? <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={r.manage_stock} onChange={(e) => track(r, e.target.checked)} data-testid={`track-toggle-${r.product_id}-${r.variant_id || "base"}`} />{r.manage_stock ? "Tracked" : "Off"}</label> : null}</Td>
              <Td>{r.manage_stock ? r.stock_quantity : "—"}</Td><Td>{r.threshold}</Td>
              <Td><span className={`text-xs ${r.state === "out" ? "text-red-800" : r.state === "low" ? "text-amber-700" : "text-[#7A6960]"}`}>{({ out: "Out of stock", low: "Low", ok: "OK", untracked_in: "In stock (untracked)" } as any)[r.state]}</span></Td>
              <Td>{r.manage_stock && can("inventory.write") && <button className="text-xs underline" onClick={() => setAdj({ product_id: r.product_id, variant_id: r.variant_id, label: `${r.name}${r.variant ? ` (${r.variant})` : ""}`, delta: "", reason: "restock", note: "" })} data-testid={`adjust-btn-${r.product_id}-${r.variant_id || "base"}`}>Adjust</button>}</Td></tr>
          ))}
        </Table>
      )}
      <h2 className="mb-3 mt-10 font-serif text-xl">Stock movements</h2>
      <Table head={["When", "Product", "Change", "Result", "Reason", "Reference", "By"]} testId="movements-table">
        {(mv || []).map((m: any) => <tr key={m.id}><Td className="text-xs">{fmtDate(m.created_at, true)}</Td><Td>{m.product_name}</Td><Td className={m.delta < 0 ? "text-red-800" : "text-emerald-800"}>{m.delta > 0 ? `+${m.delta}` : m.delta}</Td><Td>{m.resulting_quantity ?? "—"}</Td><Td>{m.reason}</Td><Td className="font-mono text-xs">{m.reference || "—"}</Td><Td className="text-xs">{m.actor_email || "system"}</Td></tr>)}
      </Table>
    </AdminPage>
  );
}

export function AdminReviews() {
  const { data, refetch } = useQuery({ queryKey: ["admin-reviews"], queryFn: async () => (await api.get("/admin/reviews")).data.items });
  const set = async (id: string, status: string) => { await api.patch(`/admin/reviews/${id}`, { status }); refetch(); };
  return (
    <AdminPage title="Reviews" sub="Only verified buyers with a delivered order can submit reviews." testId="admin-reviews">
      {!data ? <PageLoader /> : data.length === 0 ? <p className="text-sm text-[#7A6960]">No reviews submitted yet.</p> : (
        <Table head={["Date", "Rating", "Review", "Author", "Status", ""]} testId="reviews-table">
          {data.map((r: any) => <tr key={r.id}><Td className="text-xs">{fmtDate(r.created_at)}</Td><Td>{r.rating}★</Td><Td><p className="font-medium">{r.title}</p><p className="text-xs text-[#594940]">{r.body}</p></Td><Td>{r.author}</Td><Td><StatusBadge status={r.status} /></Td>
            <Td><div className="flex gap-2 text-xs"><button className="underline" onClick={() => set(r.id, "approved")}>Approve</button><button className="text-red-800 underline" onClick={() => set(r.id, "rejected")}>Reject</button></div></Td></tr>)}
        </Table>
      )}
    </AdminPage>
  );
}
