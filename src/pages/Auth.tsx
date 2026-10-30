import { useState } from "react";
import { Link, useNavigate, useSearchParams, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import { useSeo } from "@/lib/seo";
import { useAuth } from "@/context/AuthContext";
import { useSite } from "@/context/SiteContext";
import { Field, PageLoader, EmptyState } from "@/components/common";

function AuthShell({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  useSeo({ title, noindex: true });
  return (
    <div className="container-rd grid min-h-[70vh] items-center py-16 lg:grid-cols-2 lg:gap-20">
      <div className="hidden lg:block"><p className="eyebrow">Raf Decor</p><p className="mt-4 font-serif text-5xl leading-tight text-[#2C1E18]">Handcrafted <span className="italic text-[#4E3629]">with love.</span></p><p className="mt-6 max-w-sm text-[#7A6960]">Track orders, save favourites and check out faster with your Raf Decor account.</p></div>
      <div className="w-full max-w-md justify-self-center lg:justify-self-start"><h1 className="text-4xl tracking-tight">{title}</h1>{sub && <p className="mt-2 text-sm text-[#7A6960]">{sub}</p>}<div className="mt-8">{children}</div></div>
    </div>
  );
}

function useSubmit(fn: (f: any) => Promise<void>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true); setError("");
    try { await fn(Object.fromEntries(new FormData(e.currentTarget))); } catch (x) { setError(errorMessage(x)); } finally { setBusy(false); }
  };
  return { busy, error, onSubmit };
}

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const s = useSubmit(async (f) => { const u = await login(f.email, f.password); nav(sp.get("next") || (u.is_staff ? "/admin" : "/account")); });
  return (
    <AuthShell title="Sign in" sub="Welcome back to Raf Decor.">
      <form onSubmit={s.onSubmit} className="space-y-4" data-testid="login-form">
        <Field label="Email" htmlFor="l-email"><input id="l-email" name="email" type="email" required autoComplete="email" className="input-rd" data-testid="login-email" /></Field>
        <Field label="Password" htmlFor="l-pw"><input id="l-pw" name="password" type="password" required autoComplete="current-password" className="input-rd" data-testid="login-password" /></Field>
        {s.error && <p className="text-sm text-red-800" role="alert" data-testid="login-error">{s.error}</p>}
        <button disabled={s.busy} className="btn-primary w-full" data-testid="login-submit-btn">{s.busy ? "Signing in…" : "Sign in"}</button>
        <div className="flex justify-between text-sm"><Link to="/forgot-password" className="text-[#7A6960] hover:text-[#2C1E18]" data-testid="forgot-link">Forgot password?</Link><Link to={`/register${sp.get("next") ? `?next=${sp.get("next")}` : ""}`} className="text-[#4E3629] underline" data-testid="register-link">Create account</Link></div>
      </form>
    </AuthShell>
  );
}

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const s = useSubmit(async (f) => { await register(f); toast.success("Welcome to Raf Decor!"); nav(sp.get("next") || "/account"); });
  return (
    <AuthShell title="Create account" sub="Save addresses, track orders and keep a wishlist.">
      <form onSubmit={s.onSubmit} className="space-y-4" data-testid="register-form">
        <Field label="Full name" htmlFor="r-name"><input id="r-name" name="name" required minLength={2} className="input-rd" data-testid="register-name" /></Field>
        <Field label="Email" htmlFor="r-email"><input id="r-email" name="email" type="email" required className="input-rd" data-testid="register-email" /></Field>
        <Field label="Mobile number" htmlFor="r-phone"><input id="r-phone" name="phone" placeholder="01XXXXXXXXX" className="input-rd" data-testid="register-phone" /></Field>
        <Field label="Password (min 8 characters)" htmlFor="r-pw"><input id="r-pw" name="password" type="password" required minLength={8} autoComplete="new-password" className="input-rd" data-testid="register-password" /></Field>
        {s.error && <p className="text-sm text-red-800" role="alert" data-testid="register-error">{s.error}</p>}
        <button disabled={s.busy} className="btn-primary w-full" data-testid="register-submit-btn">{s.busy ? "Creating…" : "Create account"}</button>
        <p className="text-sm text-[#7A6960]">Already have an account? <Link to="/login" className="text-[#4E3629] underline">Sign in</Link></p>
      </form>
    </AuthShell>
  );
}

export function ForgotPassword() {
  const [done, setDone] = useState("");
  const s = useSubmit(async (f) => { const { data } = await api.post("/auth/forgot-password", f); setDone(data.message); });
  return (
    <AuthShell title="Reset password" sub="Enter your account email and we'll issue a reset link.">
      {done ? <p className="border border-[#E6DDD0] bg-white p-5 text-sm" data-testid="forgot-done">{done} If you don't receive it, please call us — email delivery is being set up.</p> : (
        <form onSubmit={s.onSubmit} className="space-y-4" data-testid="forgot-form">
          <Field label="Email" htmlFor="f-email"><input id="f-email" name="email" type="email" required className="input-rd" data-testid="forgot-email" /></Field>
          {s.error && <p className="text-sm text-red-800" role="alert">{s.error}</p>}
          <button disabled={s.busy} className="btn-primary w-full" data-testid="forgot-submit-btn">Send reset link</button>
        </form>
      )}
    </AuthShell>
  );
}

export function ResetPassword() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const s = useSubmit(async (f) => { await api.post("/auth/reset-password", { token: sp.get("token"), password: f.password }); toast.success("Password updated. Please sign in."); nav("/login"); });
  return (
    <AuthShell title="Choose a new password">
      <form onSubmit={s.onSubmit} className="space-y-4" data-testid="reset-form">
        <Field label="New password" htmlFor="rp-pw"><input id="rp-pw" name="password" type="password" minLength={8} required className="input-rd" data-testid="reset-password" /></Field>
        {s.error && <p className="text-sm text-red-800" role="alert">{s.error}</p>}
        <button disabled={s.busy} className="btn-primary w-full" data-testid="reset-submit-btn">Update password</button>
      </form>
    </AuthShell>
  );
}

export function ContactPage() {
  const { data: site } = useSite();
  const c = site?.settings?.contact || {};
  const [sp] = useSearchParams();
  const [ref, setRef] = useState("");
  useSeo({ title: "Contact us", description: "Contact Raf Decor — call, email or send us a message." });
  const s = useSubmit(async (f) => { const { data } = await api.post("/inquiries", { ...f, email: f.email || null, kind: f.order_number ? "order" : "general", order_number: f.order_number || null }); setRef(data.ref); });
  return (
    <div className="container-rd grid gap-16 py-14 lg:grid-cols-12" data-testid="contact-page">
      <div className="lg:col-span-5">
        <p className="eyebrow">যোগাযোগ</p><h1 className="mt-3 text-4xl tracking-tight sm:text-5xl">Contact us</h1>
        <dl className="mt-10 space-y-6 text-sm">
          <div><dt className="label-rd">Showroom & workshop</dt><dd className="font-bn text-base">{c.address}</dd></div>
          <div><dt className="label-rd">Phone</dt><dd className="text-base"><a href={`tel:${c.phone}`}>{c.phone_display}</a></dd></div>
          <div><dt className="label-rd">Email</dt><dd className="text-base"><a href={`mailto:${c.email}`}>{c.email}</a></dd></div>
          <div><dt className="label-rd">Hours</dt><dd className="text-base">{c.hours}</dd></div>
        </dl>
      </div>
      <div className="lg:col-span-7">
        {ref ? <div className="border border-[#E6DDD0] bg-white p-8" data-testid="contact-success"><h2 className="font-serif text-2xl">Message received</h2><p className="mt-2 text-[#594940]">Your reference is <strong className="font-mono">{ref}</strong>. We'll get back to you by phone or email.</p></div> : (
          <form onSubmit={s.onSubmit} className="grid gap-4 border border-[#E6DDD0] bg-white p-8 sm:grid-cols-2" data-testid="contact-form">
            <Field label="Name *" htmlFor="c-name"><input id="c-name" name="name" required className="input-rd" data-testid="contact-name" /></Field>
            <Field label="Phone" htmlFor="c-phone"><input id="c-phone" name="phone" className="input-rd" data-testid="contact-phone" /></Field>
            <Field label="Email" htmlFor="c-email"><input id="c-email" name="email" type="email" className="input-rd" data-testid="contact-email" /></Field>
            <Field label="Order number (if any)" htmlFor="c-order"><input id="c-order" name="order_number" defaultValue={sp.get("order") || ""} className="input-rd" data-testid="contact-order" /></Field>
            <div className="sm:col-span-2"><Field label="Subject" htmlFor="c-sub"><input id="c-sub" name="subject" defaultValue="General inquiry" className="input-rd" data-testid="contact-subject" /></Field></div>
            <div className="sm:col-span-2"><Field label="Message *" htmlFor="c-msg"><textarea id="c-msg" name="message" required minLength={5} rows={5} className="input-rd h-auto py-3" data-testid="contact-message" /></Field></div>
            {s.error && <p className="text-sm text-red-800 sm:col-span-2" role="alert" data-testid="contact-error">{s.error}</p>}
            <button disabled={s.busy} className="btn-primary sm:col-span-2" data-testid="contact-submit-btn">{s.busy ? "Sending…" : "Send message"}</button>
          </form>
        )}
      </div>
    </div>
  );
}

export function ContentPage({ slug: fixed }: { slug?: string }) {
  const params = useParams();
  const slug = fixed || params.slug;
  const { data, isLoading, isError } = useQuery({ queryKey: ["page", slug], queryFn: async () => (await api.get(`/content/pages/${slug}`)).data, retry: false });
  useSeo({ title: data?.title, description: data?.seo?.description });
  if (isLoading) return <PageLoader />;
  if (isError) return <NotFound />;
  return (
    <article className="container-rd max-w-3xl py-16" data-testid={`content-page-${slug}`}>
      <h1 className="text-4xl tracking-tight sm:text-5xl">{data.title}</h1>
      {data.body ? <div className="prose-rd mt-10 font-bn" dangerouslySetInnerHTML={{ __html: data.body }} /> : <p className="mt-8 text-[#7A6960]">This page is being updated. For questions please <Link to="/contact-us" className="underline">contact us</Link>.</p>}
    </article>
  );
}

export function NotFound() {
  useSeo({ title: "Page not found", noindex: true });
  return <div className="container-rd py-24" data-testid="not-found-page"><EmptyState title="We couldn't find that page" body="The page may have moved. Explore our handcrafted collection instead." action={<Link to="/shop" className="btn-primary">Visit the shop</Link>} /></div>;
}
