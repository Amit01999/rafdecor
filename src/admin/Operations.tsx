import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Printer } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { api, API_BASE, errorMessage } from "@/lib/api";
import { money, fmtDate, STATUS_LABELS, cldImg } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { PageLoader, StatusBadge } from "@/components/common";
import { AdminPage, Table, Td, Pager, Card, btn, btnOutline, inp, useConfirm } from "./ui";

export function AdminOrders() {
  const [f, setF] = useState({ q: "", status: "", payment_status: "", payment_method: "", date_from: "", date_to: "" });
  const [page, setPage] = useState(1);
  const params = Object.fromEntries(Object.entries({ ...f, date_from: f.date_from && `${f.date_from}T00:00:00+06:00`, date_to: f.date_to && `${f.date_to}T23:59:59+06:00` }).filter(([, v]) => v));
  const { data } = useQuery({ queryKey: ["admin-orders", params, page], queryFn: async () => (await api.get("/admin/orders", { params: { ...params, page } })).data, refetchInterval: 30_000 });
  const set = (k: string, v: string) => { setF({ ...f, [k]: v }); setPage(1); };
  return (
    <AdminPage title="Orders" sub="Fulfilment status and payment status are tracked separately." testId="admin-orders"
      actions={<a href={`${API_BASE}/admin/orders/export.csv?${new URLSearchParams(params as any)}`} className={btnOutline} data-testid="orders-export-btn"><Download className="h-3.5 w-3.5" />Export CSV</a>}>
      <div className="mb-4 flex flex-wrap gap-2">
        <input value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="Order no, name, phone, product" className={`${inp} w-64`} data-testid="orders-search" />
        <select value={f.status} onChange={(e) => set("status", e.target.value)} className={`${inp} w-40`} data-testid="orders-status-filter"><option value="">All statuses</option>{["placed", "confirmed", "processing", "packaging", "dispatched", "out_for_delivery", "delivered", "cancelled", "returned", "refunded"].map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select>
        <select value={f.payment_status} onChange={(e) => set("payment_status", e.target.value)} className={`${inp} w-40`} data-testid="orders-payment-filter"><option value="">Any payment</option>{["unpaid", "awaiting_payment", "partially_paid", "paid", "partially_refunded", "refunded"].map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select>
        <select value={f.payment_method} onChange={(e) => set("payment_method", e.target.value)} className={`${inp} w-40`}><option value="">Any method</option><option value="cod">Cash on delivery</option><option value="bank_transfer">Bank transfer</option></select>
        <input type="date" value={f.date_from} onChange={(e) => set("date_from", e.target.value)} className={`${inp} w-36`} aria-label="From" /><input type="date" value={f.date_to} onChange={(e) => set("date_to", e.target.value)} className={`${inp} w-36`} aria-label="To" />
      </div>
      {!data ? <PageLoader /> : (<>
        <Table head={["Order", "Date", "Customer", "Items", "Total", "Payment", "Status"]} testId="admin-orders-table">
          {data.items.map((o: any) => (
            <tr key={o.id} className="hover:bg-[#FAF7F2]">
              <Td><Link to={`/admin/orders/${o.id}`} className="font-mono text-xs underline" data-testid={`admin-order-link-${o.order_number}`}>{o.order_number}</Link></Td>
              <Td className="whitespace-nowrap text-xs">{fmtDate(o.created_at, true)}</Td>
              <Td><p>{o.customer.name}</p><p className="text-xs text-[#7A6960]">{o.customer.phone} · {o.shipping_address.district}</p></Td>
              <Td className="text-xs">{o.items.map((i: any) => `${i.name} ×${i.quantity}`).join(", ")}</Td>
              <Td>{money(o.total)}</Td><Td><StatusBadge status={o.payment.status} /><p className="mt-1 text-[11px] text-[#7A6960]">{o.payment.method_label}</p></Td><Td><StatusBadge status={o.status} testId={`admin-order-status-${o.order_number}`} /></Td>
            </tr>
          ))}
        </Table>
        <Pager page={page} total={data.total} limit={20} onPage={setPage} />
      </>)}
    </AdminPage>
  );
}

export function AdminOrderDetail() {
  const { id } = useParams();
  const { can } = useAuth();
  const { confirm, dialog } = useConfirm();
  const { data: o, refetch } = useQuery({ queryKey: ["admin-order", id], queryFn: async () => (await api.get(`/admin/orders/${id}`)).data });
  const [st, setSt] = useState({ status: "", note: "", visible_to_customer: true, restock: false });
  const [pay, setPay] = useState({ amount: "", reference: "", note: "" });
  const [ref, setRef] = useState({ amount: "", reason: "", reference: "" });
  if (!o) return <PageLoader />;
  const run = async (fn: () => Promise<any>, msg: string) => { try { await fn(); toast.success(msg); refetch(); } catch (x) { toast.error(errorMessage(x)); } };
  const changeStatus = async () => {
    if (!st.status) return;
    if (st.status === "cancelled" && !(await confirm("Cancel this order?", st.restock ? "Items will be returned to stock." : "Stock will NOT be restored unless you tick “Return items to stock”."))) return;
    run(() => api.post(`/admin/orders/${o.id}/status`, st), "Status updated").then(() => setSt({ status: "", note: "", visible_to_customer: true, restock: false }));
  };
  const remaining = o.total - o.payment.amount_paid;
  return (
    <AdminPage title={`Order ${o.order_number}`} sub={`Placed ${fmtDate(o.created_at, true)}${o.account ? ` · Account ${o.account.email}` : " · Guest checkout"}`} testId="admin-order-detail"
      actions={<><button onClick={() => window.print()} className={btnOutline}><Printer className="h-3.5 w-3.5" />Print</button><Link to="/admin/orders" className={btnOutline}>Back</Link></>}>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Items">
            <ul className="divide-y divide-[#EFE7DA]">{o.items.map((i: any, k: number) => (
              <li key={k} className="flex items-center gap-4 py-3 text-sm"><img src={cldImg(i.image, 100)} alt="" className="h-12 w-10 object-cover" /><div className="flex-1"><p className="font-medium">{i.name}</p><p className="text-xs text-[#7A6960]">{i.variant_label || ""} {i.sku && `· SKU ${i.sku}`}</p></div><span>{money(i.unit_price)} × {i.quantity}</span><span className="w-24 text-right">{money(i.line_total)}</span></li>
            ))}</ul>
            <dl className="ml-auto mt-4 max-w-xs space-y-1 text-sm" data-testid="admin-order-totals">
              <div className="flex justify-between"><dt className="text-[#7A6960]">Subtotal</dt><dd>{money(o.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-[#7A6960]">Discount {o.coupon_code && `(${o.coupon_code})`}</dt><dd>−{money(o.discount)}</dd></div>
              <div className="flex justify-between"><dt className="text-[#7A6960]">Delivery</dt><dd>{money(o.shipping)}</dd></div>
              <div className="flex justify-between border-t pt-1 font-medium"><dt>Total</dt><dd>{money(o.total)}</dd></div>
            </dl>
          </Card>
          <div className="grid gap-6 md:grid-cols-2">
            <Card title="Customer & delivery"><div className="space-y-1 text-sm"><p className="font-medium">{o.customer.name}</p><p>{o.customer.phone}</p><p>{o.customer.email || "—"}</p><p className="pt-2 text-[#594940]">{o.shipping_address.address}{o.shipping_address.area && `, ${o.shipping_address.area}`}, {o.shipping_address.district}</p>{o.shipping_address.notes && <p className="pt-2 text-xs italic">“{o.shipping_address.notes}”</p>}</div></Card>
            <Card title="Payment"><div className="space-y-1 text-sm" data-testid="admin-order-payment">
              <div className="flex items-center justify-between"><span>{o.payment.method_label}</span><StatusBadge status={o.payment.status} /></div>
              <p>Due {money(o.total)} · Paid {money(o.payment.amount_paid)} · Refunded {money(o.payment.amount_refunded || 0)}</p>
              {o.payment.transaction_ref && <p className="text-xs">Ref {o.payment.transaction_ref}</p>}
              {o.transactions.map((t: any) => <p key={t.id} className="text-xs text-[#7A6960]">{fmtDate(t.created_at, true)} · {t.type} {money(t.amount)} {t.reference && `· ${t.reference}`} · {t.actor_email}</p>)}
            </div></Card>
          </div>
          <Card title="History & audit"><ul className="space-y-2 text-sm" data-testid="admin-order-history">
            {[...o.status_history].reverse().map((h: any, k: number) => <li key={k} className="flex gap-3"><StatusBadge status={h.status} /><span className="text-xs text-[#7A6960]">{fmtDate(h.at, true)} · {h.by}{h.note && ` — ${h.note}`}{!h.visible && " (internal)"}</span></li>)}
            {o.notes.map((n: any, k: number) => <li key={`n${k}`} className="text-xs"><span className="font-medium">{n.visible ? "Customer note" : "Internal note"}:</span> {n.text} <span className="text-[#7A6960]">— {n.by}, {fmtDate(n.at, true)}</span></li>)}
          </ul></Card>
        </div>
        <div className="space-y-6">
          {can("orders.write") && (
            <Card title="Update status"><div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">Current: <StatusBadge status={o.status} testId="admin-current-status" /></div>
              {o.allowed_transitions.length ? <>
                <select value={st.status} onChange={(e) => setSt({ ...st, status: e.target.value })} className={inp} data-testid="status-select"><option value="">Choose next status…</option>{o.allowed_transitions.map((s: string) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select>
                <textarea value={st.note} onChange={(e) => setSt({ ...st, note: e.target.value })} placeholder="Note (optional)" rows={2} className="input-rd h-auto py-2" data-testid="status-note" />
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={st.visible_to_customer} onChange={(e) => setSt({ ...st, visible_to_customer: e.target.checked })} />Show note to customer</label>
                {["cancelled", "returned"].includes(st.status) && !o.inventory_released && <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={st.restock} onChange={(e) => setSt({ ...st, restock: e.target.checked })} data-testid="status-restock" />Return items to stock (only if resalable)</label>}
                <button onClick={changeStatus} disabled={!st.status} className={`${btn} w-full justify-center`} data-testid="status-update-btn">Update status</button>
              </> : <p className="text-xs text-[#7A6960]">No further transitions available.</p>}
            </div></Card>
          )}
          {can("orders.finance") && (
            <Card title="Record payment"><div className="space-y-2">
              <p className="text-xs text-[#7A6960]">Remaining {money(remaining)}. Record cash collected on delivery or a verified bank transfer.</p>
              <input type="number" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} placeholder={String(remaining)} className={inp} data-testid="payment-amount" />
              <input value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} placeholder="Transaction / receipt ref" className={inp} data-testid="payment-ref" />
              <input value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} placeholder="Verification note" className={inp} />
              <button disabled={!pay.amount} onClick={() => run(() => api.post(`/admin/orders/${o.id}/payments`, { ...pay, amount: Number(pay.amount) }), "Payment recorded").then(() => setPay({ amount: "", reference: "", note: "" }))} className={`${btn} w-full justify-center`} data-testid="payment-record-btn">Record payment</button>
              {o.payment.amount_paid > 0 && <div className="mt-4 space-y-2 border-t pt-4">
                <p className="text-xs font-medium">Refund</p>
                <input type="number" value={ref.amount} onChange={(e) => setRef({ ...ref, amount: e.target.value })} placeholder="Amount" className={inp} data-testid="refund-amount" />
                <input value={ref.reason} onChange={(e) => setRef({ ...ref, reason: e.target.value })} placeholder="Reason" className={inp} data-testid="refund-reason" />
                <button disabled={!ref.amount || ref.reason.length < 3} onClick={() => run(() => api.post(`/admin/orders/${o.id}/refunds`, { ...ref, amount: Number(ref.amount) }), "Refund recorded").then(() => setRef({ amount: "", reason: "", reference: "" }))} className={`${btnOutline} w-full justify-center`} data-testid="refund-record-btn">Record refund</button>
              </div>}
            </div></Card>
          )}
          {can("orders.write") && <>
            <Card title="Courier"><form className="space-y-2" onSubmit={(e) => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.currentTarget)); run(() => api.post(`/admin/orders/${o.id}/courier`, f), "Courier saved"); }}>
              <input name="name" defaultValue={o.courier?.name} placeholder="Courier (e.g. Steadfast, Pathao)" required className={inp} data-testid="courier-name" /><input name="tracking_number" defaultValue={o.courier?.tracking_number} placeholder="Tracking number" className={inp} /><input name="tracking_url" defaultValue={o.courier?.tracking_url} placeholder="Tracking URL" className={inp} />
              <button className={`${btnOutline} w-full justify-center`} data-testid="courier-save-btn">Save courier</button></form></Card>
            <Card title="Add note"><form className="space-y-2" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const form = e.currentTarget; run(() => api.post(`/admin/orders/${o.id}/notes`, { text: fd.get("text"), visible: fd.get("visible") === "on" }), "Note added").then(() => form.reset()); }}>
              <textarea name="text" required rows={2} className="input-rd h-auto py-2" data-testid="order-note-text" /><label className="flex items-center gap-2 text-xs"><input type="checkbox" name="visible" />Visible to customer</label><button className={`${btnOutline} w-full justify-center`} data-testid="order-note-btn">Add note</button></form></Card>
          </>}
        </div>
      </div>
      {dialog}
    </AdminPage>
  );
}

export function AdminCustomers() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);
  const { can } = useAuth();
  const { confirm, dialog } = useConfirm();
  const { data, refetch } = useQuery({ queryKey: ["admin-customers", q, page], queryFn: async () => (await api.get("/admin/customers", { params: { q: q || undefined, page } })).data });
  const { data: c, refetch: refC } = useQuery({ queryKey: ["admin-customer", open], queryFn: async () => (await api.get(`/admin/customers/${open}`)).data, enabled: !!open });
  const toggle = async () => {
    if (!(await confirm(c.active === false ? "Reactivate this account?" : "Disable this account?", c.active === false ? undefined : "The customer will be signed out everywhere and unable to log in."))) return;
    try { await api.put(`/admin/customers/${c.id}`, { name: c.name, phone: c.phone || "", active: c.active === false }); toast.success("Account updated"); refC(); refetch(); } catch (x) { toast.error(errorMessage(x)); }
  };
  const reset = async () => { try { const { data: r } = await api.post(`/admin/customers/${c.id}/password-reset`); toast.success(r.message); } catch (x) { toast.error(errorMessage(x)); } };
  return (
    <AdminPage title="Customers" testId="admin-customers">
      <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search name, email, phone or ID" className={`${inp} mb-4 w-72`} data-testid="customers-search" />
      {!data ? <PageLoader /> : (<>
        <Table head={["Customer", "Phone", "Registered", "Orders", "Lifetime value", "Status"]} testId="customers-table">
          {data.items.map((u: any) => <tr key={u.id} className="cursor-pointer hover:bg-[#FAF7F2]" onClick={() => setOpen(u.id)} data-testid={`customer-row-${u.email}`}><Td><p className="font-medium">{u.name}</p><p className="text-xs text-[#7A6960]">{u.email}</p></Td><Td>{u.phone || "—"}</Td><Td className="text-xs">{fmtDate(u.created_at)}</Td><Td>{u.orders}</Td><Td>{money(u.lifetime_value)}</Td><Td><StatusBadge status={u.active === false ? "cancelled" : "active"} /></Td></tr>)}
        </Table>
        <Pager page={page} total={data.total} limit={20} onPage={setPage} />
      </>)}
      <Sheet open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg" data-testid="customer-sheet">
          <SheetTitle className="font-serif text-2xl font-normal">{c?.name}</SheetTitle>
          {c && <div className="mt-4 space-y-6 text-sm">
            <div><p>{c.email}</p><p>{c.phone}</p><p className="text-xs text-[#7A6960]">Customer ID {c.id} · since {fmtDate(c.created_at)}</p><p className="mt-2">Lifetime value <strong>{money(c.lifetime_value)}</strong></p></div>
            {can("customers.write") && <div className="flex gap-2"><button onClick={toggle} className={btnOutline} data-testid="customer-toggle-active">{c.active === false ? "Reactivate" : "Disable account"}</button><button onClick={reset} className={btnOutline} data-testid="customer-reset-pw">Send password reset</button></div>}
            <div><p className="label-rd">Orders</p>{c.orders.length ? c.orders.map((o: any) => <Link key={o.id} to={`/admin/orders/${o.id}`} className="flex justify-between border-b py-2"><span className="font-mono text-xs">{o.order_number}</span><StatusBadge status={o.status} /><span>{money(o.total)}</span></Link>) : <p className="text-[#7A6960]">No orders</p>}</div>
            <div><p className="label-rd">Addresses</p>{(c.addresses || []).map((a: any) => <p key={a.id} className="text-xs">{a.label}: {a.address}, {a.district}</p>)}</div>
            <div><p className="label-rd">Inquiries</p>{c.inquiries.length ? c.inquiries.map((i: any) => <p key={i.id} className="text-xs">{i.ref} · {i.subject} · {STATUS_LABELS[i.status]}</p>) : <p className="text-[#7A6960]">None</p>}</div>
          </div>}
        </SheetContent>
      </Sheet>
      {dialog}
    </AdminPage>
  );
}

export function AdminInquiries() {
  const [f, setF] = useState({ q: "", status: "", kind: "" });
  const [open, setOpen] = useState<any>(null);
  const [reply, setReply] = useState("");
  const { data, refetch } = useQuery({ queryKey: ["admin-inquiries", f], queryFn: async () => (await api.get("/admin/inquiries", { params: Object.fromEntries(Object.entries(f).filter(([, v]) => v)) })).data });
  const { data: staff } = useQuery({ queryKey: ["staff-dir"], queryFn: async () => (await api.get("/admin/staff-directory")).data.items });
  const update = async (body: any, msg: string) => {
    try { const { data: r } = await api.patch(`/admin/inquiries/${open.id}`, body); toast[r.reply_delivered === false ? "warning" : "success"](r.reply_delivered === false ? "Reply saved — NOT delivered (no email/SMS provider configured). Please contact the customer by phone." : msg); const fresh = await refetch(); setOpen(fresh.data.items.find((x: any) => x.id === open.id)); setReply(""); } catch (x) { toast.error(errorMessage(x)); }
  };
  return (
    <AdminPage title="Inquiries" sub={data && !data.reply_channel_configured ? "Reply delivery channel not configured — replies are recorded but not sent." : undefined} testId="admin-inquiries">
      <div className="mb-4 flex flex-wrap gap-2">
        <input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder="Search" className={`${inp} w-64`} data-testid="inquiries-search" />
        <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={`${inp} w-44`} data-testid="inquiries-status-filter"><option value="">All statuses</option>{["new", "open", "awaiting_customer", "resolved", "closed"].map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select>
        <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} className={`${inp} w-36`}><option value="">All types</option><option value="general">General</option><option value="product">Product</option><option value="order">Order</option></select>
      </div>
      {!data ? <PageLoader /> : (
        <Table head={["Ref", "Received", "From", "Subject", "Related", "Assigned", "Status"]} testId="inquiries-table">
          {data.items.map((i: any) => <tr key={i.id} className="cursor-pointer hover:bg-[#FAF7F2]" onClick={() => setOpen(i)} data-testid={`inquiry-row-${i.ref}`}><Td className="font-mono text-xs">{i.ref}</Td><Td className="text-xs">{fmtDate(i.created_at, true)}</Td><Td><p>{i.name}</p><p className="text-xs text-[#7A6960]">{i.phone || i.email}</p></Td><Td>{i.subject}</Td><Td className="text-xs">{i.product_name || i.order_number || "—"}</Td><Td className="text-xs">{staff?.find((s: any) => s.id === i.assigned_to)?.name || "—"}</Td><Td><StatusBadge status={i.status} /></Td></tr>)}
        </Table>
      )}
      <Sheet open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl" data-testid="inquiry-sheet">
          {open && <>
            <SheetTitle className="font-serif text-xl font-normal">{open.subject}</SheetTitle>
            <p className="text-xs text-[#7A6960]">{open.ref} · {open.name} · {open.phone} {open.email} {open.order_number && `· Order ${open.order_number}`}</p>
            <p className="mt-4 whitespace-pre-line border-l-2 border-[#E6DDD0] pl-4 text-sm">{open.message}</p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <select value={open.status} onChange={(e) => update({ status: e.target.value }, "Status updated")} className={inp} data-testid="inquiry-status-select">{["new", "open", "awaiting_customer", "resolved", "closed"].map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select>
              <select value={open.assigned_to || ""} onChange={(e) => update({ assigned_to: e.target.value }, "Assigned")} className={inp} data-testid="inquiry-assign-select"><option value="">Unassigned</option>{staff?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            </div>
            <div className="mt-6 space-y-3">{open.replies.map((r: any, k: number) => <div key={k} className="bg-[#FAF7F2] p-3 text-sm"><p className="text-xs text-[#7A6960]">Reply by {r.by} · {fmtDate(r.at, true)} · {r.delivered ? "delivered" : "not delivered"}</p><p className="mt-1">{r.message}</p></div>)}
              {open.notes.map((n: any, k: number) => <div key={`n${k}`} className="border border-dashed border-[#E6DDD0] p-3 text-xs"><span className="font-medium">Internal note</span> — {n.by}: {n.text}</div>)}</div>
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder="Write a reply or internal note…" className="input-rd mt-4 h-auto py-2" data-testid="inquiry-reply-text" />
            <div className="mt-2 flex gap-2"><button disabled={!reply} onClick={() => update({ reply }, "Reply sent")} className={btn} data-testid="inquiry-reply-btn">Reply to customer</button><button disabled={!reply} onClick={() => update({ note: reply }, "Note added")} className={btnOutline} data-testid="inquiry-note-btn">Add internal note</button></div>
          </>}
        </SheetContent>
      </Sheet>
    </AdminPage>
  );
}
