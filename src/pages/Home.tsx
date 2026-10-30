import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  ArrowRight,
  Leaf,
  Hammer,
  ShieldCheck,
  Truck,
  Banknote,
  Phone,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useSite, useCategories } from '@/context/SiteContext';
import {
  ProductCard,
  ProductGridSkeleton,
} from '@/components/store/ProductCard';
import { ErrorState } from '@/components/common';
import { useSeo } from '@/lib/seo';
import { cldImg } from '@/lib/format';
import type { Product } from '@/types';
import heroPhoto from '@/assets/hero-photo.avif';
import HomeHero from './HomeHero';
import loyaltySignup from '@/assets/loyalty-signup.svg';
import loyaltyCollect from '@/assets/loyalty-collect.svg';
import loyaltyRedeem from '@/assets/loyalty-redeem.svg';

const ICONS = [Leaf, Hammer, ShieldCheck];

function Section({
  eyebrow,
  title,
  link,
  children,
  testId,
}: {
  eyebrow?: string;
  title: string;
  link?: string;
  children: React.ReactNode;
  testId: string;
}) {
  return (
    <section className="bg-[#F2ECE0] py-10 lg:py-24" data-testid={testId}>
      <div className="container-rd">
        <div className="relative mb-10 text-center">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2 className="mx-auto mb-7 mt-3 max-w-lg font-serif text-3xl font-semibold leading-[1.2] tracking-tight text-[#372318] sm:text-4xl lg:text-[2.5rem]">
            {title}
          </h2>
          <div className="mx-auto h-[2px] w-14 bg-[#B07A5B]" />
          {/* {link && (
            <Link
              to={link}
              className="link-underline absolute right-0 top-0.5 hidden text-sm text-[#4E3629] sm:inline-flex"
            >
              View all
            </Link>
          )} */}
        </div>
        {children}

        {link && (
          <div className="mt-14 text-center">
            <Link
              to={link}
              className="inline-flex items-center gap-2 rounded-[4px] border-2 border-[#2C1E18]/50 px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.1em] text-[#2C1E18] transition-all duration-300 hover:border-[#B07A5B] hover:bg-[#B07A5B] hover:text-[#FAF7F2]"
              data-testid={`${testId}-view-all`}
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const site = useSite();
  const s = site.data?.settings;
  const featured = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () =>
      (await api.get('/products', { params: { featured: true, limit: 8 } }))
        .data,
  });
  const best = useQuery({
    queryKey: ['bestsellers'],
    queryFn: async () =>
      (await api.get('/products/bestsellers')).data.items as Product[],
  });
  const sale = useQuery({
    queryKey: ['products', 'sale'],
    queryFn: async () =>
      (await api.get('/products', { params: { on_sale_only: true, limit: 4 } }))
        .data.items as Product[],
  });
  const { data: cats } = useCategories();
  useSeo({ title: undefined, description: s?.seo?.description });
  const products: Product[] = featured.data?.items || [];
  const categoryList = (cats || []).filter(c => c.featured || !c.parent_id);
  const promos = (site.data?.banners || []).filter(
    (b: any) => b.placement === 'promo',
  );
  const reduceMotion = useReducedMotion();
  const pillars = s?.philosophy?.pillars || [];
  const philosophyImgUrl = products.map(p => p.images?.[0]?.url).find(Boolean);
  const philosophyImgSrc = philosophyImgUrl
    ? cldImg(philosophyImgUrl, 800)
    : heroPhoto;
  const philosophyImgRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: philosophyScrollRaw } = useScroll({
    target: philosophyImgRef,
    offset: ['start end', 'end start'],
  });
  const philosophyScroll = useSpring(philosophyScrollRaw, {
    stiffness: 100,
    damping: 30,
    mass: 0.5,
    restDelta: 0.001,
  });
  const philosophyImgY = useTransform(
    philosophyScroll,
    [0, 1],
    reduceMotion ? ['0%', '0%'] : ['-8%', '8%'],
  );
  const philosophyImgScale = useTransform(
    philosophyScroll,
    [0, 0.45],
    reduceMotion ? [1, 1] : [0.72, 1],
  );
  return (
    <div>
      <HomeHero s={s} />

      {(featured.isLoading || featured.isError || products.length > 0) && (
        <Section
          eyebrow={s?.home?.collection_eyebrow}
          title={s?.home?.collection_title || 'Signature collection'}
          link="/shop"
          testId="home-featured"
        >
          {featured.isLoading ? (
            <ProductGridSkeleton />
          ) : featured.isError ? (
            <ErrorState onRetry={() => featured.refetch()} />
          ) : (
            <div className="grid grid-cols-1 gap-x-2 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p, i) => (
                <ProductCard key={p.id} p={p} index={i} />
              ))}
            </div>
          )}
        </Section>
      )}

      <section
        className="relative mt-5 overflow-hidden bg-[#FAF7F2] py-16 lg:py-20"
        data-testid="home-philosophy"
      >
        <div className="container-rd grid items-center gap-14 lg:grid-cols-12 lg:gap-16">
          <motion.div
            className="relative order-2 lg:order-1 lg:col-span-5"
            initial={reduceMotion ? undefined : { opacity: 0 }}
            whileInView={reduceMotion ? undefined : { opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              ref={philosophyImgRef}
              style={{ scale: philosophyImgScale, willChange: 'transform' }}
              className="group relative h-[280px] w-full overflow-hidden rounded-[3px] shadow-[0_35px_70px_-30px_rgba(44,30,24,0.4)] sm:h-[340px] lg:h-[400px]"
            >
              <motion.div
                style={{ y: philosophyImgY, willChange: 'transform' }}
                className="absolute -inset-y-[10%] inset-x-0"
              >
                <img
                  src={philosophyImgSrc}
                  alt="Raf Decor craftsmanship"
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.06]"
                />
              </motion.div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1F1916]/35 via-transparent to-transparent" />
              <div className="pointer-events-none absolute inset-0 opacity-0 ring-1 ring-inset ring-[#FAF7F2]/20 transition-opacity duration-500 group-hover:opacity-100" />
            </motion.div>
          </motion.div>

          <div className="order-1 lg:order-2 lg:col-span-7">
            <motion.div
              className="text-center lg:text-left"
              initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="eyebrow">{s?.philosophy?.eyebrow}</p>
              <h2 className="mx-auto mb-7 mt-3 max-w-lg font-serif text-3xl font-semibold leading-[1.2] tracking-tight text-[#372318] sm:text-4xl lg:mx-0 lg:text-[2.5rem]">
                {s?.philosophy?.title}
              </h2>
              <div className="mx-auto h-[2px] w-14 bg-[#B07A5B] lg:mx-0" />
            </motion.div>

            <div className="mt-11 divide-y divide-[#E6DDD0] border-t border-[#E6DDD0]">
              {pillars.map((p: any, i: number) => {
                const Icon = ICONS[i % 3];
                return (
                  <motion.div
                    key={i}
                    className="group flex items-start gap-6 py-7"
                    initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
                    whileInView={
                      reduceMotion ? undefined : { opacity: 1, y: 0 }
                    }
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{
                      duration: 0.7,
                      delay: 0.1 + i * 0.12,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <span className="font-serif text-sm text-[#B07A5B]/60 transition-colors duration-300 group-hover:text-[#B07A5B]">
                      0{i + 1}
                    </span>
                    <Icon
                      className="mt-0.5 h-5 w-5 shrink-0 text-[#B07A5B] transition-transform duration-500 ease-out group-hover:rotate-[8deg] group-hover:scale-110"
                      strokeWidth={1.5}
                    />
                    <div className="flex-1">
                      <h3 className="relative inline-block font-bn text-lg font-medium text-[#2C1E18] after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-[#B07A5B] after:transition-transform after:duration-500 after:ease-out group-hover:after:scale-x-100">
                        {p.title}
                      </h3>
                      <p className="mt-2 font-bn text-sm leading-[1.85] text-[#7A6960] transition-transform duration-500 ease-out group-hover:translate-x-1">
                        {p.body}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {categoryList.length > 0 && (
        <section
          className="bg-[#FAF7F2] py-16 lg:py-24"
          data-testid="home-categories"
        >
          <div className="container-rd">
            <motion.div
              className="relative mb-12 text-center"
              initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.6 }}
            >
              <p className="eyebrow">Shop by category</p>
              <h2 className="mx-auto mb-7 mt-3 max-w-lg font-serif text-3xl font-semibold leading-[1.2] tracking-tight text-[#372318] sm:text-4xl lg:text-[2.5rem]">
                Curated by Craft
              </h2>
              <div className="mx-auto h-[2px] w-14 bg-[#B07A5B]" />
            </motion.div>

            {categoryList.length === 1 ? (
              (() => {
                const c = categoryList[0];
                const img =
                  c.image ||
                  products.find(p => p.category_ids.includes(c.id))?.images?.[0]
                    ?.url;
                return (
                  <motion.div
                    initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
                    whileInView={
                      reduceMotion ? undefined : { opacity: 1, y: 0 }
                    }
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{
                      duration: 0.7,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <Link
                      to={`/product-category/${c.slug}`}
                      className="group relative flex min-h-[320px] items-end overflow-hidden rounded-2xl bg-[#1F1916] shadow-[0_18px_40px_rgba(44,30,24,0.14)] ring-1 ring-[#2C1E18]/5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_56px_rgba(44,30,24,0.22)] sm:min-h-[380px] lg:min-h-[440px]"
                      data-testid={`home-category-${c.slug}`}
                    >
                      {img && (
                        <img
                          src={cldImg(img, 1600)}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          loading="lazy"
                        />
                      )}
                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,rgba(31,25,22,0.92)_0%,rgba(31,25,22,0.45)_45%,rgba(31,25,22,0.1)_100%)]" />
                      <div className="relative flex w-full flex-col gap-5 p-8 sm:max-w-md sm:p-12 lg:p-16">
                        <p className="eyebrow !text-[#D9A066]">
                          Featured category
                        </p>
                        <h3 className="font-serif text-3xl leading-[1.15] text-[#FAF7F2] sm:text-4xl">
                          {c.name}
                        </h3>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#F2ECE0]/75">
                          {c.product_count} pieces
                        </p>
                        <span className="inline-flex w-fit items-center gap-2 rounded-[4px] bg-[#B07A5B] px-7 py-3 text-sm font-semibold uppercase tracking-wide text-[#FAF7F2] transition-colors duration-200 group-hover:bg-[#9c6a4e]">
                          Explore collection
                          <ArrowRight
                            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                            strokeWidth={2.25}
                          />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })()
            ) : (
              <div
                className={`grid gap-6 sm:grid-cols-2 ${categoryList.length >= 3 ? 'lg:grid-cols-3' : ''}`}
              >
                {categoryList.map((c, i) => {
                  const img =
                    c.image ||
                    products.find(p => p.category_ids.includes(c.id))
                      ?.images?.[0]?.url;
                  return (
                    <motion.div
                      key={c.id}
                      initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
                      whileInView={
                        reduceMotion ? undefined : { opacity: 1, y: 0 }
                      }
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{
                        duration: 0.65,
                        delay: 0.08 * (i % 3),
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <Link
                        to={`/product-category/${c.slug}`}
                        className="group relative block overflow-hidden rounded-2xl bg-[#1F1916] shadow-[0_18px_40px_rgba(44,30,24,0.14)] ring-1 ring-[#2C1E18]/5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_56px_rgba(44,30,24,0.22)]"
                        data-testid={`home-category-${c.slug}`}
                      >
                        <div className="aspect-[4/3] overflow-hidden">
                          {img && (
                            <img
                              src={cldImg(img, 900)}
                              alt=""
                              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                              loading="lazy"
                            />
                          )}
                        </div>
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1F1916] via-[#1F1916]/25 to-transparent" />
                        <div className="absolute inset-0 flex flex-col justify-end p-6">
                          <h3 className="font-serif text-2xl text-[#FAF7F2]">
                            {c.name}
                          </h3>
                          <div className="mt-3 flex items-center justify-between">
                            <p className="text-xs uppercase tracking-[0.2em] text-[#F2ECE0]/75">
                              {c.product_count} pieces
                            </p>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#FAF7F2]/30 text-[#FAF7F2] transition-colors duration-300 group-hover:border-[#B07A5B] group-hover:bg-[#B07A5B]">
                              <ArrowRight
                                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                                strokeWidth={2}
                              />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* {best.data && best.data.length > 0 && (
        <Section
          eyebrow="Customer favourites"
          title="Bestsellers"
          link="/shop?sort=popular"
          testId="home-bestsellers"
        >
          <div className="grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {best.data.map((p, i) => (
              <ProductCard key={p.id} p={p} index={i} />
            ))}
          </div>
        </Section>
      )} */}

      {sale.data && sale.data.length > 0 && (
        <Section
          eyebrow="Limited time"
          title="On sale"
          link="/shop?on_sale_only=true"
          testId="home-sale"
        >
          <div className="grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {sale.data.map((p, i) => (
              <ProductCard key={p.id} p={p} index={i} />
            ))}
          </div>
        </Section>
      )}
      <section
        className="relative overflow-hidden bg-[#1F1916] py-12 lg:py-16 grain "
        data-testid="home-service"
      >
        <div className="container-rd">
          <div className="grid divide-y divide-[#FAF7F2]/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              [
                Banknote,
                'Cash on delivery',
                'Pay when your order arrives, or by direct bank transfer.',
              ],
              [
                Truck,
                'Delivery across Bangladesh',
                'Delivery charge is shown on each product and at checkout.',
              ],
              [
                Phone,
                'Talk to us',
                `${s?.contact?.phone_display || ''} · ${s?.contact?.hours || ''}`,
              ],
            ].map(([Icon, t, b]: any, i: number) => (
              <motion.div
                key={t}
                className="group flex items-center gap-5 py-7 first:pt-0 last:pb-0 sm:px-9 sm:py-10 sm:first:pl-0 sm:last:pr-0"
                initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  duration: 0.6,
                  delay: 0.1 * i,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Icon
                  className="h-7 w-7 shrink-0 text-[#B07A5B] transition-transform duration-300 group-hover:scale-110"
                  strokeWidth={1.5}
                />
                <div>
                  <h3 className="font-serif text-base text-[#FAF7F2] sm:text-lg">
                    {t}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#D8CCBC]">
                    {b}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* {promos.map((b: any) => (
        <section
          key={b.id}
          className="container-rd py-10"
          data-testid={`promo-banner-${b.id}`}
        >
          <Link
            to={b.link}
            className="group grid overflow-hidden bg-[#2C1E18] text-[#FAF7F2] md:grid-cols-2"
          >
            <div className="flex flex-col justify-center p-10 lg:p-16">
              <h3 className="font-serif text-3xl">{b.title}</h3>
              <p className="mt-3 text-[#D8CCBC]">{b.subtitle}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-[#B07A5B]">
                {b.cta} <ArrowRight className="h-4 w-4" />
              </span>
            </div>
            <img
              src={cldImg(b.image, 1000)}
              alt=""
              className="h-full max-h-[420px] w-full object-cover"
            />
          </Link>
        </section>
      ))} */}

      <section
        className="bg-[#F2ECE0] py-16 lg:py-24"
        data-testid="home-loyalty"
      >
        <div className="container-rd">
          <motion.div
            className="relative mb-14 text-center"
            initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6 }}
          >
            <p className="eyebrow">Loyalty program</p>
            <h2 className="mx-auto mb-7 mt-3 max-w-lg font-serif text-3xl font-semibold leading-[1.2] tracking-tight text-[#372318] sm:text-4xl lg:text-[2.5rem]">
              Raf Rewards
            </h2>
            <div className="mx-auto h-[2px] w-14 bg-[#B07A5B]" />
          </motion.div>

          <div className="grid gap-12 sm:grid-cols-3 sm:gap-6">
            {[
              [
                loyaltySignup,
                'Sign Up',
                'Create your free account and earn 500 points instantly on your first sign-in.',
              ],
              [
                loyaltyCollect,
                'Collect',
                'Shop more to earn more points — every handcrafted piece brings you closer to a reward.',
              ],
              [
                loyaltyRedeem,
                'Redeem',
                'Unlock exclusive discounts, early access, and special perks reserved for members.',
              ],
            ].map(([src, t, b]: any, i: number) => (
              <motion.div
                key={t}
                className="relative flex flex-col items-center text-center"
                initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  duration: 0.65,
                  delay: 0.12 * i,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div className="relative z-10 flex h-[152px] items-center justify-center">
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    className="h-full w-auto max-w-[220px] object-contain"
                  />
                </div>
                <h3 className="mt-5 font-serif text-xl text-[#2C1E18]">{t}</h3>
                <p className="mt-2 max-w-[240px] text-sm leading-relaxed text-[#7A6960]">
                  {b}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-14 text-center"
            initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link
              to="/login"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#B07A5B] px-9 text-sm font-semibold uppercase tracking-[0.12em] text-[#FAF7F2] transition-colors duration-200 hover:bg-[#9c6a4e]"
              data-testid="home-loyalty-btn"
            >
              Join Raf Rewards <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="container-rd" data-testid="home-cta">
        <motion.div
          className="grid overflow-hidden rounded-[3px] shadow-[0_24px_56px_rgba(44,30,24,0.18)] lg:grid-cols-2 mt-16"
          initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative h-[260px] sm:h-[340px] lg:h-auto">
            <img
              src={heroPhoto}
              alt="Elegant living room styled with Raf Decor furniture"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="relative flex flex-col justify-center bg-[#4E3629] px-8 py-14 text-[#FAF7F2] grain sm:px-12 lg:px-16">
            <h2 className="max-w-xl font-serif text-3xl leading-snug sm:text-4xl">
              {s?.home?.cta_title}
            </h2>
            <p className="mt-5 max-w-xl font-bn leading-relaxed text-[#E6DDD0]">
              {s?.home?.cta_body}
            </p>
            <Link
              to="/shop"
              className="mt-9 inline-flex h-12 w-fit items-center gap-2 border border-[#FAF7F2]/40 px-7 text-sm font-medium uppercase tracking-[0.15em] text-[#FAF7F2] transition-colors duration-200 hover:border-[#FAF7F2] hover:bg-[#FAF7F2]/10"
              data-testid="home-cta-btn"
            >
              {s?.home?.cta_label} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
