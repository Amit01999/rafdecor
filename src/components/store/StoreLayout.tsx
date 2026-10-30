import { useEffect, useState } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import logo from '@/assets/Logo.webp';
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  Facebook,
  Instagram,
  ArrowUp,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useSite, useCategories } from '@/context/SiteContext';
import { CartDrawer } from './CartDrawer';
import { api } from '@/lib/api';
import { track } from '@/lib/seo';
import { money, cldImg } from '@/lib/format';

const LOGO = logo;

function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const { data } = useQuery({
    queryKey: ['suggest', q],
    queryFn: async () =>
      (await api.get('/search/suggest', { params: { q } })).data,
    enabled: q.trim().length > 1,
  });
  const go = () => {
    if (!q.trim()) return;
    track('search', { query: q });
    onOpenChange(false);
    nav(`/shop?q=${encodeURIComponent(q.trim())}`);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-[12%] max-w-2xl translate-y-0 rounded-none border-[#E6DDD0] bg-[#FAF7F2] p-0"
        data-testid="search-dialog"
      >
        <DialogTitle className="sr-only">Search products</DialogTitle>
        <form
          onSubmit={e => {
            e.preventDefault();
            go();
          }}
          className="flex items-center gap-3 border-b border-[#E6DDD0] px-5"
        >
          <Search className="h-5 w-5 text-[#7A6960]" />
          <input
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search tables, bowls, spice boxes…"
            className="h-16 flex-1 bg-transparent text-lg outline-none placeholder:text-[#A89A90]"
            data-testid="search-input"
          />
        </form>
        <div className="max-h-[60vh] overflow-y-auto p-3">
          {q.trim().length > 1 && data?.products?.length === 0 && (
            <p
              className="px-3 py-6 text-sm text-[#7A6960]"
              data-testid="search-no-results"
            >
              No products match “{q}”.
            </p>
          )}
          {data?.products?.map((p: any) => (
            <Link
              key={p.id}
              to={`/product/${p.slug}`}
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-4 px-3 py-2.5 hover:bg-[#F2ECE0]"
              data-testid={`search-result-${p.slug}`}
            >
              <img
                src={cldImg(p.images?.[0]?.url, 120)}
                alt=""
                className="h-14 w-12 object-cover"
              />
              <span className="flex-1 font-serif">{p.name}</span>
              <span className="text-sm text-[#7A6960]">
                {money(p.price_min)}
              </span>
            </Link>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Header() {
  const { count, setOpen } = useCart();
  const { user } = useAuth();
  const { data: site } = useSite();
  const { data: cats } = useCategories();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();
  useEffect(() => {
    setMenu(false);
  }, [loc.pathname]);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', f);
    return () => window.removeEventListener('scroll', f);
  }, []);
  const ann = site?.settings?.announcement;
  const showAnnouncement = site === undefined || ann?.enabled;
  const nav = [
    { to: '/', label: 'Home' },
    { to: '/shop', label: 'Shop' },
    ...(cats || [])
      .filter(c => !c.parent_id)
      .map(c => ({ to: `/product-category/${c.slug}`, label: c.name })),
    { to: '/track-order', label: 'Track order' },
    { to: '/contact-us', label: 'Contact' },
  ];
  return (
    <>
      {showAnnouncement && (
        <div
          className="bg-[#2C1E18] py-2 text-center text-[12px] tracking-wide text-[#F2ECE0] font-bn"
          data-testid="announcement-bar"
        >
          {ann?.text || ' '}
        </div>
      )}
      <header
        className={`sticky top-0 z-40 border-b transition-colors duration-300 ${scrolled ? 'border-[#E6DDD0] bg-[#FAF7F2]/90 backdrop-blur-md' : 'border-transparent bg-[#FAF7F2]'}`}
        data-testid="site-header"
      >
        <div className="container-rd relative flex h-[72px] items-center gap-6">
          <button
            className="lg:hidden"
            onClick={() => setMenu(true)}
            aria-label="Open menu"
            data-testid="mobile-menu-btn"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link
            to="/"
            className="flex items-center gap-3"
            data-testid="header-logo"
          >
            <img
              src={LOGO}
              alt="Raf Decor"
              className="h-10 w-10 object-contain"
            />
            <span className="hidden flex-col items-start gap-1 sm:flex">
              <span className="block font-serif text-[21px] font-semibold leading-none tracking-tight text-[#2C1E18]">
                Raf Decor
              </span>
              <span className="whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.2em] text-[#A56F52]">
                Handcrafted with love
              </span>
            </span>
          </Link>
          <nav
            className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-6 lg:flex"
            aria-label="Main"
          >
            {nav.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  `link-underline py-2 text-[14px] font-medium tracking-[0.01em] transition-colors ${isActive ? 'text-[#4E3629] after:scale-x-100' : 'text-[#594940] hover:text-[#2C1E18]'}`
                }
                data-testid={`nav-${n.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setSearch(true)}
              className="flex h-10 w-10 items-center justify-center hover:text-[#B07A5B]"
              aria-label="Search"
              data-testid="header-search-btn"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
            <Link
              to={user ? '/account/wishlist' : '/login'}
              className="hidden h-10 w-10 items-center justify-center hover:text-[#B07A5B] sm:flex"
              aria-label="Wishlist"
              data-testid="header-wishlist-link"
            >
              <Heart className="h-[18px] w-[18px]" />
            </Link>
            <Link
              to={user ? (user.is_staff ? '/admin' : '/account') : '/login'}
              className="flex h-10 w-10 items-center justify-center hover:text-[#B07A5B]"
              aria-label="Account"
              data-testid="header-account-link"
            >
              <User className="h-[18px] w-[18px]" />
            </Link>
            <button
              onClick={() => setOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center hover:text-[#B07A5B]"
              aria-label="Cart"
              data-testid="header-cart-btn"
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
              {count > 0 && (
                <span
                  className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#4E3629] px-1 text-[10px] font-semibold text-white"
                  data-testid="header-cart-count"
                >
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent
          side="left"
          className="w-[86vw] max-w-sm bg-[#FAF7F2] p-0"
          data-testid="mobile-menu"
        >
          <SheetTitle className="border-b border-[#E6DDD0] px-6 py-5 font-serif text-xl font-normal">
            Raf Decor
          </SheetTitle>
          <nav className="flex flex-col px-6 py-4">
            {nav.map(n => (
              <Link
                key={n.to}
                to={n.to}
                className="border-b border-[#E6DDD0]/70 py-4 font-serif text-lg"
              >
                {n.label}
              </Link>
            ))}
            <Link
              to={user ? '/account' : '/login'}
              className="py-4 text-sm text-[#7A6960]"
            >
              {user ? 'My account' : 'Sign in / Register'}
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      <SearchDialog open={search} onOpenChange={setSearch} />
    </>
  );
}

function Footer() {
  const { data: site } = useSite();
  const s = site?.settings || {};
  const c = s.contact || {};
  const social = s.social || {};
  const socialLinks = [
    {
      href:
        social.facebook ||
        'https://www.facebook.com/profile.php?id=61565899460264',
      Icon: Facebook,
      label: 'Facebook',
    },
    {
      href:
        social.instagram ||
        'https://www.instagram.com/rafdecor_official?utm_source=ig_web_button_share_sheet&psln=ZDNlZDc0MzIxNw==',
      Icon: Instagram,
      label: 'Instagram',
    },
  ];
  return (
    <footer
      className="relative mt-24 bg-[#1F1916] text-[#D8CCBC]"
      data-testid="site-footer"
    >
      <div className="h-[3px] bg-gradient-to-r from-[#B07A5B] via-[#D9A066] to-[#B07A5B]" />
      <div className="container-rd grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="flex items-center gap-3">
            <img
              src={LOGO}
              alt=""
              className="h-11 w-11 rounded-sm bg-[#FAF7F2] object-contain p-1"
            />
            <span className="font-serif text-2xl text-[#FAF7F2]">
              Raf Decor
            </span>
          </div>
          <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-[#B07A5B]">
            Handcrafted with love
          </p>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-[#A89A90]">
            {s.footer?.about}
          </p>
          {socialLinks.length > 0 && (
            <div className="mt-6 flex gap-3">
              {socialLinks.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-[#D8CCBC] transition-colors hover:border-[#B07A5B] hover:text-[#B07A5B]"
                >
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="md:col-span-2">
          <h4 className="mb-4 font-bn text-sm text-[#FAF7F2]">
            গুরুত্বপূর্ণ লিংকসমূহ
          </h4>
          <ul className="space-y-2.5 text-sm">
            {[
              ['/', 'হোমপেজ'],
              ['/shop', 'আমাদের শপ'],
              ['/contact-us', 'যোগাযোগ'],
              ['/track-order', 'Track order'],
            ].map(([to, l]) => (
              <li key={to}>
                <Link className="hover:text-white" to={to}>
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-2">
          <h4 className="mb-4 font-bn text-sm text-[#FAF7F2]">
            পলিসি ও শর্তাবলী
          </h4>
          <ul className="space-y-2.5 text-sm">
            {[
              ['/privacy-policy', 'প্রাইভেসি পলিসি'],
              ['/refund_returns', 'রিফান্ড পলিসি'],
              ['/terms-and-conditions', 'শর্তাবলী'],
              ['/dmca', 'DMCA নোটিশ'],
            ].map(([to, l]) => (
              <li key={to}>
                <Link className="hover:text-white" to={to}>
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-4">
          <h4 className="mb-4 font-bn text-sm text-[#FAF7F2]">
            যোগাযোগ ও ঠিকানা
          </h4>
          <ul className="space-y-3 text-sm" data-testid="footer-contact">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-[#B07A5B]" />
              <span className="font-bn">{c.address}</span>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 h-4 w-4 text-[#B07A5B]" />
              <a href={`tel:${c.phone}`} className="hover:text-white">
                {c.phone_display || c.phone}
              </a>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 h-4 w-4 text-[#B07A5B]" />
              <a href={`mailto:${c.email}`} className="hover:text-white">
                {c.email}
              </a>
            </li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 h-4 w-4 text-[#B07A5B]" />
              <span>{c.hours}</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 bg-[#17110C]">
        <div className="container-rd flex flex-col items-center justify-between gap-3 py-6 text-xs text-[#7A6960] sm:flex-row">
          <span>
            © {new Date().getFullYear()} Raf Decor. All rights reserved.
          </span>
          <div className="flex items-center gap-6">
            <Link to="/privacy-policy" className="hover:text-white">
              Privacy Policy
            </Link>
            <Link to="/terms-and-conditions" className="hover:text-white">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const f = () => setVisible(window.scrollY > 480);
    window.addEventListener('scroll', f);
    return () => window.removeEventListener('scroll', f);
  }, []);
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      data-testid="back-to-top-btn"
      className={`fixed bottom-4 right-6 z-40 flex h-9 w-9 items-center justify-center rounded-lg bg-[#2C1E18] text-[#FAF7F2] shadow-lg transition-all duration-300 hover:bg-[#B07A5B] ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
}

export default function StoreLayout() {
  const loc = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <BackToTop />
    </div>
  );
}
