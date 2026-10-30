import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { money, cldImg, fmtDate } from "@/lib/format";
import { useSeo } from "@/lib/seo";
import { useAuth } from "@/context/AuthContext";
import { OrderTimeline, StatusBadge, Field } from "@/components/common";

export function OrderView({ o }: { o: any }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]" data-testid="order-view">
      <div>
        <div className="flex flex-wrap items-center gap-3"><StatusBadge status={o.status} testId="order-status-badge" /><StatusBadge status={o.payment.status} testId="order-payment-badge" /><span className="text-xs text-[#7A6960]">Placed {fmtDate(o.created_at, true)}</span></div>
        <ul className="mt-6 divide-y divide-[#E6DDD0] border-y border-[#E6DDD0]">
          {o.items.map((i: any, k: number) => (
            <li key={k} className="flex items-center gap-4 py-4">
              {i.image && <img src={cldImg(i.image, 160)} alt="" className="h-16 w-14 object-cover" />}
              <div className="flex-1 text-sm"><p className="font-serif text-base">{i.name}</p><p className="text-xs text-[#7A6960]">{i.variant_label ? `${i.variant_label} · ` : ""}{money(i.unit_price)} × {i.quantity}</p></div>
              <span className="text-sm">{money(i.line_total)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-[#7A6960]">Subtotal</dt><dd>{money(o.subtotal)}</dd></div>
          {o.discount > 0 && <div className="flex justify-between"><dt className="text-[#7A6960]">Discount {o.coupon_code && `(${o.coupon_code})`}</dt><dd>−{money(o.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-[#7A6960]">Delivery</dt><dd>{money(o.shipping)}</dd></div>
          <div className="flex justify-between border-t border-[#E6DDD0] pt-2 font-medium"><dt>Total</dt><dd data-testid="order-total">{money(o.total)}</dd></div>
          {o.payment.amount_paid > 0 && <div className="flex justify-between text-emerald-800"><dt>Paid</dt><dd>{money(o.payment.amount_paid)}</dd></div>}
        </dl>
        <div className="mt-8 grid gap-6 text-sm sm:grid-cols-2">
          <div><p className="label-rd">Deliver to</p><p>{o.customer.name} · {o.customer.phone}</p><p className="text-[#594940]">{o.shipping_address.address}{o.shipping_address.area && `, ${o.shipping_address.area}`}, {o.shipping_address.district}</p></div>
          <div><p className="label-rd">Payment</p><p>{o.payment.method_label}</p>{o.payment.instructions && <p className="mt-1 text-xs text-[#7A6960]">{o.payment.instructions}</p>}{o.payment.bank_details && <p className="mt-1 whitespace-pre-line text-xs">{o.payment.bank_details}</p>}</div>
          {o.courier && <div><p className="label-rd">Courier</p><p>{o.courier.name} {o.courier.tracking_number && `· ${o.courier.tracking_number}`}</p>{o.courier.tracking_url && <a className="text-xs underline" href={o.courier.tracking_url} target="_blank" rel="noreferrer">Track parcel</a>}</div>}
          {o.customer_notes?.length > 0 && <div><p className="label-rd">Updates from Raf Decor</p>{o.customer_notes.map((n: any, k: number) => <p key={k} className="text-[#594940]">{n.text}</p>)}</div>}
        </div>
      </div>
      <div className="border border-[#E6DDD0] bg-white p-6"><p className="label-rd mb-5">Order progress</p><OrderTimeline history={o.history} status={o.status} /></div>
    </div>
  );
}

export function OrderSuccess() {
  const { number } = useParams();
  const { user } = useAuth();
  useSeo({ title: "Order confirmed", noindex: true });
  const cached = JSON.parse(sessionStorage.getItem("rd_last_order") || "null");
  const { data } = useQuery({ queryKey: ["order", number], queryFn: async () => (await api.get(`/orders/${number}`)).data, enabled: !!user, initialData: cached?.order_number === number ? cached : undefined });
  const o = data || (cached?.order_number === number ? cached : null);
  return (
    <div className="container-rd py-16" data-testid="order-success-page">
      <div className="max-w-2xl">
        <CheckCircle2 className="h-10 w-10 text-[#2D6A4F]" strokeWidth={1.4} />
        <p className="eyebrow mt-6">Thank you</p>
        <h1 className="mt-3 text-4xl tracking-tight sm:text-5xl">Your order has been placed</h1>
        <p className="mt-4 text-[#594940]">Order number <strong className="font-mono text-[#2C1E18]" data-testid="success-order-number">{number}</strong>. Our team will call you on your mobile number to confirm the order before dispatch.</p>
        <p className="mt-2 text-sm text-[#7A6960]">Keep your order number — you can track it any time with your phone number.</p>
        <div className="mt-8 flex flex-wrap gap-3"><Link to={user ? `/account/orders/${number}` : "/track-order"} className="btn-primary" data-testid="success-track-btn">Track this order</Link><Link to="/shop" className="btn-outline">Continue shopping</Link></div>
      </div>
      {o && <div className="mt-14"><OrderView o={o} /></div>}
    </div>
  );
}

export function TrackOrder() {
  const [o, setO] = useState<any>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useSeo({ title: "Track your order", description: "Track your Raf Decor order with your order number and mobile number." });
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as any;
    setBusy(true); setErr("");
    try { setO((await api.post("/orders/track", f)).data); } catch (x) { setO(null); setErr(errorMessage(x)); } finally { setBusy(false); }
  };
  return (
    <div className="container-rd py-14" data-testid="track-order-page">
      <p className="eyebrow">Order tracking</p>
      <h1 className="mt-3 text-4xl tracking-tight">Track your order</h1>
      <form onSubmit={submit} className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Order number" htmlFor="t-num"><input id="t-num" name="order_number" required placeholder="RD261022-123456" className="input-rd uppercase" data-testid="track-order-number" /></Field>
        <Field label="Mobile number used" htmlFor="t-phone"><input id="t-phone" name="phone" required placeholder="01XXXXXXXXX" className="input-rd" data-testid="track-phone" /></Field>
        <button disabled={busy} className="btn-primary h-11" data-testid="track-submit-btn">{busy ? "Checking…" : "Track"}</button>
      </form>
      {err && <p className="mt-4 text-sm text-red-800" role="alert" data-testid="track-error">{err}</p>}
      {o && <div className="mt-12"><h2 className="mb-6 font-mono text-lg">{o.order_number}</h2><OrderView o={o} /></div>}
    </div>
  );
}
