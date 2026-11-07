import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, Truck, Banknote, MessageCircle, ZoomIn, Star, Check } from "lucide-react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { api, errorMessage } from "@/lib/api";
import { track, useSeo } from "@/lib/seo";
import { money, cldImg, fmtDate } from "@/lib/format";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/SiteContext";
import { useAuth } from "@/context/AuthContext";
import { Breadcrumbs, EmptyState, PageLoader, Price } from "@/components/common";
import { ProductCard } from "@/components/store/ProductCard";
import { QtyStepper } from "@/components/store/CartDrawer";
import { WHATSAPP_DISPLAY_NUMBER, WHATSAPP_LINK, WhatsAppIcon } from "@/components/common/WhatsApp";
import type { Img, Product } from "@/types";

function Gallery({ p, variantImage, variantId }: { p: Product; variantImage?: Img; variantId?: string }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [activeVariantImage, setActiveVariantImage] = useState<Img | null>(null);
  const img = i === -1 && activeVariantImage ? activeVariantImage : p.images[i] || p.images[0] || activeVariantImage;
  const galleryImages = activeVariantImage ? [...p.images, activeVariantImage] : p.images;
  useEffect(() => { setI(0); setActiveVariantImage(null); }, [p.id]);
  useEffect(() => {
    if (variantImage?.url) {
      setActiveVariantImage(variantImage);
      setI(-1);
    }
  }, [p.id, variantId, variantImage]);
  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row" data-testid="product-gallery">
      {galleryImages.length > 1 && (
        <div className="flex gap-3 md:w-20 md:flex-col">
          {galleryImages.map((im, k) => {
            const isVariantImage = !!activeVariantImage && k === p.images.length;
            const active = isVariantImage ? i === -1 : k === i;
            return <button key={isVariantImage ? `variant-${variantId || activeVariantImage?.url}` : k} onClick={() => { setI(isVariantImage ? -1 : k); track("product_engagement", { product_id: p.id }); }} className={`aspect-square w-16 shrink-0 overflow-hidden rounded-lg border-2 shadow-sm transition-all duration-200 md:w-20 ${active ? "border-[#B07A5B] shadow-md" : "border-transparent opacity-70 hover:opacity-100 hover:border-[#E6DDD0]"}`} aria-label={isVariantImage ? "View variant image" : `View image ${k + 1}`} data-testid={`gallery-thumb-${k}`}>
              <img src={cldImg(im.url, 200)} alt="" className="h-full w-full object-cover" />
            </button>;
          })}
        </div>
      )}
      <button className="group relative flex-1 cursor-zoom-in overflow-hidden rounded-2xl bg-[#F2ECE0] shadow-[0_18px_44px_rgba(44,30,24,0.12)] ring-1 ring-[#2C1E18]/5" onClick={() => setZoom(true)} aria-label="Zoom image" data-testid="gallery-main">
        {img && <img src={cldImg(img.url, 1400)} alt={img.alt || p.name} className="aspect-[6/5] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />}
        <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF7F2]/90 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100"><ZoomIn className="h-4 w-4" /></span>
      </button>
      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="max-w-5xl rounded-xl border-0 bg-[#FAF7F2] p-2" data-testid="gallery-zoom">
          <DialogTitle className="sr-only">{p.name}</DialogTitle>
          {img && <img src={cldImg(img.url, 2000)} alt={img.alt || p.name} className="max-h-[85vh] w-full rounded-lg object-contain" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InquiryDialog({ p, open, onOpenChange }: { p: Product; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as any;
    setBusy(true);
    try {
      const { data } = await api.post("/inquiries", { ...f, email: f.email || null, kind: "product", product_id: p.id, subject: `Question about ${p.name}` });
      toast.success(`Thanks! Your question was received (ref ${data.ref}).`);
      onOpenChange(false);
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-xl border-[#E6DDD0] bg-[#FAF7F2]" data-testid="product-inquiry-dialog">
        <DialogTitle className="font-serif text-2xl font-normal">Ask about this piece</DialogTitle>
        <p className="-mt-2 text-sm text-[#7A6960]">{p.name}</p>
        <form onSubmit={submit} className="mt-2 space-y-4">
          <input required name="name" defaultValue={user ? user.name : ""} placeholder="Your name" className="input-rd" data-testid="inquiry-name" />
          <div className="grid grid-cols-2 gap-3"><input name="phone" defaultValue={user ? user.phone || "" : ""} placeholder="Phone" className="input-rd" data-testid="inquiry-phone" /><input name="email" type="email" defaultValue={user ? user.email : ""} placeholder="Email" className="input-rd" data-testid="inquiry-email" /></div>
          <textarea required minLength={5} name="message" rows={4} placeholder="e.g. Can the table height be customised?" className="input-rd h-auto py-3" data-testid="inquiry-message" />
          <button disabled={busy} className="btn-primary w-full" data-testid="inquiry-submit-btn">{busy ? "Sending…" : "Send question"}</button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Reviews({ p }: { p: Product }) {
  const { user } = useAuth();
  const { data, refetch } = useQuery({ queryKey: ["reviews", p.id], queryFn: async () => (await api.get(`/products/${p.id}/reviews`)).data.items });
  const [rating, setRating] = useState(5);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as any;
    try { const { data: r } = await api.post(`/products/${p.id}/reviews`, { ...f, rating }); toast.success(r.message); refetch(); (e.target as HTMLFormElement).reset(); } catch (err) { toast.error(errorMessage(err)); }
  };
  return (
    <section className="container-rd border-t border-[#E6DDD0] py-16" data-testid="product-reviews">
      <h2 className="font-serif text-3xl text-[#2C1E18]">Reviews</h2>
      {data?.length ? (
        <ul className="mt-8 grid gap-6 md:grid-cols-2">{data.map((r: any) => (
          <li key={r.id} className="rounded-xl bg-white p-6 shadow-[0_6px_20px_rgba(44,30,24,0.06)] ring-1 ring-[#2C1E18]/5"><div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, k) => <Star key={k} className={`h-4 w-4 ${k < r.rating ? "fill-[#B07A5B] text-[#B07A5B]" : "text-[#D8CCBC]"}`} />)}</div>
            <p className="mt-3 font-serif text-base font-medium text-[#2C1E18]">{r.title}</p><p className="mt-1 text-sm leading-relaxed text-[#594940]">{r.body}</p><p className="mt-3 text-xs text-[#7A6960]">{r.author} · Verified buyer · {fmtDate(r.created_at)}</p></li>
        ))}</ul>
      ) : <p className="mt-4 text-sm text-[#7A6960]" data-testid="no-reviews">No reviews yet. Reviews can be written by customers who have received this product.</p>}
      {user && (
        <form onSubmit={submit} className="mt-10 max-w-xl space-y-3 rounded-xl bg-[#F2ECE0]/60 p-6" data-testid="review-form">
          <div className="flex gap-1">{[1, 2, 3, 4, 5].map((k) => <button type="button" key={k} onClick={() => setRating(k)} aria-label={`${k} stars`}><Star className={`h-5 w-5 ${k <= rating ? "fill-[#B07A5B] text-[#B07A5B]" : "text-[#D8CCBC]"}`} /></button>)}</div>
          <input name="title" placeholder="Title (optional)" className="input-rd" />
          <textarea name="body" required minLength={5} rows={3} placeholder="Share your experience" className="input-rd h-auto py-3" data-testid="review-body" />
          <button className="btn-outline" data-testid="review-submit-btn">Submit review</button>
        </form>
      )}
    </section>
  );
}

export default function ProductPage() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { add } = useCart();
  const wl = useWishlist();
  const [sel, setSel] = useState<Record<string, string>>({});
  const [namedVariantId, setNamedVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [ask, setAsk] = useState(false);
  const { data: p, isLoading, isError } = useQuery<Product>({ queryKey: ["product", slug], queryFn: async () => (await api.get(`/products/${slug}`)).data, retry: false });
  const { data: related } = useQuery({ queryKey: ["related", slug], queryFn: async () => (await api.get(`/products/${slug}/related`)).data.items as Product[], enabled: !!p });
  const { data: site } = useQuery({ queryKey: ["checkout-options"], queryFn: async () => (await api.get("/checkout/options")).data });
  const recentIds = useMemo(() => JSON.parse(localStorage.getItem("rd_recent") || "[]").filter((x: string) => x !== p?.id).slice(0, 4), [p?.id]);
  const { data: recent } = useQuery({ queryKey: ["recent", recentIds.join()], queryFn: async () => (await api.get("/products", { params: { ids: recentIds.join(","), limit: 4 } })).data.items as Product[], enabled: recentIds.length > 0 });

  useEffect(() => {
    if (!p) return;
    track("product_view", { product_id: p.id });
    const r = [p.id, ...JSON.parse(localStorage.getItem("rd_recent") || "[]").filter((x: string) => x !== p.id)].slice(0, 8);
    localStorage.setItem("rd_recent", JSON.stringify(r));
    setSel({}); setNamedVariantId(null); setQty(1);
  }, [p]);

  const useNamedVariantPicker = !!p && !p.attributes.length && p.variants.some((v) => !!v.name?.trim());
  const variant = p?.variants.find((v) => useNamedVariantPicker
    ? v.id === namedVariantId
    : p.attributes.every((a) => sel[a.name] && v.attributes[a.name] === sel[a.name]));
  const needsVariant = !!p?.variants.length && !variant;
  const available = variant ? variant.available : p?.available;
  const inStock = variant ? variant.in_stock : p?.in_stock;
  useSeo({
    title: p?.name, description: p?.short_description?.slice(0, 160), image: p?.images?.[0]?.url,
    jsonLd: p ? { "@context": "https://schema.org", "@type": "Product", name: p.name, image: p.images.map((i) => i.url), description: p.short_description, sku: p.sku || undefined,
      brand: { "@type": "Brand", name: "Raf Decor" }, offers: { "@type": "AggregateOffer", priceCurrency: "BDT", lowPrice: p.price_min, highPrice: p.price_max, availability: p.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" } } : undefined,
  });

  if (isLoading) return <PageLoader />;
  if (isError || !p) return <div className="container-rd py-24"><EmptyState title="Product not found" body="This product may no longer be available." action={<Link to="/shop" className="btn-primary">Browse the shop</Link>} /></div>;

  const doAdd = (buy = false) => {
    if (needsVariant) { toast.error("Please select an option first"); return; }
    add({ product_id: p.id, variant_id: variant?.id || null, quantity: qty }, p.name);
    if (buy) nav("/checkout");
  };
  const cat = p.categories?.[0];
  return (
    <div data-testid="product-page">
      <div className="container-rd pt-8"><Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Shop", to: "/shop" }, ...(cat ? [{ label: cat.name, to: `/product-category/${cat.slug}` }] : []), { label: p.name }]} /></div>
      <div className="container-rd grid gap-12 py-8 lg:grid-cols-12 lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:col-span-7 lg:self-start"><Gallery p={p} variantImage={variant?.image} variantId={variant?.id} /></div>
        <div className="lg:col-span-5">
          {cat && <p className="eyebrow">{cat.name}</p>}
          <h1 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-[#2C1E18] sm:text-4xl" data-testid="product-title">{p.name}</h1>
          <div className="mt-4 text-2xl font-semibold" data-testid="product-price">
            {variant ? <Price price={variant.effective_price} regular={variant.on_sale ? variant.price : undefined} /> : <Price price={p.price_min} max={p.price_max} regular={p.on_sale && !p.variants.length ? p.price : undefined} />}
          </div>
          <p className="mt-6 font-bn text-[15px] leading-[1.9] text-[#594940]">{p.short_description}</p>

          {useNamedVariantPicker ? (
            <div className="mt-8" data-testid="variant-group-name">
              <p className="label-rd">Variant{namedVariantId && variant && <span className="ml-2 normal-case tracking-normal text-[#2C1E18]">{variant.name?.trim() || Object.values(variant.attributes || {}).join(", ") || `Option ${p.variants.indexOf(variant) + 1}`}</span>}</p>
              <div className="flex flex-wrap gap-2">
                {p.variants.map((v, i) => {
                  const label = v.name?.trim() || Object.values(v.attributes || {}).join(", ") || `Option ${i + 1}`;
                  return <button key={v.id} disabled={!v.in_stock} onClick={() => setNamedVariantId(v.id)} className={`min-w-[72px] rounded-[4px] border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${namedVariantId === v.id ? "border-[#4E3629] bg-[#4E3629] text-white shadow-sm" : "border-[#E6DDD0] bg-white hover:border-[#B07A5B] hover:shadow-sm"} disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through`} data-testid={`variant-option-name-${i}`}>{label}</button>;
                })}
              </div>
            </div>
          ) : p.attributes.filter((a) => p.variants.length).map((a) => (
            <div key={a.name} className="mt-8" data-testid={`variant-group-${a.name}`}>
              <p className="label-rd">{a.name}{sel[a.name] && <span className="ml-2 normal-case tracking-normal text-[#2C1E18]">{sel[a.name]}</span>}</p>
              <div className="flex flex-wrap gap-2">
                {a.values.map((v) => {
                  const ok = p.variants.some((x) => x.attributes[a.name] === v && x.in_stock);
                  return <button key={v} disabled={!ok} onClick={() => setSel({ ...sel, [a.name]: v })} className={`min-w-[72px] rounded-[4px] border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${sel[a.name] === v ? "border-[#4E3629] bg-[#4E3629] text-white shadow-sm" : "border-[#E6DDD0] bg-white hover:border-[#B07A5B] hover:shadow-sm"} disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through`} data-testid={`variant-option-${v.replace(/\s+/g, "-")}`}>{v}</button>;
                })}
              </div>
            </div>
          ))}

          <p className="mt-6 flex items-center gap-2 text-sm" data-testid="product-stock">
            {inStock ? <><span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700/10"><Check className="h-3 w-3 text-emerald-700" /></span><span>{available != null ? `In stock — ${available} available` : "In stock"}</span></> : <span className="text-red-800">Out of stock</span>}
          </p>
          <div className="mt-6 flex gap-3">
            <QtyStepper value={qty} onChange={setQty} max={available} testId="product-qty" />
            <button onClick={() => doAdd()} disabled={!inStock} className="btn-primary h-11 flex-1 shadow-[0_10px_24px_rgba(78,54,41,0.18)]" data-testid="add-to-cart-btn">Add to cart</button>
            <button onClick={() => wl.toggle(p.id)} aria-label="Save to wishlist" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#E6DDD0] transition-colors hover:border-[#B07A5B]" data-testid="product-wishlist-btn"><Heart className={`h-4 w-4 ${wl.has(p.id) ? "fill-[#B07A5B] text-[#B07A5B]" : ""}`} /></button>
          </div>
          <button onClick={() => doAdd(true)} disabled={!inStock} className="btn-outline mt-3 w-full" data-testid="buy-now-btn">Buy now — অর্ডার করুন</button>

          <ul className="mt-8 space-y-4 border-y border-[#E6DDD0] py-7 text-sm text-[#594940]">
            <li className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F2ECE0] text-[#B07A5B]"><Truck className="h-4 w-4" /></span><span data-testid="product-delivery-charge">Delivery charge: <strong className="font-medium text-[#2C1E18]">{money(p.shipping_charge)}</strong></span></li>
            <li className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F2ECE0] text-[#B07A5B]"><Banknote className="h-4 w-4" /></span><span>{(site?.payment_methods || []).map((m: any) => m.label).join(" · ") || "Cash on delivery"}</span></li>
            <li className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F2ECE0] text-[#B07A5B]"><MessageCircle className="h-4 w-4" /></span><button onClick={() => setAsk(true)} className="link-underline text-[#4E3629]" data-testid="product-ask-btn">Ask a question about this product</button></li>
          </ul>

          <Accordion type="multiple" defaultValue={["specs"]} className="mt-2">
            {p.specs.length > 0 && (
              <AccordionItem value="specs" className="border-[#E6DDD0]"><AccordionTrigger className="font-serif text-lg font-normal hover:no-underline">Specifications</AccordionTrigger>
                <AccordionContent><dl className="divide-y divide-[#E6DDD0]/70 font-bn" data-testid="product-specs">{p.specs.map((s, k) => <div key={k} className="grid grid-cols-[40%_1fr] gap-4 py-2.5 text-sm"><dt className="text-[#7A6960]">{s.label}</dt><dd>{s.value}</dd></div>)}</dl></AccordionContent>
              </AccordionItem>
            )}
            <AccordionItem value="desc" className="border-[#E6DDD0]"><AccordionTrigger className="font-serif text-lg font-normal hover:no-underline">Description & care</AccordionTrigger>
              <AccordionContent><div className="prose-rd whitespace-pre-line font-bn" data-testid="product-description">{p.description}</div></AccordionContent>
            </AccordionItem>
            <AccordionItem value="delivery" className="border-[#E6DDD0]"><AccordionTrigger className="font-serif text-lg font-normal hover:no-underline">Delivery & returns</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-[#594940]">Delivery charge for this item is {money(p.shipping_charge)}. Read our <Link to="/refund_returns" className="underline">refund & returns policy</Link> or <Link to="/contact-us" className="underline">contact us</Link> for delivery timelines to your area.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
      <Reviews p={p} />
      <a
        href={`${WHATSAPP_LINK}?text=${encodeURIComponent(`Hi, I'm interested in ${p.name}.`)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chat with RAF Decor on WhatsApp at ${WHATSAPP_DISPLAY_NUMBER}`}
        title={`WhatsApp ${WHATSAPP_DISPLAY_NUMBER}`}
        className="fixed bottom-6 right-5 z-50 inline-flex h-12 items-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#1FB956] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
        data-testid="product-whatsapp-chat"
      >
        <WhatsAppIcon className="h-5 w-5" />
        <span>{WHATSAPP_DISPLAY_NUMBER}</span>
      </a>
      {related && related.length > 0 && (
        <section className="bg-[#F2ECE0] py-16" data-testid="related-products">
          <div className="container-rd text-center">
            <h2 className="mb-10 font-serif text-3xl font-semibold text-[#372318]">You may also like</h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(0,370px))] justify-center gap-x-5 gap-y-12">{related.map((r, i) => <ProductCard key={r.id} p={r} index={i} />)}</div>
          </div>
        </section>
      )}
      {recent && recent.length > 0 && (
        <section className="container-rd py-16 text-center" data-testid="recently-viewed"><h2 className="mb-8 font-serif text-2xl font-semibold text-[#372318]">Recently viewed</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(0,370px))] justify-center gap-x-5 gap-y-12">{recent.map((r, i) => <ProductCard key={r.id} p={r} index={i} />)}</div></section>
      )}
      <InquiryDialog p={p} open={ask} onOpenChange={setAsk} />
    </div>
  );
}
