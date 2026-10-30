import { useState } from "react";
import { Link, NavLink, Navigate, Outlet, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Package, Heart, MapPin, User as UserIcon, MessageSquare, LogOut } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { money, fmtDate } from "@/lib/format";
import { useSeo } from "@/lib/seo";
import { useAuth } from "@/context/AuthContext";
import { EmptyState, Field, PageLoader, StatusBadge } from "@/components/common";
import { ProductCard } from "@/components/store/ProductCard";
import { OrderView } from "@/pages/Orders";

export function RequireAuth({ children, staff }: { children: React.ReactNode; staff?: boolean }) {
  const { user } = useAuth();
  if (user === null) return <PageLoader />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(window.location.pathname)}`} replace />;
  if (staff && !user.is_staff) return <Navigate to="/account" replace />;
  return <>{children}</>;
}

const LINKS = [["/account", "Overview", UserIcon], ["/account/orders", "Orders", Package], ["/account/wishlist", "Wishlist", Heart], ["/account/addresses", "Addresses", MapPin], ["/account/inquiries", "Messages", MessageSquare], ["/account/profile", "Profile & security", UserIcon]] as const;

export function AccountLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  useSeo({ title: "My account", noindex: true });
  return (
    <div className="container-rd py-12" data-testid="account-layout">
      <p className="eyebrow">My account</p>
      <h1 className="mt-2 text-4xl tracking-tight">Hello, {user && user.name.split(" ")[0]}</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto border-b border-[#E6DDD0] pb-2 lg:flex-col lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6" aria-label="Account">
          {LINKS.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === "/account"} className={({ isActive }) => `flex shrink-0 items-center gap-3 px-3 py-2.5 text-sm ${isActive ? "bg-[#F2ECE0] text-[#2C1E18]" : "text-[#594940] hover:text-[#2C1E18]"}`} data-testid={`account-nav-${label.split(" ")[0].toLowerCase()}`}><Icon className="h-4 w-4" />{label}</NavLink>
          ))}
          <button onClick={async () => { await logout(); nav("/"); }} className="flex shrink-0 items-center gap-3 px-3 py-2.5 text-left text-sm text-[#7A6960] hover:text-red-800" data-testid="logout-btn"><LogOut className="h-4 w-4" />Sign out</button>
        </nav>
        <div className="min-w-0"><Outlet /></div>
      </div>
    </div>
  );
}

function OrdersTable({ items }: { items: any[] }) {
  if (!items.length) return <EmptyState title="No orders yet" body="When you place an order it will appear here." action={<Link to="/shop" className="btn-primary">Start shopping</Link>} />;
  return (
    <div className="overflow-x-auto border border-[#E6DDD0] bg-white">
      <table className="w-full text-sm" data-testid="account-orders-table">
        <thead className="bg-[#FAF7F2] text-left text-xs uppercase tracking-wider text-[#7A6960]"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3 text-right">Total</th></tr></thead>
        <tbody className="divide-y divide-[#E6DDD0]">{items.map((o) => (
          <tr key={o.id} className="hover:bg-[#FAF7F2]"><td className="px-4 py-3"><Link to={`/account/orders/${o.order_number}`} className="font-mono underline" data-testid={`account-order-link-${o.order_number}`}>{o.order_number}</Link></td><td className="px-4 py-3">{fmtDate(o.created_at)}</td><td className="px-4 py-3"><StatusBadge status={o.status} /></td><td className="px-4 py-3"><StatusBadge status={o.payment.status} /></td><td className="px-4 py-3 text-right">{money(o.total)}</td></tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export function AccountOverview() {
  const { user } = useAuth();
  const { data } = useQuery({ queryKey: ["my-orders"], queryFn: async () => (await api.get("/orders")).data });
  return (
    <div className="space-y-10">
      <div className="grid gap-px border border-[#E6DDD0] bg-[#E6DDD0] sm:grid-cols-3">
        <div className="bg-white p-6"><p className="label-rd">Orders</p><p className="font-serif text-3xl" data-testid="overview-orders-count">{data?.total ?? "—"}</p></div>
        <div className="bg-white p-6"><p className="label-rd">Email</p><p className="truncate text-sm">{user && user.email}</p></div>
        <div className="bg-white p-6"><p className="label-rd">Phone</p><p className="text-sm">{(user && user.phone) || "—"}</p></div>
      </div>
      <div><h2 className="mb-4 font-serif text-2xl">Recent orders</h2>{data ? <OrdersTable items={data.items.slice(0, 5)} /> : <PageLoader />}</div>
    </div>
  );
}

export function AccountOrders() {
  const { data } = useQuery({ queryKey: ["my-orders"], queryFn: async () => (await api.get("/orders")).data });
  return <div><h2 className="mb-6 font-serif text-2xl">Order history</h2>{data ? <OrdersTable items={data.items} /> : <PageLoader />}</div>;
}

export function AccountOrderDetail() {
  const { number } = useParams();
  const { data, isError } = useQuery({ queryKey: ["order", number], queryFn: async () => (await api.get(`/orders/${number}`)).data, retry: false, refetchInterval: 60_000 });
  if (isError) return <EmptyState title="Order not found" action={<Link to="/account/orders" className="btn-outline">Back to orders</Link>} />;
  if (!data) return <PageLoader />;
  return <div><Link to="/account/orders" className="text-sm text-[#7A6960]">← All orders</Link><h2 className="mb-6 mt-3 font-mono text-xl" data-testid="account-order-number">{data.order_number}</h2><OrderView o={data} />
    <Link to={`/contact-us?order=${data.order_number}`} className="btn-outline mt-8" data-testid="order-help-btn">Need help with this order?</Link></div>;
}

export function AccountWishlist() {
  const { data } = useQuery({ queryKey: ["wishlist-full"], queryFn: async () => (await api.get("/wishlist")).data });
  if (!data) return <PageLoader />;
  return <div><h2 className="mb-6 font-serif text-2xl">Wishlist</h2>{data.items.length ? <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 xl:grid-cols-3" data-testid="wishlist-grid">{data.items.map((p: any) => <ProductCard key={p.id} p={p} />)}</div> : <EmptyState title="Your wishlist is empty" body="Tap the heart on any product to save it here." action={<Link to="/shop" className="btn-primary">Browse products</Link>} />}</div>;
}

export function AccountAddresses() {
  const { data, refetch } = useQuery({ queryKey: ["me-full"], queryFn: async () => (await api.get("/customers/me")).data });
  const [edit, setEdit] = useState<any>(null);
  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f: any = Object.fromEntries(new FormData(e.currentTarget));
    f.is_default = f.is_default === "on";
    try {
      if (edit?.id) await api.put(`/customers/me/addresses/${edit.id}`, f); else await api.post("/customers/me/addresses", f);
      toast.success("Address saved"); setEdit(null); refetch();
    } catch (x) { toast.error(errorMessage(x)); }
  };
  const del = async (id: string) => { await api.delete(`/customers/me/addresses/${id}`); refetch(); };
  if (!data) return <PageLoader />;
  return (
    <div>
      <div className="mb-6 flex items-center justify-between"><h2 className="font-serif text-2xl">Saved addresses</h2><button className="btn-outline h-10" onClick={() => setEdit({})} data-testid="add-address-btn">Add address</button></div>
      {edit && (
        <form onSubmit={save} className="mb-8 grid gap-4 border border-[#E6DDD0] bg-white p-6 sm:grid-cols-2" data-testid="address-form">
          <Field label="Label"><input name="label" defaultValue={edit.label || "Home"} className="input-rd" /></Field>
          <Field label="Recipient name"><input name="name" required defaultValue={edit.name} className="input-rd" data-testid="address-name" /></Field>
          <Field label="Phone"><input name="phone" required defaultValue={edit.phone} className="input-rd" data-testid="address-phone" /></Field>
          <Field label="District"><input name="district" required defaultValue={edit.district || "Dhaka"} className="input-rd" data-testid="address-district" /></Field>
          <div className="sm:col-span-2"><Field label="Address"><input name="address" required defaultValue={edit.address} className="input-rd" data-testid="address-address" /></Field></div>
          <Field label="Area / Thana"><input name="area" defaultValue={edit.area} className="input-rd" /></Field>
          <label className="flex items-center gap-2 self-end text-sm"><input type="checkbox" name="is_default" defaultChecked={edit.is_default} className="accent-[#4E3629]" />Default address</label>
          <div className="flex gap-2 sm:col-span-2"><button className="btn-primary h-10" data-testid="address-save-btn">Save</button><button type="button" className="btn-outline h-10" onClick={() => setEdit(null)}>Cancel</button></div>
        </form>
      )}
      {data.addresses.length === 0 && !edit ? <EmptyState title="No saved addresses" body="Save an address for faster checkout." /> : (
        <div className="grid gap-4 sm:grid-cols-2">{data.addresses.map((a: any) => (
          <div key={a.id} className="border border-[#E6DDD0] bg-white p-5 text-sm" data-testid={`address-card-${a.id}`}>
            <p className="font-medium">{a.label} {a.is_default && <span className="ml-2 text-xs text-[#B07A5B]">Default</span>}</p>
            <p className="mt-2">{a.name} · {a.phone}</p><p className="text-[#594940]">{a.address}{a.area && `, ${a.area}`}, {a.district}</p>
            <div className="mt-3 flex gap-4 text-xs"><button className="underline" onClick={() => setEdit(a)}>Edit</button><button className="text-red-800 underline" onClick={() => del(a.id)}>Delete</button></div>
          </div>
        ))}</div>
      )}
    </div>
  );
}

export function AccountInquiries() {
  const { data } = useQuery({ queryKey: ["my-inquiries"], queryFn: async () => (await api.get("/inquiries/mine")).data.items });
  if (!data) return <PageLoader />;
  return (
    <div><div className="mb-6 flex items-center justify-between"><h2 className="font-serif text-2xl">Messages</h2><Link to="/contact-us" className="btn-outline h-10">New message</Link></div>
      {data.length === 0 ? <EmptyState title="No messages yet" body="Questions you send us while signed in will appear here." /> : (
        <ul className="space-y-4">{data.map((i: any) => (
          <li key={i.id} className="border border-[#E6DDD0] bg-white p-5" data-testid={`my-inquiry-${i.ref}`}>
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{i.subject}</p><StatusBadge status={i.status} /></div>
            <p className="mt-1 text-xs text-[#7A6960]">{i.ref} · {fmtDate(i.created_at, true)}</p><p className="mt-3 text-sm text-[#594940]">{i.message}</p>
            {i.replies?.map((r: any, k: number) => <div key={k} className="mt-3 border-l-2 border-[#B07A5B] bg-[#FAF7F2] p-3 text-sm"><p className="text-xs text-[#7A6960]">Raf Decor · {fmtDate(r.at, true)}</p><p className="mt-1">{r.message}</p></div>)}
          </li>
        ))}</ul>
      )}
    </div>
  );
}

export function AccountProfile() {
  const { user, refresh } = useAuth();
  const saveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try { await api.patch("/customers/me", Object.fromEntries(new FormData(e.currentTarget))); await refresh(); toast.success("Profile updated"); } catch (x) { toast.error(errorMessage(x)); }
  };
  const savePw = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    try { await api.post("/customers/me/password", Object.fromEntries(new FormData(form))); toast.success("Password changed"); form.reset(); } catch (x) { toast.error(errorMessage(x)); }
  };
  const logoutAll = async () => { await api.post("/auth/logout-all"); window.location.href = "/login"; };
  if (!user) return null;
  return (
    <div className="grid gap-10 xl:grid-cols-2">
      <form onSubmit={saveProfile} className="space-y-4 border border-[#E6DDD0] bg-white p-6" data-testid="profile-form">
        <h2 className="font-serif text-xl">Profile</h2>
        <Field label="Name"><input name="name" defaultValue={user.name} required className="input-rd" data-testid="profile-name" /></Field>
        <Field label="Phone"><input name="phone" defaultValue={user.phone || ""} className="input-rd" data-testid="profile-phone" /></Field>
        <Field label="Email"><input value={user.email} disabled className="input-rd bg-[#FAF7F2]" /></Field>
        <button className="btn-primary h-10" data-testid="profile-save-btn">Save changes</button>
      </form>
      <div className="space-y-6">
        <form onSubmit={savePw} className="space-y-4 border border-[#E6DDD0] bg-white p-6" data-testid="password-form">
          <h2 className="font-serif text-xl">Change password</h2>
          <Field label="Current password"><input name="current_password" type="password" required className="input-rd" /></Field>
          <Field label="New password"><input name="new_password" type="password" minLength={8} required className="input-rd" /></Field>
          <button className="btn-outline h-10">Update password</button>
        </form>
        <div className="border border-[#E6DDD0] bg-white p-6"><h2 className="font-serif text-xl">Sessions</h2><p className="mt-2 text-sm text-[#7A6960]">Sign out from every device where you're logged in.</p><button onClick={logoutAll} className="btn-outline mt-4 h-10" data-testid="logout-all-btn">Sign out everywhere</button></div>
      </div>
    </div>
  );
}
