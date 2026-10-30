import { Link } from 'react-router-dom';
import { ArrowRight, Heart } from 'lucide-react';
import { Price } from '@/components/common';
import { cldImg } from '@/lib/format';
import { useWishlist } from '@/context/SiteContext';
import type { Product } from '@/types';

export function ProductCard({ p, index = 0 }: { p: Product; index?: number }) {
  const wl = useWishlist();
  const img = p.images?.[0]?.url;
  const alt = p.images?.[1]?.url;
  const regular = p.variants.length ? undefined : p.price;
  const href = `/product/${p.slug}`;
  return (
    <article
      className="group flex h-full flex-col"
      data-testid={`product-card-${p.slug}`}
    >
      <div className="mx-auto flex h-full w-full max-w-[370px] flex-col rounded-xl bg-white p-4 shadow-[0_6px_24px_rgba(44,30,24,0.08)] ring-1 ring-[#2C1E18]/5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_52px_rgba(44,30,24,0.16)]">
        <div className="relative overflow-hidden rounded-xl bg-[#F2ECE0]">
          <Link
            to={href}
            aria-label={p.name}
            data-testid={`product-card-link-${p.slug}`}
          >
            <div className="aspect-[6/5]">
              <img
                src={cldImg(img, 700)}
                alt={p.images?.[0]?.alt || p.name}
                loading="lazy"
                className="h-full w-full object-cover transition-[transform,opacity] duration-700 ease-out group-hover:scale-[1.06]"
              />
              {alt && (
                <img
                  src={cldImg(alt, 700)}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                />
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1F1916]/12 via-transparent to-transparent" />
            </div>
          </Link>
          <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col gap-1.5">
            {p.on_sale && (
              <span className="rounded-[3px] bg-[#4E3629] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#FAF7F2]">
                Sale
              </span>
            )}
            {!p.in_stock && (
              <span className="rounded-[3px] bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2C1E18]">
                Out of stock
              </span>
            )}
            {p.low_stock && (
              <span className="rounded-[3px] bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B07A5B]">
                Only {p.available} left
              </span>
            )}
          </div>
          <button
            onClick={() => wl.toggle(p.id)}
            aria-label={
              wl.has(p.id) ? 'Remove from wishlist' : 'Save to wishlist'
            }
            data-testid={`wishlist-toggle-${p.slug}`}
            className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#FAF7F2]/90 shadow-sm backdrop-blur transition-colors hover:bg-white"
          >
            <Heart
              className={`h-4 w-4 ${wl.has(p.id) ? 'fill-[#B07A5B] text-[#B07A5B]' : 'text-[#4E3629]'}`}
            />
          </button>
        </div>
        <div className="flex flex-1 flex-col items-center px-1 pb-1 pt-4 text-center">
          <Link to={href} className="block">
            <h3 className="font-serif text-[17px] leading-snug text-[#2C1E18] transition-colors group-hover:text-[#4E3629]">
              {p.name}
            </h3>
          </Link>
          {p.variants.length > 0 && (
            <p className="mt-1 text-xs text-[#7A6960]">
              {p.variants.length} options
            </p>
          )}
          <Price
            price={p.price_min}
            max={p.price_max}
            regular={p.on_sale ? regular : undefined}
            className="mt-1.5 justify-center text-base font-semibold"
          />
          <Link
            to={href}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[4px] bg-[#B07A5B] py-2.5 text-sm font-semibold tracking-wide text-[#FAF7F2] transition-colors duration-200 hover:bg-[#9c6a4e]"
            data-testid={`product-card-cta-${p.slug}`}
          >
            অর্ডার করুন{' '}
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
              strokeWidth={2.25}
            />
          </Link>
        </div>
      </div>
    </article>
  );
}

export const ProductGridSkeleton = ({
  n,
  cols = 3,
}: {
  n?: number;
  cols?: 3 | 4;
}) => (
  <div
    className={`grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 ${cols === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}
  >
    {Array.from({ length: n ?? cols }).map((_, i) => (
      <div
        key={i}
        className="mx-auto w-full max-w-[370px] rounded-xl bg-white p-4 shadow-[0_6px_24px_rgba(44,30,24,0.08)]"
      >
        <div className="aspect-[6/5] animate-pulse rounded-xl bg-[#EFE7DA]" />
        <div className="mt-4 flex flex-col items-center gap-2 pb-1">
          <div className="h-4 w-2/3 animate-pulse rounded bg-[#EFE7DA]" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-[#EFE7DA]" />
          <div className="mt-2 h-9 w-full animate-pulse rounded-[4px] bg-[#EFE7DA]" />
        </div>
      </div>
    ))}
  </div>
);
