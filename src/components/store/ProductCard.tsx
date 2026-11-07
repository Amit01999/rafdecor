import { Link } from 'react-router-dom';
import { ArrowRight, Heart } from 'lucide-react';
import { Price } from '@/components/common';
import { cldImg } from '@/lib/format';
import { useWishlist } from '@/context/SiteContext';
import type { Product } from '@/types';

export function ProductCard({
  p,
  index = 0,
  compactMobile = false,
}: {
  p: Product;
  index?: number;
  compactMobile?: boolean;
}) {
  const wl = useWishlist();
  const img = p.images?.[0]?.url;
  const alt = p.images?.[1]?.url;
  const regular = p.variants.length ? undefined : p.price;
  const href = `/product/${p.slug}`;
  const badge = compactMobile
    ? ' max-sm:max-w-[calc(100%-1.35rem)] max-sm:px-1 max-sm:py-px max-sm:text-[8px] max-sm:leading-tight max-sm:tracking-normal'
    : '';
  return (
    <article
      className={`group flex h-full flex-col${compactMobile ? ' max-sm:min-w-0' : ''}`}
      data-testid={`product-card-${p.slug}`}
    >
      <div
        className={`mx-auto flex h-full w-full max-w-[370px] flex-col rounded-xl bg-white p-4 shadow-[0_6px_24px_rgba(44,30,24,0.08)] ring-1 ring-[#2C1E18]/5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_52px_rgba(44,30,24,0.16)]${
          compactMobile
            ? ' max-sm:max-w-none max-sm:rounded-md max-sm:p-3 max-sm:shadow-[0_3px_10px_rgba(44,30,24,0.08)] max-sm:hover:!translate-y-0 max-sm:hover:!shadow-[0_6px_14px_rgba(44,30,24,0.12)]'
            : ''
        }`}
      >
        <div
          className={`relative overflow-hidden rounded-xl bg-[#F2ECE0]${
            compactMobile ? ' max-sm:rounded-md' : ''
          }`}
        >
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
          <div
            className={`pointer-events-none absolute left-2.5 top-2.5 flex flex-col gap-1.5${
              compactMobile ? ' max-sm:left-1 max-sm:top-1 max-sm:gap-0.5' : ''
            }`}
          >
            {p.on_sale && (
              <span
                className={`rounded-[3px] bg-[#4E3629] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#FAF7F2]${badge}`}
              >
                Sale
              </span>
            )}
            {!p.in_stock && (
              <span
                className={`rounded-[3px] bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2C1E18]${badge}`}
              >
                Out of stock
              </span>
            )}
            {p.low_stock && (
              <span
                className={`rounded-[3px] bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B07A5B]${badge}`}
              >
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
            className={`absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#FAF7F2]/90 shadow-sm backdrop-blur transition-colors hover:bg-white${
              compactMobile
                ? ' max-sm:right-1 max-sm:top-1 max-sm:h-5 max-sm:w-5'
                : ''
            }`}
          >
            <Heart
              className={`h-4 w-4 ${wl.has(p.id) ? 'fill-[#B07A5B] text-[#B07A5B]' : 'text-[#4E3629]'}${
                compactMobile ? ' max-sm:h-2.5 max-sm:w-2.5' : ''
              }`}
            />
          </button>
        </div>
        <div
          className={`flex flex-1 flex-col items-center px-1 pb-1 pt-4 text-center${
            compactMobile ? ' max-sm:px-0 max-sm:pb-0.5 max-sm:pt-1.5' : ''
          }`}
        >
          <Link
            to={href}
            className={`block${compactMobile ? ' max-sm:w-full max-sm:min-w-0' : ''}`}
          >
            <h3
              className={`font-serif text-[17px] leading-snug text-[#2C1E18] transition-colors group-hover:text-[#4E3629]${
                compactMobile
                  ? ' max-sm:line-clamp-2 max-sm:min-h-[2.3em] max-sm:break-words max-sm:text-[11px] max-sm:leading-[1.15]'
                  : ''
              }`}
            >
              {p.name}
            </h3>
          </Link>
          {p.variants.length > 0 && (
            <p
              className={`mt-1 text-xs text-[#7A6960]${
                compactMobile
                  ? ' max-sm:mt-0.5 max-sm:text-[9px] max-sm:leading-tight'
                  : ''
              }`}
            >
              {p.variants.length} options
            </p>
          )}
          <Price
            price={p.price_min}
            max={p.price_max}
            regular={p.on_sale ? regular : undefined}
            className={`mt-1.5 justify-center text-base font-semibold${
              compactMobile
                ? ' max-sm:mt-1 max-sm:min-h-[2.15em] max-sm:flex-wrap max-sm:justify-center max-sm:!gap-x-1 max-sm:!text-[11px] max-sm:leading-tight max-sm:[&>span]:!text-[11px] max-sm:[&>span]:!leading-tight max-sm:[&>span.line-through]:!text-[9px]'
                : ''
            }`}
          />
          <Link
            to={href}
            className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[4px] bg-[#B07A5B] py-2.5 text-sm font-semibold tracking-wide text-[#FAF7F2] transition-colors duration-200 hover:bg-[#9c6a4e]${
              compactMobile
                ? ' max-sm:mt-auto max-sm:gap-0.5 max-sm:px-0.5 max-sm:py-1 max-sm:text-[9px] max-sm:leading-tight max-sm:tracking-normal'
                : ''
            }`}
            data-testid={`product-card-cta-${p.slug}`}
          >
            অর্ডার করুন{' '}
            <ArrowRight
              className={`h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5${
                compactMobile
                  ? ' max-sm:h-2.5 max-sm:w-2.5 max-sm:shrink-0'
                  : ''
              }`}
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
  compactMobile = false,
}: {
  n?: number;
  cols?: 3 | 4;
  compactMobile?: boolean;
}) => (
  <div
    className={`grid gap-x-5 gap-y-10 sm:grid-cols-2 ${cols === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} ${
      compactMobile
        ? 'grid-cols-2 gap-x-1.5 gap-y-3 sm:gap-x-5 sm:gap-y-10'
        : 'grid-cols-2'
    }`}
  >
    {Array.from({ length: n ?? cols }).map((_, i) => (
      <div
        key={i}
        className={`mx-auto w-full min-w-0 max-w-[370px] rounded-xl bg-white p-4 shadow-[0_6px_24px_rgba(44,30,24,0.08)]${
          compactMobile ? ' max-sm:rounded-md max-sm:p-1' : ''
        }`}
      >
        <div
          className={`aspect-[6/5] animate-pulse rounded-xl bg-[#EFE7DA]${
            compactMobile ? ' max-sm:rounded-md' : ''
          }`}
        />
        <div
          className={`mt-4 flex flex-col items-center gap-2 pb-1${
            compactMobile ? ' max-sm:mt-1.5 max-sm:gap-1' : ''
          }`}
        >
          <div className="h-4 w-2/3 animate-pulse rounded bg-[#EFE7DA]" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-[#EFE7DA]" />
          <div
            className={`mt-2 h-9 w-full animate-pulse rounded-[4px] bg-[#EFE7DA]${
              compactMobile ? ' max-sm:mt-1 max-sm:h-6' : ''
            }`}
          />
        </div>
      </div>
    ))}
  </div>
);
