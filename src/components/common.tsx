import React from "react";
import { Link } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { money, STATUS_LABELS, STATUS_TONE, fmtDate } from "@/lib/format";

export const Price = ({ price, regular, max, className = "" }: { price: number; regular?: number | null; max?: number; className?: string }) => (
  <span className={`inline-flex items-baseline gap-2 ${className}`} data-testid="price">
    <span className="font-medium text-[#2C1E18]">{money(price)}{max && max > price ? ` – ${money(max)}` : ""}</span>
    {regular && regular > price ? <span className="text-sm text-[#A89A90] line-through">{money(regular)}</span> : null}
  </span>
);

export const StatusBadge = ({ status, testId }: { status: string; testId?: string }) => (
  <span data-testid={testId} className={`inline-flex items-center whitespace-nowrap rounded-[3px] border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider ${STATUS_TONE[status] || "bg-stone-50 text-stone-700 border-stone-200"}`}>
    {STATUS_LABELS[status] || status}
  </span>
);

export const Spinner = ({ className = "" }: { className?: string }) => <Loader2 className={`h-5 w-5 animate-spin text-[#B07A5B] ${className}`} />;

export const PageLoader = () => (
  <div className="flex min-h-[40vh] items-center justify-center" data-testid="page-loader"><Spinner className="h-7 w-7" /></div>
);

export const EmptyState = ({ title, body, action, icon }: { title: string; body?: string; action?: React.ReactNode; icon?: React.ReactNode }) => (
  <div className="flex flex-col items-start gap-3 border border-dashed border-[#E6DDD0] bg-white/60 px-8 py-14 sm:items-center sm:text-center" data-testid="empty-state">
    {icon && <div className="text-[#B07A5B]">{icon}</div>}
    <h3 className="text-xl text-[#2C1E18]">{title}</h3>
    {body && <p className="max-w-md text-sm text-[#7A6960]">{body}</p>}
    {action}
  </div>
);

export const ErrorState = ({ message = "We couldn't load this right now.", onRetry }: { message?: string; onRetry?: () => void }) => (
  <div className="border border-red-200 bg-red-50/60 px-6 py-8 text-sm text-red-900" role="alert" data-testid="error-state">
    <p>{message}</p>
    {onRetry && <button onClick={onRetry} className="mt-3 underline" data-testid="error-retry-btn">Try again</button>}
  </div>
);

export const Skeleton = ({ className = "" }: { className?: string }) => <div className={`animate-pulse bg-[#EFE7DA] ${className}`} />;

export const Breadcrumbs = ({ items }: { items: { label: string; to?: string }[] }) => (
  <nav aria-label="Breadcrumb" className="text-xs text-[#7A6960]" data-testid="breadcrumbs">
    {items.map((it, i) => (
      <span key={i}>
        {i > 0 && <span className="mx-2 text-[#C9BBAA]">/</span>}
        {it.to ? <Link to={it.to} className="hover:text-[#4E3629]">{it.label}</Link> : <span className="text-[#2C1E18]">{it.label}</span>}
      </span>
    ))}
  </nav>
);

export function OrderTimeline({ history, status }: { history: { status: string; label: string; at: string; note?: string | null }[]; status: string }) {
  const flow = ["placed", "confirmed", "processing", "packaging", "dispatched", "out_for_delivery", "delivered"];
  const reached = new Set(history.map((h) => h.status));
  const terminal = ["cancelled", "returned", "refunded"].includes(status);
  const steps = terminal ? history.map((h) => h.status) : flow.filter((s) => reached.has(s) || ["placed", "confirmed", "dispatched", "delivered"].includes(s));
  return (
    <ol className="relative space-y-6 border-l border-[#E6DDD0] pl-6" data-testid="order-timeline">
      {steps.map((s) => {
        const h = [...history].reverse().find((x) => x.status === s);
        return (
          <li key={s} className="relative" data-testid={`timeline-step-${s}`}>
            <span className={`absolute -left-[31px] flex h-4 w-4 items-center justify-center rounded-full border ${h ? "border-[#4E3629] bg-[#4E3629] text-white" : "border-[#D8CCBC] bg-[#FAF7F2]"}`}>
              {h && <Check className="h-2.5 w-2.5" />}
            </span>
            <p className={`text-sm ${h ? "font-medium text-[#2C1E18]" : "text-[#A89A90]"}`}>{STATUS_LABELS[s] || s}</p>
            {h && <p className="text-xs text-[#7A6960]">{fmtDate(h.at, true)}</p>}
            {h?.note && <p className="mt-1 text-sm text-[#594940]">{h.note}</p>}
          </li>
        );
      })}
    </ol>
  );
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  render() {
    if (this.state.err) return (
      <div className="container-rd py-24" data-testid="error-boundary">
        <h1 className="text-3xl">Something went wrong</h1>
        <p className="mt-2 text-[#7A6960]">Please refresh the page. If the problem continues, contact us.</p>
        <a href="/" className="btn-primary mt-6">Back to home</a>
      </div>
    );
    return this.props.children;
  }
}

export const Field = ({ label, error, children, htmlFor }: { label: string; error?: string; children: React.ReactNode; htmlFor?: string }) => (
  <div>
    <label className="label-rd" htmlFor={htmlFor}>{label}</label>
    {children}
    {error && <p className="mt-1 text-xs text-red-700" role="alert">{error}</p>}
  </div>
);
