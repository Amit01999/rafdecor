import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Lock } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, errorMessage, errorIssues } from "@/lib/api";
import { money, cldImg, sessionId } from "@/lib/format";
import { track, useSeo } from "@/lib/seo";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { CartLines } from "@/components/store/CartDrawer";
import { EmptyState, Field, PageLoader } from "@/components/common";
import { WHATSAPP_DISPLAY_NUMBER, WHATSAPP_LINK, WhatsAppIcon } from "@/components/common/WhatsApp";

function Summary({ coupon, setCoupon, quote, children }: any) {
  const [code, setCode] = useState(coupon || "");
  return (
    <aside className="border border-[#E6DDD0] bg-white p-6 lg:p-8" data-testid="order-summary">
      <h2 className="font-serif text-xl">Order summary</h2>
      <form className="mt-5 flex gap-2" onSubmit={(e) => { e.preventDefault(); setCoupon(code.trim() || null); }}>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" className="input-rd uppercase" data-testid="coupon-input" />
        <button className="h-11 border border-[#4E3629] px-4 text-xs uppercase tracking-wider hover:bg-[#4E3629] hover:text-white" data-testid="coupon-apply-btn">Apply</button>
      </form>
      {quote?.coupon && <p className={`mt-2 text-xs ${quote.coupon.valid ? "text-emerald-700" : "text-red-700"}`} data-testid="coupon-message">{quote.coupon.message}{coupon && <button className="ml-2 underline" onClick={() => { setCoupon(null); setCode(""); }}>Remove</button>}</p>}
      <dl className="mt-6 space-y-2.5 text-sm">
        <div className="flex justify-between"><dt className="text-[#7A6960]">Subtotal</dt><dd data-testid="summary-subtotal">{money(quote?.subtotal)}</dd></div>
        {quote?.discount > 0 && <div className="flex justify-between text-emerald-800"><dt>Discount</dt><dd data-testid="summary-discount">−{money(quote.discount)}</dd></div>}
        <div className="flex justify-between"><dt className="text-[#7A6960]">Delivery charge</dt><dd data-testid="summary-shipping">{money(quote?.shipping)}</dd></div>
        <div className="flex justify-between border-t border-[#E6DDD0] pt-4 text-base font-medium"><dt>Total</dt><dd data-testid="summary-total">{money(quote?.total)}</dd></div>
      </dl>
      {children}
    </aside>
  );
}

export function CartPage() {
  const { items, quote } = useCart();
  const [coupon, setCoupon] = useState<string | null>(() => sessionStorage.getItem("rd_coupon"));
  const nav = useNavigate();
  useSeo({ title: "Cart", noindex: true });
  const { data: q2 } = useQuery({ queryKey: ["quote-coupon", items, coupon], queryFn: async () => (await api.post("/cart/quote", { items, coupon_code: coupon })).data, enabled: !!coupon && items.length > 0 });
  useEffect(() => { if (coupon) sessionStorage.setItem("rd_coupon", coupon); else sessionStorage.removeItem("rd_coupon"); }, [coupon]);
  if (!items.length) return <div className="container-rd py-20"><EmptyState icon={<ShoppingBag className="h-7 w-7" />} title="Your cart is empty" body="Discover handcrafted pieces made from natural wood." action={<Link to="/shop" className="btn-primary" data-testid="cart-empty-shop-btn">Browse the shop</Link>} /></div>;
  const shown = coupon ? q2 || quote : quote;
  return (
    <div className="container-rd py-12" data-testid="cart-page">
      <h1 className="text-4xl tracking-tight">Your cart</h1>
      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_400px]">
        <div><CartLines />{quote?.issues?.length ? <p className="mt-4 text-sm text-red-800" data-testid="cart-issues">Please resolve the highlighted items before checkout.</p> : null}</div>
        <Summary coupon={coupon} setCoupon={setCoupon} quote={shown}>
          <button className="btn-primary mt-6 w-full" disabled={!!quote?.issues?.length} onClick={() => nav("/checkout")} data-testid="cart-checkout-btn">Proceed to checkout</button>
          <Link to="/shop" className="mt-3 block text-center text-sm text-[#7A6960] hover:text-[#2C1E18]">Continue shopping</Link>
        </Summary>
      </div>
    </div>
  );
}

export function CheckoutPage() {
  const { items, quote, clear } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [coupon, setCoupon] = useState<string | null>(() => sessionStorage.getItem("rd_coupon"));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState("cod");
  const [district, setDistrict] = useState("Dhaka");
  const idem = useMemo(() => crypto.randomUUID ? crypto.randomUUID() : sessionId() + Date.now(), []);
  useSeo({ title: "Checkout", noindex: true });
  const { data: opts } = useQuery({ queryKey: ["checkout-options"], queryFn: async () => (await api.get("/checkout/options")).data });
  const { data: me } = useQuery({ queryKey: ["me-full"], queryFn: async () => (await api.get("/customers/me")).data, enabled: !!user });
  const { data: q, refetch } = useQuery({ queryKey: ["checkout-quote", items, coupon], queryFn: async () => (await api.post("/cart/quote", { items, coupon_code: coupon })).data, enabled: items.length > 0 });
  useEffect(() => { if (items.length) track("checkout_start"); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const addr = me?.addresses?.find((a: any) => a.is_default);
  useEffect(() => { if (addr?.district) setDistrict(addr.district); }, [addr?.district]);
  if (!items.length) return <div className="container-rd py-20"><EmptyState title="Nothing to check out" body="Your cart is empty." action={<Link to="/shop" className="btn-primary">Browse the shop</Link>} /></div>;
  if (!q || !opts) return <PageLoader />;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as any;
    const errs: Record<string, string> = {};
    if (!f.name || f.name.trim().length < 2) errs.name = "Please enter your name";
    if (!/^(?:\+?88)?01[3-9]\d{8}$/.test((f.phone || "").replace(/[\s-]/g, ""))) errs.phone = "Enter a valid mobile number (01XXXXXXXXX)";
    if (!f.address || f.address.trim().length < 5) errs.address = "Please enter your full delivery address";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const { data } = await api.post("/checkout/orders", {
        items, coupon_code: coupon, payment_method: method, idempotency_key: idem,
        customer: { name: f.name, phone: f.phone, email: f.email || null },
        shipping_address: { address: f.address, district, area: f.area || "", notes: f.notes || "" },
      }, { headers: { "x-session-id": sessionId() } });
      clear();
      sessionStorage.removeItem("rd_coupon");
      sessionStorage.setItem("rd_last_order", JSON.stringify(data.order));
      nav(`/order-success/${data.order.order_number}`);
    } catch (err) {
      toast.error(errorMessage(err));
      if (errorIssues(err).length) refetch();
    } finally { setBusy(false); }
  };

  return (
    <div className="container-rd py-12" data-testid="checkout-page">
      <h1 className="text-4xl tracking-tight">Checkout</h1>
      {!user && <p className="mt-3 text-sm text-[#7A6960]">Checking out as a guest. <Link to="/login?next=/checkout" className="underline">Sign in</Link> to track orders in your account.</p>}
      <form onSubmit={submit} noValidate className="mt-10 grid gap-12 lg:grid-cols-[1fr_420px]">
        <div className="space-y-10">
          <fieldset>
            <legend className="font-serif text-xl">Delivery details</legend>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="নাম / Full name *" error={errors.name} htmlFor="co-name"><input id="co-name" name="name" defaultValue={addr?.name || (user ? user.name : "")} className="input-rd" data-testid="checkout-name" /></Field>
              <Field label="মোবাইল নাম্বার / Mobile *" error={errors.phone} htmlFor="co-phone"><input id="co-phone" name="phone" inputMode="tel" defaultValue={addr?.phone || (user ? user.phone || "" : "")} placeholder="01XXXXXXXXX" className="input-rd" data-testid="checkout-phone" /></Field>
              <div className="sm:col-span-2"><Field label="Email (optional — for order updates)" htmlFor="co-email"><input id="co-email" name="email" type="email" defaultValue={user ? user.email : ""} className="input-rd" data-testid="checkout-email" /></Field></div>
              <div className="sm:col-span-2"><Field label="ডেলিভারি ঠিকানা / Delivery address *" error={errors.address} htmlFor="co-address"><input id="co-address" name="address" defaultValue={addr?.address || ""} placeholder="House, road, area" className="input-rd" data-testid="checkout-address" /></Field></div>
              <Field label="District *">
                <Select value={district} onValueChange={setDistrict}>
                  <SelectTrigger className="h-11 rounded-[3px] border-[#E6DDD0] bg-white" data-testid="checkout-district"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">{(opts.districts || []).map((d: string) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Area / Thana" htmlFor="co-area"><input id="co-area" name="area" defaultValue={addr?.area || ""} className="input-rd" data-testid="checkout-area" /></Field>
              <div className="sm:col-span-2"><Field label="Order notes (optional)" htmlFor="co-notes"><textarea id="co-notes" name="notes" rows={3} className="input-rd h-auto py-3" placeholder="Delivery instructions, preferred time…" data-testid="checkout-notes" /></Field></div>
            </div>
          </fieldset>
          <fieldset>
            <legend className="font-serif text-xl">Payment method</legend>
            <div className="mt-5 space-y-3" role="radiogroup">
              {opts.payment_methods.map((m: any) => (
                <label key={m.key} className={`flex cursor-pointer gap-4 border p-5 transition-colors ${method === m.key ? "border-[#4E3629] bg-white" : "border-[#E6DDD0] hover:border-[#B07A5B]"}`} data-testid={`payment-method-${m.key}`}>
                  <input type="radio" name="pm" checked={method === m.key} onChange={() => setMethod(m.key)} className="mt-1 accent-[#4E3629]" />
                  <span><span className="block text-sm font-medium">{m.label}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-[#7A6960]">{m.key === "cod" ? "Pay with cash upon delivery." : m.key === "bank_transfer" ? opts.bank_instructions : ""}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <Summary coupon={coupon} setCoupon={setCoupon} quote={q}>
          <ul className="mt-6 space-y-3 border-t border-[#E6DDD0] pt-5">
            {q.lines.map((l: any) => (
              <li key={l.product_id + (l.variant_id || "")} className="flex items-center gap-3 text-sm">
                <img src={cldImg(l.image, 120)} alt="" className="h-14 w-12 object-cover" />
                <span className="flex-1"><span className="block">{l.name}</span><span className="text-xs text-[#7A6960]">{l.variant_label ? `${l.variant_label} · ` : ""}Qty {l.quantity}</span></span>
                <span>{money(l.line_total)}</span>
              </li>
            ))}
          </ul>
          {q.issues.length > 0 && <div className="mt-4 border border-red-200 bg-red-50 p-3 text-xs text-red-800" data-testid="checkout-issues">{q.issues.map((i: any) => <p key={i.product_id}>{i.message}</p>)}<Link to="/cart" className="underline">Review cart</Link></div>}
          <button disabled={busy || q.issues.length > 0 || (coupon && !q.coupon?.valid)} className="btn-primary mt-6 w-full" data-testid="place-order-btn"><Lock className="h-4 w-4" />{busy ? "Placing order…" : `Place order · ${money(q.total)}`}</button>
          <p className="mt-3 text-center text-xs text-[#7A6960]">Prices and stock are confirmed by our server when you place the order.</p>
        </Summary>
      </form>
      <a
        href={`${WHATSAPP_LINK}?text=${encodeURIComponent("Hi, I need help with checkout.")}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chat with RAF Decor on WhatsApp at ${WHATSAPP_DISPLAY_NUMBER}`}
        title={`WhatsApp ${WHATSAPP_DISPLAY_NUMBER}`}
        className="fixed bottom-6 right-5 z-50 inline-flex h-12 items-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#1FB956] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
        data-testid="checkout-whatsapp-chat"
      >
        <WhatsAppIcon className="h-5 w-5" />
        <span>{WHATSAPP_DISPLAY_NUMBER}</span>
      </a>
    </div>
  );
}
