import React, { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export const AdminPage = ({ title, sub, actions, children, testId }: { title: string; sub?: string; actions?: React.ReactNode; children: React.ReactNode; testId: string }) => (
  <div data-testid={testId}>
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="font-serif text-3xl tracking-tight text-[#1F1916]">{title}</h1>{sub && <p className="mt-1 text-sm text-[#7A6960]">{sub}</p>}</div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
    {children}
  </div>
);

export const Stat = ({ label, value, hint, testId }: { label: string; value: React.ReactNode; hint?: string; testId: string }) => (
  <div className="border border-[#E6DDD0] bg-white p-5" data-testid={testId}>
    <p className="text-[11px] uppercase tracking-[0.16em] text-[#7A6960]">{label}</p>
    <p className="mt-2 font-serif text-2xl text-[#1F1916]">{value}</p>
    {hint && <p className="mt-1 text-xs text-[#A89A90]">{hint}</p>}
  </div>
);

export const Card = ({ title, children, actions, className = "" }: { title?: string; children: React.ReactNode; actions?: React.ReactNode; className?: string }) => (
  <section className={`border border-[#E6DDD0] bg-white ${className}`}>
    {title && <div className="flex items-center justify-between border-b border-[#E6DDD0] px-5 py-3.5"><h2 className="text-sm font-medium">{title}</h2>{actions}</div>}
    <div className="p-5">{children}</div>
  </section>
);

export const Table = ({ head, children, testId }: { head: string[]; children: React.ReactNode; testId: string }) => (
  <div className="overflow-x-auto border border-[#E6DDD0] bg-white">
    <table className="w-full min-w-[720px] text-sm" data-testid={testId}>
      <thead className="bg-[#FAF7F2] text-left text-[11px] uppercase tracking-wider text-[#7A6960]"><tr>{head.map((h, i) => <th key={i} className="whitespace-nowrap px-4 py-3 font-medium">{h}</th>)}</tr></thead>
      <tbody className="divide-y divide-[#EFE7DA]">{children}</tbody>
    </table>
  </div>
);

export const Td = ({ children, className = "" }: { children?: React.ReactNode; className?: string }) => <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;

export const Pager = ({ page, total, limit, onPage }: { page: number; total: number; limit: number; onPage: (p: number) => void }) => {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="mt-4 flex items-center justify-between text-xs text-[#7A6960]" data-testid="admin-pager">
      <span>{total} records</span>
      <div className="flex gap-2"><button disabled={page <= 1} onClick={() => onPage(page - 1)} className="border border-[#E6DDD0] bg-white px-3 py-1.5 disabled:opacity-40" data-testid="pager-prev">Prev</button><span className="px-2 py-1.5">{page} / {pages}</span><button disabled={page >= pages} onClick={() => onPage(page + 1)} className="border border-[#E6DDD0] bg-white px-3 py-1.5 disabled:opacity-40" data-testid="pager-next">Next</button></div>
    </div>
  );
};

export function DateRange({ value, onChange }: { value: { from: string; to: string }; onChange: (v: { from: string; to: string }) => void }) {
  const preset = (days: number) => { const to = new Date(); const from = new Date(Date.now() - days * 86400000); onChange({ from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }); };
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="date-range">
      {[[1, "Today"], [7, "7d"], [30, "30d"], [90, "90d"], [365, "1y"]].map(([d, l]) => <button key={l} onClick={() => preset(d as number)} className="border border-[#E6DDD0] bg-white px-2.5 py-1.5 text-xs hover:border-[#4E3629]" data-testid={`range-${l}`}>{l}</button>)}
      <input type="date" value={value.from} onChange={(e) => onChange({ ...value, from: e.target.value })} className="input-rd h-8 w-36 text-xs" aria-label="From date" />
      <input type="date" value={value.to} onChange={(e) => onChange({ ...value, to: e.target.value })} className="input-rd h-8 w-36 text-xs" aria-label="To date" />
    </div>
  );
}

export const rangeParams = (r: { from: string; to: string }) => ({ date_from: r.from ? `${r.from}T00:00:00+06:00` : undefined, date_to: r.to ? `${r.to}T23:59:59+06:00` : undefined });
export const defaultRange = () => ({ from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) });

export function useConfirm() {
  const [state, setState] = useState<{ title: string; body?: string; resolve: (v: boolean) => void } | null>(null);
  const confirm = (title: string, body?: string) => new Promise<boolean>((resolve) => setState({ title, body, resolve }));
  const dialog = (
    <AlertDialog open={!!state} onOpenChange={(o) => { if (!o) { state?.resolve(false); setState(null); } }}>
      <AlertDialogContent className="rounded-none" data-testid="confirm-dialog">
        <AlertDialogHeader><AlertDialogTitle className="font-serif font-normal">{state?.title}</AlertDialogTitle>{state?.body && <AlertDialogDescription>{state.body}</AlertDialogDescription>}</AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel data-testid="confirm-cancel">Cancel</AlertDialogCancel><AlertDialogAction className="bg-[#4E3629] hover:bg-[#372318]" onClick={() => { state?.resolve(true); setState(null); }} data-testid="confirm-ok">Confirm</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  return { confirm, dialog };
}

export const btn = "inline-flex h-9 items-center gap-2 bg-[#4E3629] px-4 text-xs font-medium text-white hover:bg-[#372318] disabled:opacity-50";
export const btnOutline = "inline-flex h-9 items-center gap-2 border border-[#E6DDD0] bg-white px-4 text-xs font-medium hover:border-[#4E3629] disabled:opacity-50";
export const inp = "input-rd h-9";
