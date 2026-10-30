import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingBag, X, AlertCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/context/CartContext";
import { money, cldImg } from "@/lib/format";
import { EmptyState, Spinner } from "@/components/common";

export function QtyStepper({ value, onChange, max, testId }: { value: number; onChange: (n: number) => void; max?: number | null; testId: string }) {
  return (
    <div className="inline-flex h-10 items-center border border-[#E6DDD0] bg-white" data-testid={testId}>
      <button className="flex h-full w-9 items-center justify-center hover:bg-[#F2ECE0] disabled:opacity-40" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity" data-testid={`${testId}-dec`}><Minus className="h-3.5 w-3.5" /></button>
      <span className="w-8 text-center text-sm tabular-nums" data-testid={`${testId}-value`}>{value}</span>
      <button className="flex h-full w-9 items-center justify-center hover:bg-[#F2ECE0] disabled:opacity-40" onClick={() => onChange(value + 1)} disabled={max != null && value >= max} aria-label="Increase quantity" data-testid={`${testId}-inc`}><Plus className="h-3.5 w-3.5" /></button>
    </div>
  );
}

export function CartLines({ compact = false }: { compact?: boolean }) {
  const { quote, setQty, remove, setOpen } = useCart();
  if (!quote) return <div className="py-10"><Spinner /></div>;
  return (
    <ul className="divide-y divide-[#E6DDD0]" data-testid="cart-lines">
      {quote.lines.map((l) => (
        <li key={l.product_id + (l.variant_id || "")} className="flex gap-4 py-5" data-testid={`cart-line-${l.slug}`}>
          <Link to={`/product/${l.slug}`} onClick={() => setOpen(false)} className={`${compact ? "h-24 w-20" : "h-32 w-28"} shrink-0 bg-[#F2ECE0]`}>
            {l.image && <img src={cldImg(l.image, 300)} alt={l.name} className="h-full w-full object-cover" />}
          </Link>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex justify-between gap-3">
              <div>
                <Link to={`/product/${l.slug}`} onClick={() => setOpen(false)} className="font-serif text-[15px] leading-snug text-[#1F1916]">{l.name}</Link>
                {l.variant_label && <p className="mt-0.5 text-xs text-[#7A6960]">{l.variant_label}</p>}
                <p className="mt-1 text-xs text-[#7A6960]">{money(l.unit_price)} each</p>
              </div>
              <button onClick={() => remove(l.product_id, l.variant_id)} aria-label={`Remove ${l.name}`} className="h-7 w-7 shrink-0 text-[#7A6960] hover:text-[#2C1E18]" data-testid={`cart-remove-${l.slug}`}><X className="mx-auto h-4 w-4" /></button>
            </div>
            {!l.valid && <p className="mt-1 flex items-center gap-1 text-xs text-red-700"><AlertCircle className="h-3 w-3" />{l.available === 0 ? "Out of stock" : `Only ${l.available} available`}</p>}
            <div className="mt-auto flex items-end justify-between pt-3">
              <QtyStepper value={l.quantity} max={l.available} onChange={(n) => setQty(l.product_id, l.variant_id, n)} testId={`cart-qty-${l.slug}`} />
              <span className="text-sm font-medium" data-testid={`cart-line-total-${l.slug}`}>{money(l.line_total)}</span>
            </div>
          </div>
        </li>
      ))}
      {quote.issues.filter((i) => i.code === "unavailable" || i.code === "variant_required").map((i) => (
        <li key={i.product_id + (i.variant_id || "")} className="flex items-center justify-between gap-3 py-4 text-sm text-red-800">
          {i.message}<button className="shrink-0 underline" onClick={() => remove(i.product_id, i.variant_id)}>Remove</button>
        </li>
      ))}
    </ul>
  );
}

export function CartDrawer() {
  const { open, setOpen, items, quote } = useCart();
  const nav = useNavigate();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col border-l-[#E6DDD0] bg-[#FAF7F2] p-0 sm:max-w-md" data-testid="cart-drawer">
        <SheetHeader className="border-b border-[#E6DDD0] px-6 py-5">
          <SheetTitle className="font-serif text-xl font-normal">Your cart {items.length > 0 && <span className="text-sm text-[#7A6960]">({items.length})</span>}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            <div className="py-10"><EmptyState icon={<ShoppingBag className="h-7 w-7" />} title="Your cart is empty" body="Discover handcrafted pieces made from natural wood."
              action={<button className="btn-primary mt-2" onClick={() => { setOpen(false); nav("/shop"); }} data-testid="cart-drawer-shop-btn">Browse the shop</button>} /></div>
          ) : <CartLines compact />}
        </div>
        {quote && quote.lines.length > 0 && (
          <div className="border-t border-[#E6DDD0] bg-white px-6 py-5">
            <div className="flex justify-between text-sm"><span className="text-[#7A6960]">Subtotal</span><span data-testid="cart-drawer-subtotal">{money(quote.subtotal)}</span></div>
            <div className="mt-1 flex justify-between text-sm"><span className="text-[#7A6960]">Delivery</span><span>{money(quote.shipping)}</span></div>
            <div className="mt-3 flex justify-between border-t border-[#E6DDD0] pt-3 font-medium"><span>Total</span><span data-testid="cart-drawer-total">{money(quote.total)}</span></div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="btn-outline h-11 px-3" onClick={() => { setOpen(false); nav("/cart"); }} data-testid="cart-drawer-view-cart-btn">View cart</button>
              <button className="btn-primary h-11 px-3" disabled={quote.issues.length > 0} onClick={() => { setOpen(false); nav("/checkout"); }} data-testid="cart-drawer-checkout-btn">Checkout</button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
