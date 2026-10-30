import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Boxes,
  Megaphone,
  FileText,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  ScrollText,
  ExternalLink,
  Menu,
  Star,
  Sparkles,
  LogOut,
} from 'lucide-react';
import logo from '@/assets/Logo.webp';
import { useAuth } from '@/context/AuthContext';
import { useSeo } from '@/lib/seo';

const NAV = [
  ['/admin', 'Overview', LayoutDashboard, 'analytics.read'],
  ['/admin/orders', 'Orders', ShoppingCart, 'orders.read'],
  ['/admin/products', 'Products', Package, 'products.read'],
  ['/admin/homepage-featured', 'Homepage Featured', Sparkles, 'products.read'],
  ['/admin/categories', 'Categories', FolderTree, 'products.read'],
  ['/admin/inventory', 'Inventory', Boxes, 'products.read'],
  ['/admin/reviews', 'Reviews', Star, 'products.read'],
  ['/admin/customers', 'Customers', Users, 'customers.read'],
  ['/admin/inquiries', 'Inquiries', MessageSquare, 'inquiries.read'],
  ['/admin/marketing', 'Marketing', Megaphone, 'marketing.write'],
  ['/admin/content', 'Content', FileText, 'content.write'],
  ['/admin/analytics', 'Analytics', BarChart3, 'analytics.read'],
  ['/admin/staff', 'Staff & roles', ShieldCheck, 'users.manage'],
  ['/admin/audit', 'Audit logs', ScrollText, 'audit.read'],
] as const;

export default function AdminLayout() {
  const { user, can, logout } = useAuth();
  const [open, setOpen] = useState(false);
  useSeo({ title: 'Admin', noindex: true });
  const side = (
    <nav className="flex flex-col gap-0.5 p-3" aria-label="Admin">
      {NAV.filter(([, , , p]) => can(p)).map(([to, label, Icon]) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/admin'}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 text-[14px] ${isActive ? 'bg-[#FAF7F2]/10 text-white' : 'text-[#C9BBAA] hover:bg-white/5 hover:text-white'}`
          }
          data-testid={`admin-nav-${label.split(' ')[0].toLowerCase()}`}
        >
          <Icon className="h-4 w-4" strokeWidth={1.6} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
  return (
    <div className="flex min-h-screen bg-[#F6F2EC]" data-testid="admin-layout">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-[#1F1916] transition-transform lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Link
          to="/admin"
          className="flex shrink-0 items-center gap-3 border-b border-white/10 px-5 py-5"
        >
          <img
            src={logo}
            alt=""
            className="h-8 w-8 rounded-sm bg-[#FAF7F2] p-0.5"
          />
          <span>
            <span className="block font-serif text-lg leading-none text-white">
              Raf Decor
            </span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#B07A5B]">
              Admin
            </span>
          </span>
        </Link>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">{side}</div>
        <div className="shrink-0 border-t border-white/10 p-3">
          <button
            onClick={async () => {
              await logout();
              window.location.href = '/login';
            }}
            className="flex w-full items-center justify-center gap-2 rounded-[4px] border border-white/15 py-2.5 text-[13px] font-medium text-[#C9BBAA] transition-colors hover:border-[#B07A5B] hover:bg-white/5 hover:text-white"
            data-testid="admin-logout-btn"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.6} />
            Sign out
          </button>
        </div>
      </aside>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[#E6DDD0] bg-white/90 px-5 backdrop-blur">
          <button
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open admin menu"
            data-testid="admin-menu-btn"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-4 text-xs">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[#7A6960] hover:text-[#2C1E18]"
              data-testid="admin-view-store"
            >
              View store <ExternalLink className="h-3 w-3" />
            </a>
            <span className="text-[#7A6960]">
              {user && `${user.name} · ${user.role.replace('_', ' ')}`}
            </span>
          </div>
        </header>
        <main className="flex-1 p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
