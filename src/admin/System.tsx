import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, errorMessage } from "@/lib/api";
import { money, fmtDate } from "@/lib/format";
import { PageLoader, StatusBadge } from "@/components/common";
import { AdminPage, Table, Td, Card, Stat, DateRange, rangeParams, defaultRange, btn, btnOutline, inp, useConfirm } from "./ui";

const L = ({ children }: any) => <label className="label-rd">{children}</label>;

export function AdminMarketing() {
  const { data: coupons, refetch } = useQuery({ queryKey: ["coupons"], queryFn: async () => (await api.get("/admin/coupons")).data.items });
  const { data: banners, refetch: refB } = useQuery({ queryKey: ["banners"], queryFn: async () => (await api.get("/admin/banners")).data.items });
  const { data: subs } = useQuery({ queryKey: ["subs"], queryFn: async () => (await api.get("/admin/newsletter")).data.items });
  const [c, setC] = useState<any>(null);
  const [b, setB] = useState<any>(null);
  const { confirm, dialog } = useConfirm();
  const saveC = async () => {
    const body = { ...c, value: Number(c.value), min_order: Number(c.min_order || 0), usage_limit: c.usage_limit ? Number(c.usage_limit) : null, per_customer_limit: c.per_customer_limit ? Number(c.per_customer_limit) : null, max_discount: c.max_discount ? Number(c.max_discount) : null, starts_at: c.starts_at || null, expires_at: c.expires_at || null };
    try { if (c._edit) await api.put(`/admin/coupons/${c.code}`, body); else await api.post("/admin/coupons", body); toast.success("Coupon saved"); setC(null); refetch(); } catch (x) { toast.error(errorMessage(x)); }
  };
  const saveB = async () => { try { if (b.id) await api.put(`/admin/banners/${b.id}`, b); else await api.post("/admin/banners", b); toast.success("Banner saved"); setB(null); refB(); } catch (x) { toast.error(errorMessage(x)); } };
  return (
    <AdminPage title="Marketing" sub="Coupons are validated and applied by the server at checkout." testId="admin-marketing">
      <Tabs defaultValue="coupons">
        <TabsList className="mb-6 rounded-none"><TabsTrigger value="coupons" data-testid="tab-coupons">Coupons</TabsTrigger><TabsTrigger value="banners" data-testid="tab-banners">Banners</TabsTrigger><TabsTrigger value="newsletter" data-testid="tab-newsletter">Newsletter</TabsTrigger></TabsList>
        <TabsContent value="coupons">
          <button className={`${btn} mb-4`} onClick={() => setC({ code: "", type: "percent", value: 10, min_order: 0, active: true })} data-testid="new-coupon-btn"><Plus className="h-4 w-4" />New coupon</button>
          {c && <Card className="mb-6"><div className="grid gap-3 sm:grid-cols-4">
            <div><L>Code</L><input value={c.code} disabled={c._edit} onChange={(e) => setC({ ...c, code: e.target.value.toUpperCase() })} className={inp} data-testid="coupon-code" /></div>
            <div><L>Type</L><select value={c.type} onChange={(e) => setC({ ...c, type: e.target.value })} className={inp} data-testid="coupon-type"><option value="percent">Percentage</option><option value="fixed">Fixed amount</option></select></div>
            <div><L>Value</L><input type="number" value={c.value} onChange={(e) => setC({ ...c, value: e.target.value })} className={inp} data-testid="coupon-value" /></div>
            <div><L>Min order ৳</L><input type="number" value={c.min_order} onChange={(e) => setC({ ...c, min_order: e.target.value })} className={inp} data-testid="coupon-min" /></div>
            <div><L>Max discount ৳</L><input type="number" value={c.max_discount ?? ""} onChange={(e) => setC({ ...c, max_discount: e.target.value })} className={inp} /></div>
            <div><L>Usage limit</L><input type="number" value={c.usage_limit ?? ""} onChange={(e) => setC({ ...c, usage_limit: e.target.value })} className={inp} data-testid="coupon-limit" /></div>
            <div><L>Per customer</L><input type="number" value={c.per_customer_limit ?? ""} onChange={(e) => setC({ ...c, per_customer_limit: e.target.value })} className={inp} /></div>
            <label className="flex items-center gap-2 self-end text-sm"><input type="checkbox" checked={c.active} onChange={(e) => setC({ ...c, active: e.target.checked })} />Active</label>
            <div><L>Starts</L><input type="datetime-local" value={c.starts_at?.slice(0, 16) || ""} onChange={(e) => setC({ ...c, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })} className={inp} /></div>
            <div><L>Expires</L><input type="datetime-local" value={c.expires_at?.slice(0, 16) || ""} onChange={(e) => setC({ ...c, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })} className={inp} /></div>
            <div className="flex items-end gap-2 sm:col-span-2 sm:justify-end"><button className={btnOutline} onClick={() => setC(null)}>Cancel</button><button className={btn} onClick={saveC} data-testid="coupon-save-btn">Save coupon</button></div>
          </div></Card>}
          <Table head={["Code", "Discount", "Min order", "Used", "Valid", "Status", ""]} testId="coupons-table">
            {(coupons || []).map((x: any) => <tr key={x.code}><Td className="font-mono">{x.code}</Td><Td>{x.type === "percent" ? `${x.value}%` : money(x.value)}</Td><Td>{money(x.min_order)}</Td><Td>{x.used_count}{x.usage_limit ? ` / ${x.usage_limit}` : ""}</Td><Td className="text-xs">{x.starts_at ? fmtDate(x.starts_at) : "—"} → {x.expires_at ? fmtDate(x.expires_at) : "no expiry"}</Td><Td><StatusBadge status={x.active ? "active" : "draft"} /></Td>
              <Td><div className="flex gap-3 text-xs"><button className="underline" onClick={() => setC({ ...x, _edit: true })}>Edit</button><button className="text-red-800 underline" onClick={async () => { if (await confirm(`Delete ${x.code}?`, "Used coupons are deactivated instead.")) { await api.delete(`/admin/coupons/${x.code}`); refetch(); } }}>Delete</button></div></Td></tr>)}
          </Table>
        </TabsContent>
        <TabsContent value="banners">
          <button className={`${btn} mb-4`} onClick={() => setB({ title: "", subtitle: "", image: "", link: "/shop", cta: "Shop now", placement: "promo", active: true, sort_order: 0 })} data-testid="new-banner-btn"><Plus className="h-4 w-4" />New banner</button>
          {b && <Card className="mb-6"><div className="grid gap-3 sm:grid-cols-3">
            <input value={b.title} onChange={(e) => setB({ ...b, title: e.target.value })} placeholder="Title" className={inp} data-testid="banner-title" />
            <input value={b.subtitle} onChange={(e) => setB({ ...b, subtitle: e.target.value })} placeholder="Subtitle" className={inp} />
            <input value={b.image} onChange={(e) => setB({ ...b, image: e.target.value })} placeholder="Image URL (use a real product photo)" className={inp} data-testid="banner-image" />
            <input value={b.link} onChange={(e) => setB({ ...b, link: e.target.value })} placeholder="Link" className={inp} />
            <input value={b.cta} onChange={(e) => setB({ ...b, cta: e.target.value })} placeholder="Button label" className={inp} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={b.active} onChange={(e) => setB({ ...b, active: e.target.checked })} />Active</label>
            <div className="flex gap-2 sm:col-span-3 sm:justify-end"><button className={btnOutline} onClick={() => setB(null)}>Cancel</button><button className={btn} onClick={saveB} data-testid="banner-save-btn">Save banner</button></div>
          </div></Card>}
          <Table head={["Title", "Link", "Status", ""]} testId="banners-table">{(banners || []).map((x: any) => <tr key={x.id}><Td>{x.title}</Td><Td className="text-xs">{x.link}</Td><Td><StatusBadge status={x.active ? "active" : "draft"} /></Td><Td><div className="flex gap-3 text-xs"><button className="underline" onClick={() => setB(x)}>Edit</button><button className="text-red-800 underline" onClick={async () => { await api.delete(`/admin/banners/${x.id}`); refB(); }}>Delete</button></div></Td></tr>)}</Table>
        </TabsContent>
        <TabsContent value="newsletter"><Table head={["Email", "Subscribed"]} testId="newsletter-table">{(subs || []).map((s: any) => <tr key={s.email}><Td>{s.email}</Td><Td>{fmtDate(s.created_at)}</Td></tr>)}</Table></TabsContent>
      </Tabs>
      {dialog}
    </AdminPage>
  );
}

const JsonBlock = ({ label, value, onChange }: { label: string; value: any; onChange: (v: any) => void }) => {
  const [txt, setTxt] = useState(JSON.stringify(value ?? {}, null, 2));
  const [err, setErr] = useState("");
  return <div><L>{label}</L><textarea rows={8} value={txt} onChange={(e) => { setTxt(e.target.value); try { onChange(JSON.parse(e.target.value)); setErr(""); } catch { setErr("Invalid JSON"); } }} className="input-rd h-auto py-2 font-mono text-xs" />{err && <p className="text-xs text-red-700">{err}</p>}</div>;
};

export function AdminContent() {
  const { data: s } = useQuery({ queryKey: ["admin-settings"], queryFn: async () => (await api.get("/admin/settings")).data });
  const { data: pages, refetch } = useQuery({ queryKey: ["admin-pages"], queryFn: async () => (await api.get("/admin/pages")).data.items });
  const [draft, setDraft] = useState<any>(null);
  const [pg, setPg] = useState<any>(null);
  useEffect(() => { if (s) setDraft(s); }, [s]);
  if (!draft) return <PageLoader />;
  const up = (k: string, f: string, v: any) => setDraft({ ...draft, [k]: { ...draft[k], [f]: v } });
  const save = async (keys: string[]) => { try { await api.put("/admin/settings", Object.fromEntries(keys.map((k) => [k, draft[k]]))); toast.success("Saved — storefront updated"); } catch (x) { toast.error(errorMessage(x)); } };
  const savePage = async () => { try { await api.put(`/admin/pages/${pg.slug}`, pg); toast.success("Page saved"); setPg(null); refetch(); } catch (x) { toast.error(errorMessage(x)); } };
  return (
    <AdminPage title="Content" sub="Edit storefront copy, contact details, policies and checkout settings." testId="admin-content">
      <Tabs defaultValue="home">
        <TabsList className="mb-6 rounded-none"><TabsTrigger value="home">Homepage</TabsTrigger><TabsTrigger value="contact">Contact & footer</TabsTrigger><TabsTrigger value="pages" data-testid="tab-pages">Pages</TabsTrigger><TabsTrigger value="checkout" data-testid="tab-checkout">Checkout & payments</TabsTrigger></TabsList>
        <TabsContent value="home"><Card><div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={draft.announcement?.enabled} onChange={(e) => up("announcement", "enabled", e.target.checked)} />Show announcement bar</label>
          <div className="sm:col-span-2"><L>Announcement text</L><input value={draft.announcement?.text || ""} onChange={(e) => up("announcement", "text", e.target.value)} className="input-rd" data-testid="content-announcement" /></div>
          <div><L>Hero eyebrow</L><input value={draft.hero?.eyebrow || ""} onChange={(e) => up("hero", "eyebrow", e.target.value)} className="input-rd" /></div>
          <div><L>Hero title</L><input value={draft.hero?.title || ""} onChange={(e) => up("hero", "title", e.target.value)} className="input-rd" data-testid="content-hero-title" /></div>
          <div className="sm:col-span-2"><L>Hero subtitle</L><textarea value={draft.hero?.subtitle || ""} onChange={(e) => up("hero", "subtitle", e.target.value)} rows={3} className="input-rd h-auto py-2" /></div>
          <div><L>CTA label</L><input value={draft.hero?.cta_label || ""} onChange={(e) => up("hero", "cta_label", e.target.value)} className="input-rd" /></div>
          <div><L>Hero image URL (blank = featured product photo)</L><input value={draft.hero?.image || ""} onChange={(e) => up("hero", "image", e.target.value || null)} className="input-rd" /></div>
          <div className="sm:col-span-2"><JsonBlock label="Philosophy pillars" value={draft.philosophy} onChange={(v) => setDraft({ ...draft, philosophy: v })} /></div>
          <div className="sm:col-span-2"><JsonBlock label="Homepage sections copy" value={draft.home} onChange={(v) => setDraft({ ...draft, home: v })} /></div>
          <div className="sm:col-span-2"><JsonBlock label="SEO defaults" value={draft.seo} onChange={(v) => setDraft({ ...draft, seo: v })} /></div>
          <button className={btn} onClick={() => save(["announcement", "hero", "philosophy", "home", "seo"])} data-testid="content-home-save">Save homepage</button>
        </div></Card></TabsContent>
        <TabsContent value="contact"><Card><div className="grid gap-4 sm:grid-cols-2">
          {["address", "phone", "phone_display", "email", "hours", "whatsapp"].map((k) => <div key={k}><L>{k.replace("_", " ")}</L><input value={draft.contact?.[k] || ""} onChange={(e) => up("contact", k, e.target.value)} className="input-rd" data-testid={`content-contact-${k}`} /></div>)}
          <div className="sm:col-span-2"><L>Footer about</L><textarea value={draft.footer?.about || ""} onChange={(e) => up("footer", "about", e.target.value)} rows={3} className="input-rd h-auto py-2" /></div>
          <button className={btn} onClick={() => save(["contact", "footer"])} data-testid="content-contact-save">Save</button>
        </div></Card></TabsContent>
        <TabsContent value="pages">
          {pg ? <Card title={`Edit /${pg.slug}`}><div className="space-y-3">
            <input value={pg.slug} disabled={!pg._new} onChange={(e) => setPg({ ...pg, slug: e.target.value })} placeholder="slug" className={inp} />
            <input value={pg.title} onChange={(e) => setPg({ ...pg, title: e.target.value })} placeholder="Title" className={inp} data-testid="page-title" />
            <textarea value={pg.body} onChange={(e) => setPg({ ...pg, body: e.target.value })} rows={16} className="input-rd h-auto py-2 font-mono text-xs" data-testid="page-body" />
            <select value={pg.status} onChange={(e) => setPg({ ...pg, status: e.target.value })} className={`${inp} w-40`}><option value="published">Published</option><option value="draft">Draft</option></select>
            <div className="flex gap-2"><button className={btnOutline} onClick={() => setPg(null)}>Cancel</button><button className={btn} onClick={savePage} data-testid="page-save-btn">Save page</button></div>
          </div></Card> : <>
            <button className={`${btn} mb-4`} onClick={() => setPg({ slug: "", title: "", body: "", status: "published", seo: {}, _new: true })}><Plus className="h-4 w-4" />New page</button>
            <Table head={["Page", "URL", "Status", "Updated", ""]} testId="pages-table">{(pages || []).map((p: any) => <tr key={p.slug}><Td>{p.title}</Td><Td className="text-xs">/{p.slug}</Td><Td><StatusBadge status={p.status} /></Td><Td className="text-xs">{fmtDate(p.updated_at)}{!p.body && <span className="ml-2 text-amber-700">empty</span>}</Td><Td><button className="text-xs underline" onClick={() => setPg(p)} data-testid={`edit-page-${p.slug}`}>Edit</button></Td></tr>)}</Table>
          </>}
        </TabsContent>
        <TabsContent value="checkout"><Card><div className="grid gap-4 sm:grid-cols-2">
          {["cod", "bank_transfer"].map((k) => <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!draft.payments?.enabled?.[k]} onChange={(e) => up("payments", "enabled", { ...draft.payments.enabled, [k]: e.target.checked })} data-testid={`pay-enable-${k}`} />Enable {k === "cod" ? "Cash on delivery" : "Direct bank transfer"}</label>)}
          <p className="text-xs text-[#7A6960] sm:col-span-2">SSLCommerz: integration point ready — requires SSLCZ_STORE_ID / SSLCZ_STORE_PASSWORD on the server and testing before enabling.</p>
          <div className="sm:col-span-2"><L>Bank transfer instructions</L><textarea value={draft.payments?.bank_instructions || ""} onChange={(e) => up("payments", "bank_instructions", e.target.value)} rows={3} className="input-rd h-auto py-2" /></div>
          <div className="sm:col-span-2"><L>Bank account details (shown after order)</L><textarea value={draft.payments?.bank_details || ""} onChange={(e) => up("payments", "bank_details", e.target.value)} rows={3} className="input-rd h-auto py-2" placeholder="Bank, account name, account number, branch" data-testid="bank-details" /></div>
          <div><L>Delivery calculation (when weight-based delivery is off)</L><select value={draft.shipping?.mode || "sum"} onChange={(e) => up("shipping", "mode", e.target.value)} className="input-rd"><option value="sum">Sum of each product's charge</option><option value="highest">Highest product charge only</option></select></div>
          <div><L>Free delivery over ৳ (blank = never)</L><input type="number" value={draft.shipping?.free_over ?? ""} onChange={(e) => up("shipping", "free_over", e.target.value ? Number(e.target.value) : null)} className="input-rd" /></div>
          <div className="sm:col-span-2 border-t border-[#E6DDD0] pt-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!draft.shipping?.weight_rules?.enabled} onChange={(e) => up("shipping", "weight_rules", { ...draft.shipping?.weight_rules, enabled: e.target.checked })} data-testid="ship-weight-enabled" />
              Use weight-based delivery charge
            </label>
            <p className="mt-1 text-xs text-[#7A6960]">Each product's own "Delivery charge" (set on its edit page) stays the base price, combined using the Sum/Highest rule above. The settings below only add an extra charge for weight above the free allowance — so heavier or bulkier combined orders cost a bit more, without changing what each product already costs to ship on its own.</p>
          </div>
          <div><L>Free weight before extra charge (kg)</L><input type="number" min={0} step="0.01" value={draft.shipping?.weight_rules?.base_weight_kg ?? ""} onChange={(e) => up("shipping", "weight_rules", { ...draft.shipping?.weight_rules, base_weight_kg: e.target.value ? Number(e.target.value) : 0 })} className="input-rd" data-testid="ship-weight-base-kg" /></div>
          <div><L>Extra charge per kg over that ৳ (rounded up)</L><input type="number" min={0} value={draft.shipping?.weight_rules?.per_kg_charge ?? ""} onChange={(e) => up("shipping", "weight_rules", { ...draft.shipping?.weight_rules, per_kg_charge: e.target.value ? Number(e.target.value) : 0 })} className="input-rd" data-testid="ship-weight-per-kg" /></div>
          <p className="text-xs text-[#7A6960] sm:col-span-2">Each product's weight (kg) is set on its own edit page, under Pricing.</p>
          <button className={btn} onClick={() => save(["payments", "shipping"])} data-testid="content-checkout-save">Save checkout settings</button>
        </div></Card></TabsContent>
      </Tabs>
    </AdminPage>
  );
}

export function AdminAnalytics() {
  const [range, setRange] = useState(defaultRange());
  const { data: d } = useQuery({ queryKey: ["analytics", range], queryFn: async () => (await api.get("/admin/analytics", { params: rangeParams(range) })).data });
  const lowConv = (d?.products || []).filter((p: any) => p.views >= 5 && (p.conversion ?? 0) < 2);
  return (
    <AdminPage title="Analytics" sub="Views are de-duplicated per visitor per day. Sales use server-validated orders only." actions={<DateRange value={range} onChange={setRange} />} testId="admin-analytics">
      {!d ? <PageLoader /> : <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Stat label="Visitors viewing products" value={d.funnel.product_view} testId="funnel-views" />
          <Stat label="Visitors adding to cart" value={d.funnel.add_to_cart} testId="funnel-cart" />
          <Stat label="Checkout starts" value={d.checkout_starts} testId="funnel-checkout" />
          <Stat label="Orders" value={d.orders} testId="funnel-orders" />
          <Stat label="Checkout abandonment" value={d.abandonment_rate == null ? "—" : `${d.abandonment_rate}%`} testId="funnel-abandon" />
        </div>
        <Table head={["Product", "Views", "Add to cart", "Removed", "Orders", "Units sold", "Revenue", "Conversion"]} testId="analytics-products-table">
          {d.products.map((p: any) => <tr key={p.product_id}><Td className="font-medium">{p.name}</Td><Td>{p.views}</Td><Td>{p.add_to_cart}</Td><Td>{p.removed}</Td><Td>{p.orders}</Td><Td>{p.units}</Td><Td>{money(p.revenue)}</Td><Td>{p.conversion == null ? "—" : `${p.conversion}%`}</Td></tr>)}
        </Table>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Popular searches">{d.searches.length ? <ul className="text-sm">{d.searches.map((s: any) => <li key={s.query} className="flex justify-between border-b border-[#EFE7DA] py-1.5"><span>{s.query}</span><span className="text-[#7A6960]">{s.count}</span></li>)}</ul> : <p className="text-sm text-[#A89A90]">No searches recorded.</p>}</Card>
          <Card title="Strong views, low conversion">{lowConv.length ? <ul className="text-sm">{lowConv.map((p: any) => <li key={p.product_id} className="flex justify-between border-b border-[#EFE7DA] py-1.5"><span>{p.name}</span><span>{p.views} views · {p.conversion ?? 0}%</span></li>)}</ul> : <p className="text-sm text-[#A89A90]">No products with ≥5 views and &lt;2% conversion.</p>}</Card>
        </div>
      </div>}
    </AdminPage>
  );
}

export function AdminStaff() {
  const { data, refetch } = useQuery({ queryKey: ["staff"], queryFn: async () => (await api.get("/admin/users")).data });
  const [u, setU] = useState<any>(null);
  if (!data) return <PageLoader />;
  const save = async () => { try { if (u.id) await api.put(`/admin/users/${u.id}`, { ...u, password: u.password || null }); else await api.post("/admin/users", u); toast.success("Staff saved"); setU(null); refetch(); } catch (x) { toast.error(errorMessage(x)); } };
  const togglePerm = async (role: any, perm: string) => { const perms = role.permissions.includes(perm) ? role.permissions.filter((p: string) => p !== perm) : [...role.permissions, perm]; try { await api.put(`/admin/roles/${role.key}`, { permissions: perms }); refetch(); } catch (x) { toast.error(errorMessage(x)); } };
  return (
    <AdminPage title="Staff & roles" sub="Permissions are enforced on every API endpoint." testId="admin-staff" actions={<button className={btn} onClick={() => setU({ email: "", name: "", role: "support", password: "", active: true })} data-testid="new-staff-btn"><Plus className="h-4 w-4" />Add staff</button>}>
      {u && <Card className="mb-6"><div className="grid gap-3 sm:grid-cols-5">
        <input value={u.name} onChange={(e) => setU({ ...u, name: e.target.value })} placeholder="Name" className={inp} data-testid="staff-name" />
        <input value={u.email} disabled={!!u.id} onChange={(e) => setU({ ...u, email: e.target.value })} placeholder="Email" className={inp} data-testid="staff-email" />
        <select value={u.role} onChange={(e) => setU({ ...u, role: e.target.value })} className={inp} data-testid="staff-role">{data.roles.map((r: any) => <option key={r.key} value={r.key}>{r.name}</option>)}</select>
        <input type="password" value={u.password || ""} onChange={(e) => setU({ ...u, password: e.target.value })} placeholder={u.id ? "New password (optional)" : "Initial password (10+)"} className={inp} data-testid="staff-password" />
        <div className="flex items-center gap-2"><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={u.active} onChange={(e) => setU({ ...u, active: e.target.checked })} />Active</label><button className={btn} onClick={save} data-testid="staff-save-btn">Save</button></div>
      </div></Card>}
      <Table head={["Name", "Email", "Role", "Status", ""]} testId="staff-table">{data.items.map((x: any) => <tr key={x.id}><Td>{x.name}</Td><Td>{x.email}</Td><Td>{data.roles.find((r: any) => r.key === x.role)?.name}</Td><Td><StatusBadge status={x.active === false ? "cancelled" : "active"} /></Td><Td><button className="text-xs underline" onClick={() => setU({ ...x, password: "" })}>Edit</button></Td></tr>)}</Table>
      <h2 className="mb-3 mt-10 font-serif text-xl">Role permissions</h2>
      <div className="overflow-x-auto border border-[#E6DDD0] bg-white"><table className="w-full text-xs" data-testid="roles-matrix"><thead className="bg-[#FAF7F2]"><tr><th className="px-3 py-2 text-left">Permission</th>{data.roles.map((r: any) => <th key={r.key} className="px-3 py-2">{r.name}</th>)}</tr></thead>
        <tbody>{data.all_permissions.map((p: string) => <tr key={p} className="border-t border-[#EFE7DA]"><td className="px-3 py-1.5 font-mono">{p}</td>{data.roles.map((r: any) => <td key={r.key} className="text-center"><input type="checkbox" checked={r.permissions.includes(p)} disabled={r.key === "admin"} onChange={() => togglePerm(r, p)} aria-label={`${r.name} ${p}`} /></td>)}</tr>)}</tbody></table></div>
    </AdminPage>
  );
}

export function AdminAudit() {
  const [q, setQ] = useState("");
  const { data } = useQuery({ queryKey: ["audit", q], queryFn: async () => (await api.get("/admin/audit-logs", { params: { q: q || undefined } })).data });
  const { data: notes } = useQuery({ queryKey: ["notifications"], queryFn: async () => (await api.get("/admin/notifications")).data });
  return (
    <AdminPage title="Audit logs" sub="Every sensitive administrative action is recorded." testId="admin-audit">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search action, user, record id" className={`${inp} mb-4 w-72`} data-testid="audit-search" />
      <Table head={["When", "Actor", "Action", "Record", "Changes"]} testId="audit-table">{(data?.items || []).map((a: any) => <tr key={a.id}><Td className="whitespace-nowrap text-xs">{fmtDate(a.created_at, true)}</Td><Td className="text-xs">{a.actor_email}</Td><Td className="font-mono text-xs">{a.action}</Td><Td className="text-xs">{a.entity} · {String(a.entity_id).slice(0, 14)}</Td><Td className="max-w-md truncate font-mono text-[11px] text-[#7A6960]">{JSON.stringify(a.changes)}</Td></tr>)}</Table>
      <h2 className="mb-3 mt-10 font-serif text-xl">Notification log</h2>
      <p className="mb-3 text-xs text-amber-800">{notes && !notes.configured && "No email/SMS provider configured — notifications are recorded here but NOT delivered."}</p>
      <Table head={["When", "Type", "Subject", "Delivered"]} testId="notifications-table">{(notes?.items || []).map((n: any) => <tr key={n.id}><Td className="text-xs">{fmtDate(n.created_at, true)}</Td><Td className="text-xs">{n.kind}</Td><Td>{n.subject}</Td><Td>{n.delivered ? "Yes" : "No"}</Td></tr>)}</Table>
    </AdminPage>
  );
}

export function AdminMigration() {
  const { data, refetch } = useQuery({ queryKey: ["migration"], queryFn: async () => (await api.get("/admin/migration/report")).data, refetchInterval: 5000 });
  const run = async (mode: string) => { await api.post("/admin/migration/run", { mode }); toast.success("Migration started"); setTimeout(refetch, 3000); };
  return (
    <AdminPage title="WordPress migration" sub="Source: public WooCommerce Store API + WP REST API on rafdecor.shop. Re-runs never duplicate records." testId="admin-migration"
      actions={<><button className={btnOutline} onClick={() => run("insert_only")} data-testid="migration-run-insert">Import new only</button><button className={btn} onClick={() => run("update_existing")} data-testid="migration-run-update">Re-sync existing</button></>}>
      {!data?.id ? <p className="text-sm text-[#7A6960]">No migration has run yet.</p> : <div className="space-y-6" data-testid="migration-report">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Stat label="Status" value={data.status} hint={fmtDate(data.finished_at, true)} testId="mig-status" />
          <Stat label="Source products" value={data.products.source} hint={`${data.products.created} created · ${data.products.updated} updated · ${data.products.failed.length} failed`} testId="mig-products" />
          <Stat label="Categories" value={data.categories.source} testId="mig-categories" />
          <Stat label="Images" value={data.images.source_total - data.images.duplicates_in_source} hint={`${data.images.uploaded} to Cloudinary · ${data.images.reused} reused · ${data.images.referenced_original} original URL · ${data.images.failed.length} failed`} testId="mig-images" />
          <Stat label="In MongoDB" value={`${data.destination?.products} / ${data.destination?.categories} / ${data.destination?.pages}`} hint="products / categories / pages" testId="mig-dest" />
        </div>
        <Card title="Price reconciliation"><Table head={["Product", "Source price", "Imported", "Match", "Delivery charge"]} testId="mig-prices">{data.price_reconciliation.map((r: any) => <tr key={r.slug}><Td>{r.slug}</Td><Td>{money(r.source_price)}</Td><Td>{money(r.imported_price)}</Td><Td>{r.match ? "✓" : "✗"}</Td><Td>{r.shipping_charge == null ? "not found" : money(r.shipping_charge)}</Td></tr>)}</Table></Card>
        <Card title="URL mapping (WordPress → new)"><ul className="space-y-1 font-mono text-xs">{data.mappings.map((m: any) => <li key={m.wp_id}>#{m.wp_id} {m.old_url} → {m.new_path}</li>)}</ul></Card>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Missing fields"><ul className="text-xs">{data.missing_fields.map((m: any) => <li key={m.slug}>{m.slug}: {m.fields.join(", ")}</li>)}</ul></Card>
          <Card title="Pages"><p className="text-xs">Imported: {data.pages.imported.join(", ") || "none (already present)"}</p><ul className="mt-2 text-xs text-amber-800">{data.pages.flags.map((f: any, i: number) => <li key={i}>{f.slug}: {f.flag}</li>)}</ul></Card>
          <Card title="Customers & orders"><p className="text-xs">Customers: {data.customers.reason}</p><p className="mt-2 text-xs">Orders: {data.orders.reason}</p></Card>
          <Card title="Failures">{[...data.products.failed, ...data.images.failed].length ? <ul className="text-xs text-red-800">{[...data.products.failed, ...data.images.failed].map((f: any, i: number) => <li key={i}>{f.slug || f.url}: {f.error || f.reason}</li>)}</ul> : <p className="text-xs">None</p>}</Card>
        </div>
      </div>}
    </AdminPage>
  );
}
