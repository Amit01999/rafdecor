import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
// Each product ships a mobile-capped (long edge 1000px) and a desktop-capped
// (long edge 1920px) JPEG, re-encoded from the original source images (one of
// which was an unoptimized 2.5MB PNG). Rendered via srcSet/sizes below so a
// phone never downloads and decodes a desktop-resolution image.
import stoolImageSm from '@/assets/hero/1.stool-sm.jpg';
import stoolImageLg from '@/assets/hero/1.stool-lg.jpg';
import neutralTableImageSm from '@/assets/hero/2.tabe-sm.jpg';
import neutralTableImageLg from '@/assets/hero/2.tabe-lg.jpg';
import woodenJarsImageSm from '@/assets/hero/3.ruti-sm.jpg';
import woodenJarsImageLg from '@/assets/hero/3.ruti-lg.jpg';
import fruitBowlImageLg from '@/assets/hero/4.bowa-lg.jpg';

const HERO_PRODUCTS = [
  {
    id: 'natural-wood-stool',
    label: '01 / Stool',
    category: 'Minimalist',
    title: 'Natural Wood Stool',
    titleLines: ['NATURAL', 'WOOD STOOL'],
    description:
      'A clean-lined Shishu wood stool with a naturally grained round seat, made to bring a warm, useful accent to living spaces and work corners.',
    details: 'Premium Shishu wood · 14″ × 14″ top · 18″ height',
    image: stoolImageLg,
    imageSrcSet: `${stoolImageSm} 750w, ${stoolImageLg} 1086w`,
    imageAlt: 'Handcrafted dark wooden eco stools in a warm interior',
    imagePosition: 'center 76%',
    href: '/product/natural-shishu-wood-stool',
    cta: 'Explore stool',
  },
  {
    id: 'wooden-round-table',
    label: '02 / Round Table',
    category: 'Wooden',
    title: 'Wooden Round Table',
    titleLines: ['WOODEN', 'ROUND TABLE'],
    description:
      'A live-edge Raintree tabletop brings rich natural grain into a calm, neutral interior, balanced by slender black iron legs.',
    details: 'Raintree wood · Live edge · Iron legs',
    image: neutralTableImageLg,
    imageSrcSet: `${neutralTableImageSm} 707w, ${neutralTableImageLg} 1357w`,
    imageAlt: 'Live-edge Raintree wood center table with black iron legs',
    imagePosition: 'center 70%',
    href: '/product/wooden-round-table',
    cta: 'Explore table',
  },
  {
    id: 'mahogany-wooden-roti-pot',
    label: '03 / Wooden Roti Pot',
    category: 'Handcrafted',
    title: 'Wooden Roti Pot — Mahogany Wood',
    titleLines: ['WOODEN', 'ROTI POT'],
    description:
      'A handcrafted mahogany wooden roti pot with natural wood grain, designed to bring warmth and elegance to everyday food presentation.',
    details: 'Mahogany wood · 10-inch outer diameter · 3-inch height',
    image: woodenJarsImageLg,
    imageSrcSet: `${woodenJarsImageSm} 1000w, ${woodenJarsImageLg} 1448w`,
    imageAlt: 'Three handcrafted wooden spice jars displayed on a stone tray',
    imagePosition: 'center 56%',
    href: '/product/mahogany-wooden-roti-pot',
    cta: 'Explore spice box',
  },
  {
    id: 'premium-wooden-fruit-bowl',
    label: '04 / Fruit bowl',
    category: 'Premium',
    title: 'Premium wooden fruit bowl',
    titleLines: ['FRUIT', 'BOWL'],
    description:
      'A sculptural wooden fruit bowl with distinctive natural grain, bringing a warm, crafted focal point to the kitchen or dining table.',
    details: 'Natural wood · Fruit serving · Tabletop display',
    image: fruitBowlImageLg,
    imageSrcSet: undefined,
    imageAlt:
      'Premium wooden fruit bowl styled with fresh fruit in a bright kitchen',
    imagePosition: 'center 62%',
    href: '/product/premium-wooden-sishu-fruit-bowl',
    cta: 'Explore fruit bowl',
  },
] as const;

const HERO_INTERVAL_MS = 4700;

// Premium, unhurried pacing: image and text each take ~2 seconds per leg
// (entrance, exit), moving at a coordinated but independent pace. The JS swap
// timer below covers whichever element finishes last across the whole
// transition — no longer just the image alone, since text can now legitimately
// take just as long.
const HERO_IMAGE_DURATION_MS = 1700; // 1.7s — slightly quicker than the prior 2.0s
const HERO_IMAGE_DELAY_MS = 0;

// This project uses Framer Motion (no GSAP dependency), so these are the
// closest cubic-bezier equivalents to the requested GSAP eases, chosen per
// animation rather than reused everywhere:
// power4/expo-style curves are very steep in the middle of their range — over
// a full 100%-width, 2-second glide that reads as "slow… slow… SNAP… slow",
// not smooth. Sine is the gentlest ease-in-out in the standard family: no
// sudden mid-animation rush, just a continuously, evenly changing velocity —
// this is what actually reads as a smooth cinematic glide at this duration.
const HERO_IMAGE_EASE = [0.37, 0, 0.63, 1] as const; // sine.inOut
const HERO_TEXT_EASE = [0.65, 0, 0.35, 1] as const; // power3.inOut — the general, unhurried pace for every text line
// expo.inOut is slow at both ends but rushes through its middle — used only
// for the eyebrow/footer/secondary-link exit (see note below), so that brief
// middle rush still clears the center quickly without the enter/exit edges
// feeling abrupt.
const HERO_TEXT_PROTECTED_EXIT_EASE = [0.87, 0, 0.13, 1] as const; // expo.inOut

// Secondary, subtle parallax: the product photo itself scales gently within its
// frame, independent of (and much smaller than) the image's own translation.
const HERO_IMAGE_SCALE_IN = 1.03;
const HERO_IMAGE_SCALE_OUT = 1.025;

// Text physically crosses the whole hero section — starting/ending fully
// outside the viewport, the same kind of journey as the image, not a small
// in-place nudge. Each line travels this same distance; only the delay below
// varies per line, since that's what creates the staggered, independent feel.
const HERO_TEXT_ENTER_X = '100vw';
const HERO_TEXT_EXIT_X = '-100vw';
const HERO_TEXT_ENTER_DURATION_MS = 1800; // 1.8s — within the 1.6–2.0s reference range
const HERO_TEXT_EXIT_DURATION_MS = 2000; // 2.0s — deliberately unhurried; this was the "too fast" complaint

// The very first slide (product index 0) gets a distinct, cinematic entrance
// instead of the cross-screen sweep used everywhere else: a plain, subtle
// opacity reveal paired with a gentle upward drift — no scale, no bounce,
// nothing "flashy" — so the opening impression reads as calm and considered.
// Its exit (when moving on to the next slide) is untouched and still uses the
// shared sweep above, like every other slide.
// 18px combined with the old expo.out curve (very steep deceleration) meant
// most of the frames near the end moved well under a device pixel, which
// reads as jitter rather than smooth motion — especially on text. A slightly
// larger distance plus a gentler, more even cubic easeOut keeps every frame's
// delta large enough to render cleanly.
const HERO_FIRST_ENTER_Y = 24; // px — a gentle upward drift, not a sweep
const HERO_FIRST_ENTER_DURATION_MS = 1300;
const HERO_FIRST_ENTER_EASE = [0.33, 1, 0.68, 1] as const; // cubic easeOut — even deceleration, no micro-stutter tail
// Stretches the shared stagger pattern (same relative order as every other
// slide's entrance) into a slower, more deliberate cascade, befitting the
// slower fade rather than the quick cross-screen sweep.
const HERO_FIRST_ENTER_STAGGER_MULTIPLIER = 2.5;

// The eyebrow, footer URL and secondary "view collection" link carry identical
// copy on every product. With every line now taking 1.8–2.0s to cross the
// screen, an outgoing and incoming instance of the SAME text would otherwise
// both still be near center at once and double-expose into a ghosted overlap
// — unlike the other lines, whose text differs per product, where that overlap
// just reads as a natural blend. These three keep a much shorter, dedicated
// exit so the old instance is fully clear before the new one arrives, while
// still staying smooth (not abrupt) via the expo.inOut curve above.
const HERO_EXIT_PROTECTED_DURATION_MS = 1000;

// Entrance: the image leads at 0s. Delays are intentionally close together —
// each line's own long, slow glide is what creates the unhurried feel, not
// wide gaps between when they start — with eyebrow/category first, then the
// heading, then description, then CTA last.
const HERO_ENTER_EYEBROW_DELAY_MS = 0;
const HERO_ENTER_CATEGORY_DELAY_MS = 50;
const HERO_ENTER_HEADING_DELAY_MS = 110;
const HERO_ENTER_DESCRIPTION_DELAY_MS = 190;
const HERO_ENTER_DETAILS_DELAY_MS = 220;
const HERO_ENTER_CTA_DELAY_MS = 260;
const HERO_ENTER_CTA2_DELAY_MS = 300;
const HERO_ENTER_FOOTER_DELAY_MS = 280;

// Exit: the image leads the departure too; text follows in the same relative
// order, with the same tight, close-together stagger as the entrance.
const HERO_EXIT_EYEBROW_DELAY_MS = 0;
const HERO_EXIT_CATEGORY_DELAY_MS = 40;
const HERO_EXIT_HEADING_DELAY_MS = 90;
const HERO_EXIT_DESCRIPTION_DELAY_MS = 160;
const HERO_EXIT_DETAILS_DELAY_MS = 190;
const HERO_EXIT_CTA_DELAY_MS = 230;
const HERO_EXIT_CTA2_DELAY_MS = 270;
const HERO_EXIT_FOOTER_DELAY_MS = 250;

// Covers the slowest element across the whole transition: the primary CTA's
// exit (230ms delay + 2000ms duration = 2230ms), with a small safety margin.
const HERO_TRANSITION_MS = 2250;

type HeroProduct = (typeof HERO_PRODUCTS)[number];
type HeroCopyMode = 'active' | 'incoming' | 'outgoing';

function ProductCopy({
  product,
  mode,
  collectionLink,
  collectionLabel,
  reduceMotion,
  initialReveal = false,
}: {
  product: HeroProduct;
  mode: HeroCopyMode;
  collectionLink: string;
  collectionLabel: string;
  reduceMotion: boolean;
  initialReveal?: boolean;
}) {
  const entering = mode === 'incoming' || initialReveal;
  const leaving = mode === 'outgoing';
  // The very first slide gets a distinct entrance (see HERO_FIRST_ENTER_*
  // above) instead of the cross-screen sweep; its exit is unaffected.
  const isFirstSlide = product.id === HERO_PRODUCTS[0].id;
  const firstEntering = isFirstSlide && entering && !reduceMotion;
  // Each line physically crosses the hero section on its own: starts/ends fully
  // outside the viewport (HERO_TEXT_ENTER_X / HERO_TEXT_EXIT_X), with no shared
  // parent transform between lines or with the image. The image (in
  // renderSlide) leads; every line here follows on its own independent delay.
  const lineMotion = (
    enterDelayMs: number,
    exitDelayMs: number,
    exitDurationMs: number = HERO_TEXT_EXIT_DURATION_MS,
    exitEase: readonly [number, number, number, number] = HERO_TEXT_EASE,
  ) => ({
    initial:
      !reduceMotion && entering
        ? firstEntering
          ? { opacity: 0, x: 0, y: HERO_FIRST_ENTER_Y }
          : { opacity: 0, x: HERO_TEXT_ENTER_X }
        : false,
    animate:
      !reduceMotion && leaving
        ? { opacity: 0, x: HERO_TEXT_EXIT_X }
        : firstEntering
          ? { opacity: 1, x: 0, y: 0 }
          : { opacity: 1, x: 0 },
    transition:
      !reduceMotion && leaving
        ? {
            duration: exitDurationMs / 1000,
            delay: exitDelayMs / 1000,
            ease: exitEase,
          }
        : {
            duration: reduceMotion
              ? 0
              : (firstEntering
                  ? HERO_FIRST_ENTER_DURATION_MS
                  : HERO_TEXT_ENTER_DURATION_MS) / 1000,
            delay: reduceMotion
              ? 0
              : entering
                ? ((firstEntering
                    ? enterDelayMs * HERO_FIRST_ENTER_STAGGER_MULTIPLIER
                    : enterDelayMs) /
                    1000)
                : 0,
            ease: firstEntering ? HERO_FIRST_ENTER_EASE : HERO_TEXT_EASE,
          },
    // Promotes the element to its own GPU layer before the animation starts
    // (matching the image's own willChange below) — without this, a transform
    // animation that begins immediately on mount can visibly stutter on its
    // first frames while the browser promotes the layer mid-animation.
    style: firstEntering ? { willChange: 'opacity, transform' } : undefined,
  });
  // Same full-width crossing as lineMotion, with a small extra stagger between
  // the headline's own lines (e.g. two-line titles reveal top line first).
  const titleMotion = (index: number) => ({
    initial:
      !reduceMotion && entering
        ? firstEntering
          ? { opacity: 0, x: 0, y: HERO_FIRST_ENTER_Y }
          : { opacity: 0, x: HERO_TEXT_ENTER_X }
        : false,
    animate:
      !reduceMotion && leaving
        ? { opacity: 0, x: HERO_TEXT_EXIT_X }
        : firstEntering
          ? { opacity: 1, x: 0, y: 0 }
          : { opacity: 1, x: 0 },
    transition:
      !reduceMotion && leaving
        ? {
            duration: HERO_TEXT_EXIT_DURATION_MS / 1000,
            delay: (HERO_EXIT_HEADING_DELAY_MS + index * 50) / 1000,
            ease: HERO_TEXT_EASE,
          }
        : {
            duration: reduceMotion
              ? 0
              : (firstEntering
                  ? HERO_FIRST_ENTER_DURATION_MS
                  : HERO_TEXT_ENTER_DURATION_MS) / 1000,
            delay: reduceMotion
              ? 0
              : entering
                ? ((firstEntering
                    ? (HERO_ENTER_HEADING_DELAY_MS + index * 60) *
                      HERO_FIRST_ENTER_STAGGER_MULTIPLIER
                    : HERO_ENTER_HEADING_DELAY_MS + index * 60) /
                    1000)
                : 0,
            ease: firstEntering ? HERO_FIRST_ENTER_EASE : HERO_TEXT_EASE,
          },
    style: firstEntering ? { willChange: 'opacity, transform' } : undefined,
  });

  return (
    <div
      className={`absolute inset-0 ${mode === 'active' ? '' : 'pointer-events-none'}`}
      aria-hidden={leaving || undefined}
    >
      <div className="container-rd relative flex min-h-[100svh] justify-center pb-[138px] pt-14 text-center sm:pt-16 lg:pb-28">
        <div className="mx-auto w-full max-w-[880px]">
          <motion.p
            {...lineMotion(
              HERO_ENTER_EYEBROW_DELAY_MS,
              HERO_EXIT_EYEBROW_DELAY_MS,
              HERO_EXIT_PROTECTED_DURATION_MS,
              HERO_TEXT_PROTECTED_EXIT_EASE,
            )}
            className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#FAF7F2]/90 drop-shadow-sm sm:text-xs "
          >
            RAF Decor &amp; Living
          </motion.p>
          <motion.p
            {...lineMotion(
              HERO_ENTER_CATEGORY_DELAY_MS,
              HERO_EXIT_CATEGORY_DELAY_MS,
            )}
            className="mt-6 font-sans text-lg font-light tracking-[0.22em] text-[#E3B391] drop-shadow-sm sm:text-2xl lg:text-[1.7rem]"
          >
            {product.category}
          </motion.p>
          <motion.h1 className="mx-auto mt-1 max-w-[12ch] font-sans text-[2.75rem] font-black uppercase leading-[0.88] tracking-[-0.055em] text-[#FAF7F2] drop-shadow-[0_4px_20px_rgba(20,15,12,0.4)] sm:text-7xl lg:text-[6.2rem] xl:text-[7rem]">
            {product.titleLines.map((line, index) => (
              <span key={`${product.id}-${line}`} className="block pb-[0.08em]">
                <motion.span {...titleMotion(index)} className="block">
                  {line}
                </motion.span>
              </span>
            ))}
          </motion.h1>
          <motion.p
            {...lineMotion(
              HERO_ENTER_DESCRIPTION_DELAY_MS,
              HERO_EXIT_DESCRIPTION_DELAY_MS,
            )}
            className="mx-auto mt-5 max-w-[580px] font-bn text-sm leading-7 text-[#FAF7F2]/95 drop-shadow-md sm:mt-6 sm:text-base"
          >
            {product.description}
          </motion.p>
          <motion.p
            {...lineMotion(
              HERO_ENTER_DETAILS_DELAY_MS,
              HERO_EXIT_DETAILS_DELAY_MS,
            )}
            className="mt-3 text-[9px] font-medium uppercase tracking-[0.16em] text-[#F2ECE0]/90 drop-shadow sm:text-[10px]"
          >
            {product.details}
          </motion.p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
            <motion.div
              {...lineMotion(HERO_ENTER_CTA_DELAY_MS, HERO_EXIT_CTA_DELAY_MS)}
            >
              <Link
                to={product.href}
                tabIndex={mode === 'active' ? 0 : -1}
                className="inline-flex min-h-11 items-center gap-3 rounded-full border border-[#FAF7F2]/75 bg-[#1F1916]/15 px-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#FAF7F2] backdrop-blur-[2px] transition-colors hover:bg-[#B07A5B] sm:px-7"
                data-testid="hero-product-cta"
              >
                {product.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <motion.div
              {...lineMotion(
                HERO_ENTER_CTA2_DELAY_MS,
                HERO_EXIT_CTA2_DELAY_MS,
                HERO_EXIT_PROTECTED_DURATION_MS,
                HERO_TEXT_PROTECTED_EXIT_EASE,
              )}
            >
              <Link
                to={collectionLink}
                tabIndex={mode === 'active' ? 0 : -1}
                className="link-underline inline-flex items-center gap-2 py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#FAF7F2]/95 transition-colors hover:text-white sm:text-[11px]"
                data-testid="hero-cta-btn"
              >
                {collectionLabel} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
      <motion.p
        {...lineMotion(
          HERO_ENTER_FOOTER_DELAY_MS,
          HERO_EXIT_FOOTER_DELAY_MS,
          HERO_EXIT_PROTECTED_DURATION_MS,
          HERO_TEXT_PROTECTED_EXIT_EASE,
        )}
        className="pointer-events-none absolute bottom-[84px] left-1/2 -translate-x-1/2 text-[9px] tracking-[0.2em] text-[#FAF7F2]/75 drop-shadow sm:bottom-[92px]"
      >
        WWW.RAFDECOR.SHOP
      </motion.p>
    </div>
  );
}

export default function HomeHero({ s }: { s: any }) {
  const reduceMotion = useReducedMotion() === true;
  const count = HERO_PRODUCTS.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [incomingIndex, setIncomingIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const currentIndexRef = useRef(0);
  const activeIndexRef = useRef(0);
  const incomingIndexRef = useRef<number | null>(null);
  const isTransitioningRef = useRef(false);
  const isInitialSlideRef = useRef(true);
  const isMountedRef = useRef(true);
  const pendingIndexRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const imageLoadsRef = useRef(new Map<number, Promise<void>>());
  const transitionToRef = useRef<(index: number) => void>(() => undefined);

  useEffect(() => {
    isInitialSlideRef.current = false;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  const ensureImageLoaded = useCallback((index: number) => {
    const cachedLoad = imageLoadsRef.current.get(index);
    if (cachedLoad) return cachedLoad;

    const image = new Image();
    const load = new Promise<void>(resolve => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        if (typeof image.decode === 'function') {
          void image
            .decode()
            .catch(() => undefined)
            .then(() => resolve());
        } else {
          resolve();
        }
      };
      image.onload = finish;
      image.onerror = () => resolve();
      // Mirror the real <img>'s sizes/srcSet so preloading decodes the exact
      // same resource the browser will actually display (otherwise a
      // mismatched preload wastes the bandwidth it was meant to save).
      const product = HERO_PRODUCTS[index];
      image.sizes = '100vw';
      if (product.imageSrcSet) image.srcset = product.imageSrcSet;
      image.src = product.image;
      if (image.complete) finish();
    });
    imageLoadsRef.current.set(index, load);
    return load;
  }, []);

  const completeTransition = useCallback(() => {
    const completedIndex = incomingIndexRef.current;
    if (completedIndex === null) return;

    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    currentIndexRef.current = completedIndex;
    activeIndexRef.current = completedIndex;
    incomingIndexRef.current = null;
    setCurrentIndex(completedIndex);
    setActiveIndex(completedIndex);
    setIncomingIndex(null);
    isTransitioningRef.current = false;
    setIsTransitioning(false);

    const pendingIndex = pendingIndexRef.current;
    pendingIndexRef.current = null;
    if (pendingIndex !== null && pendingIndex !== completedIndex) {
      transitionToRef.current(pendingIndex);
    }
  }, []);

  const transitionTo = useCallback(
    (requestedIndex: number) => {
      if (requestedIndex < 0 || requestedIndex >= count) return;
      if (isTransitioningRef.current) {
        pendingIndexRef.current =
          requestedIndex === activeIndexRef.current ? null : requestedIndex;
        activeIndexRef.current = requestedIndex;
        return;
      }
      if (requestedIndex === currentIndexRef.current) return;

      isTransitioningRef.current = true;
      setIsTransitioning(true);
      activeIndexRef.current = requestedIndex;

      const prepareAndStart = async () => {
        let targetIndex = requestedIndex;
        while (true) {
          await ensureImageLoaded(targetIndex);
          if (!isMountedRef.current) return;
          const queuedIndex = pendingIndexRef.current;
          if (queuedIndex === null) break;
          pendingIndexRef.current = null;
          targetIndex = queuedIndex;
        }

        if (targetIndex === currentIndexRef.current) {
          activeIndexRef.current = targetIndex;
          setActiveIndex(targetIndex);
          isTransitioningRef.current = false;
          setIsTransitioning(false);
          return;
        }

        activeIndexRef.current = targetIndex;
        if (reduceMotion) {
          setActiveIndex(targetIndex);
          currentIndexRef.current = targetIndex;
          setCurrentIndex(targetIndex);
          isTransitioningRef.current = false;
          setIsTransitioning(false);
          return;
        }

        incomingIndexRef.current = targetIndex;
        setIncomingIndex(targetIndex);
      };

      void prepareAndStart();
    },
    [count, ensureImageLoaded, reduceMotion],
  );

  useEffect(() => {
    transitionToRef.current = transitionTo;
  }, [transitionTo]);

  useEffect(() => {
    if (incomingIndex === null || reduceMotion) return;
    transitionTimerRef.current = window.setTimeout(
      completeTransition,
      HERO_TRANSITION_MS,
    );
    return () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
    };
  }, [completeTransition, incomingIndex, reduceMotion]);

  useEffect(() => {
    const updateVisibility = () =>
      setIsPageVisible(document.visibilityState === 'visible');
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    return () =>
      document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  useEffect(() => {
    void ensureImageLoaded((activeIndex + 1) % count);
  }, [activeIndex, count, ensureImageLoaded]);

  useEffect(() => {
    if (reduceMotion || hasFocus || !isPageVisible || isTransitioning) return;
    const timer = window.setTimeout(() => {
      transitionTo((activeIndex + 1) % count);
    }, HERO_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [
    activeIndex,
    count,
    hasFocus,
    isPageVisible,
    isTransitioning,
    reduceMotion,
    transitionTo,
  ]);

  const selectProduct = (index: number) => transitionTo(index);
  const selectNext = () => transitionTo((activeIndexRef.current + 1) % count);
  const selectPrevious = () =>
    transitionTo((activeIndexRef.current - 1 + count) % count);

  const handleBlur = (event: React.FocusEvent<HTMLElement>) => {
    const nextTarget = event.relatedTarget;
    if (
      nextTarget instanceof Node &&
      event.currentTarget.contains(nextTarget)
    ) {
      return;
    }
    setHasFocus(false);
  };

  const renderSlide = (index: number) => {
    const product = HERO_PRODUCTS[index];
    const isOutgoing = incomingIndex !== null && index === currentIndex;
    const isIncoming = incomingIndex !== null && index === incomingIndex;
    const mode: HeroCopyMode = isOutgoing
      ? 'outgoing'
      : isIncoming
        ? 'incoming'
        : 'active';
    const initialReveal =
      mode === 'active' && isInitialSlideRef.current && index === 0;

    // The image leads: it has its own slow, independent right → center → left
    // transform (plus a subtle scale for parallax depth). The text, in
    // ProductCopy, is NOT nested inside that transform and does not share it —
    // each line there runs its own independently-timed animation, following
    // the image's lead rather than riding along with it.
    return (
      <article
        key={product.id}
        className="absolute inset-0 overflow-hidden"
        role="group"
        aria-roledescription="slide"
        aria-label={`${index + 1} of ${count}: ${product.title}`}
        aria-hidden={isOutgoing || undefined}
        data-testid={`hero-slide-${product.id}`}
        style={{ zIndex: isIncoming ? 10 : 0 }}
      >
        <div className="absolute inset-0 overflow-hidden">
          {/* One motion.div drives both translate and scale together — previously
              these were two separately-animated nested layers, which could drift
              a frame out of sync with each other and added extra compositing
              work; merging them removes that risk and is strictly smoother.
              Scaling the gradient along with the photo by ~2–3% is imperceptible
              (it's a flat CSS gradient, not a textured asset), so nothing is
              lost by keeping it in the same layer. */}
          <motion.div
            className="absolute inset-0"
            style={{ willChange: 'transform' }}
            initial={
              isIncoming && !reduceMotion
                ? { x: '100%', scale: HERO_IMAGE_SCALE_IN }
                : false
            }
            animate={{
              x: isOutgoing && !reduceMotion ? '-100%' : 0,
              scale: isOutgoing && !reduceMotion ? HERO_IMAGE_SCALE_OUT : 1,
            }}
            transition={{
              duration: reduceMotion ? 0 : HERO_IMAGE_DURATION_MS / 1000,
              delay:
                (isOutgoing || isIncoming) && !reduceMotion
                  ? HERO_IMAGE_DELAY_MS / 1000
                  : 0,
              ease: HERO_IMAGE_EASE,
            }}
          >
            <Link
              to={product.href}
              aria-label={`View ${product.title}`}
              tabIndex={mode === 'active' ? 0 : -1}
              className="absolute inset-0 block"
            >
              <img
                src={product.image}
                srcSet={product.imageSrcSet}
                sizes="100vw"
                alt={product.imageAlt}
                className="h-full w-full object-cover"
                style={{ objectPosition: product.imagePosition }}
                loading="eager"
                fetchPriority={index === 0 ? 'high' : 'auto'}
              />
            </Link>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(31,25,22,0.62)_0%,rgba(31,25,22,0.38)_42%,rgba(31,25,22,0.12)_68%,rgba(31,25,22,0.64)_100%)]" />
          </motion.div>
        </div>

        <ProductCopy
          product={product}
          mode={mode}
          collectionLink={s?.hero?.cta_link || '/shop'}
          collectionLabel={s?.hero?.cta_label || 'View collection'}
          reduceMotion={reduceMotion}
          initialReveal={initialReveal}
        />
      </article>
    );
  };

  const displayedIndexes =
    incomingIndex === null ? [currentIndex] : [currentIndex, incomingIndex];

  return (
    <section
      className="relative isolate min-h-[100svh] overflow-hidden bg-[#1F1916] text-[#FAF7F2]"
      data-testid="home-hero"
      role="region"
      aria-label="Featured RAF Decor pieces"
      onFocusCapture={event =>
        setHasFocus(
          event.target instanceof HTMLElement &&
            event.target.matches(':focus-visible'),
        )
      }
      onBlurCapture={handleBlur}
    >
      {displayedIndexes.map(index => renderSlide(index))}

      <div className="absolute bottom-5 right-5 z-40 flex items-center gap-3 sm:bottom-8 sm:right-8 sm:gap-5">
        <div
          className="hidden items-center gap-1.5 lg:flex"
          aria-label="Choose a featured product"
        >
          {HERO_PRODUCTS.map((product, index) => (
            <button
              key={product.id}
              type="button"
              onClick={() => selectProduct(index)}
              aria-label={`Show ${product.title}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              className="group flex h-10 items-center gap-2 px-2"
              data-testid={`hero-indicator-${index + 1}`}
            >
              <span
                className={`h-[2px] transition-all duration-500 ${index === activeIndex ? 'w-8 bg-[#D6A37F]' : 'w-3 bg-[#FAF7F2]/40 group-hover:bg-[#FAF7F2]/75'}`}
              />
              <span
                className={`text-[9px] uppercase tracking-[0.13em] transition-colors ${index === activeIndex ? 'text-[#FAF7F2]' : 'text-[#FAF7F2]/55 group-hover:text-[#FAF7F2]/85'}`}
              >
                {product.label}
              </span>
            </button>
          ))}
        </div>
        <div
          className="flex items-center gap-1.5 lg:hidden"
          aria-label="Choose a featured product"
        >
          {HERO_PRODUCTS.map((product, index) => (
            <button
              key={product.id}
              type="button"
              onClick={() => selectProduct(index)}
              aria-label={`Show ${product.title}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              className="group flex h-11 items-center px-2.5"
              data-testid={`hero-indicator-${index + 1}`}
            >
              <span
                className={`h-[2px] transition-all duration-500 ${index === activeIndex ? 'w-8 bg-[#D6A37F]' : 'w-3 bg-[#FAF7F2]/40 group-hover:bg-[#FAF7F2]/75'}`}
              />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectPrevious}
            aria-label="Previous featured product"
            className="flex h-10 w-10 items-center justify-center border border-[#FAF7F2]/25 text-[#FAF7F2] transition-colors hover:border-[#D6A37F] hover:text-[#D6A37F]"
            data-testid="hero-previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={selectNext}
            aria-label="Next featured product"
            className="flex h-10 w-10 items-center justify-center border border-[#FAF7F2]/25 text-[#FAF7F2] transition-colors hover:border-[#D6A37F] hover:text-[#D6A37F]"
            data-testid="hero-next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-[2px] bg-[#FAF7F2]/20"
        aria-hidden="true"
      >
        <motion.div
          key={activeIndex}
          className="h-full w-full origin-left bg-[#D6A37F]"
          style={{ willChange: 'transform' }}
          initial={{ scaleX: reduceMotion ? 1 : 0 }}
          animate={{ scaleX: 1 }}
          transition={{
            duration: reduceMotion
              ? 0
              : (HERO_INTERVAL_MS + HERO_TRANSITION_MS) / 1000,
            ease: 'linear',
          }}
        />
      </div>
    </section>
  );
}
