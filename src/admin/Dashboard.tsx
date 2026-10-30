import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from "recharts";
import { api } from "@/lib/api";
import { money, fmtDate } from "@/lib/format";
import { PageLoader, StatusBadge, ErrorState } from "@/components/common";
import { AdminPage, Stat, Card, DateRange, rangeParams, defaultRange } from "./ui";

const List = ({ rows, empty, testId }: { rows: { label: string; value: string | number; to?: string }[]; empty: string; testId: string }) => (
  rows.length ? <ul className="divide-y divide-[#EFE7DA] text-sm" data-testid={testId}>{rows.map((r, i) => <li key={i} className="flex justify-between gap-3 py-2">{r.to ? <Link to={r.to} className="truncate hover:underline">{r.label}</Link> : <span className="truncate">{r.label}</span>}<span className="text-[#7A6960]">{r.value}</span></li>)}</ul> : <p className="text-sm text-[#A89A90]">{empty}</p>
);

export default function Dashboard() {
  const [range, setRange] = useState(defaultRange());
  const { data: d, isLoading, isError, refetch } = useQuery({ queryKey: ["admin-dash", range], queryFn: async () => (await api.get("/admin/dashboard", { params: rangeParams(range) })).data });
  return (
    <AdminPage title="Overview" sub="All figures are calculated from recorded orders, payments and events." actions={<DateRange value={range} onChange={setRange} />} testId="admin-dashboard">
      {isLoading ? <PageLoader /> : isError ? <ErrorState onRetry={refetch} /> : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Orders (period)" value={d.orders.total} hint={`${d.orders.today} today`} testId="stat-orders" />
            <Stat label="Gross sales" value={money(d.finance.gross_total)} hint="Order value excl. cancelled" testId="stat-gross" />
            <Stat label="Collected payments" value={money(d.finance.collected)} hint={`Outstanding ${money(d.finance.outstanding)}`} testId="stat-collected" />
            <Stat label="Net revenue" value={money(d.finance.net_revenue)} hint={`Refunds ${money(d.finance.refunds)}`} testId="stat-net" />
            <Stat label="Avg order value" value={money(d.finance.aov)} testId="stat-aov" />
            <Stat label="Discounts given" value={money(d.finance.discounts)} testId="stat-discounts" />
            <Stat label="Pending / processing" value={`${d.orders.pending} / ${d.orders.processing}`} hint={`${d.orders.delivered} delivered · ${d.orders.cancelled} cancelled`} testId="stat-pipeline" />
            <Stat label="Customers" value={d.customers.total} hint={`${d.customers.new} new in period`} testId="stat-customers" />
            <Stat label="Products" value={d.catalog.products} hint={`${d.catalog.low_stock} low · ${d.catalog.out_of_stock} out of stock`} testId="stat-products" />
          </div>
          <div className="grid gap-6 xl:grid-cols-3">
            <Card title="Sales vs collected (৳)" className="xl:col-span-2">
              {d.series.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={d.series}><CartesianGrid stroke="#EFE7DA" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip />
                    <Area dataKey="sales" stroke="#4E3629" fill="#4E3629" fillOpacity={0.12} name="Sales" /><Area dataKey="collected" stroke="#B07A5B" fill="#B07A5B" fillOpacity={0.15} name="Collected" /></AreaChart>
                </ResponsiveContainer>
              ) : <p className="py-16 text-center text-sm text-[#A89A90]">No orders in this period yet.</p>}
            </Card>
            <Card title="Orders per day">
              {d.series.length ? <ResponsiveContainer width="100%" height={260}><BarChart data={d.series}><XAxis dataKey="date" hide /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="orders" fill="#B07A5B" /></BarChart></ResponsiveContainer> : <p className="py-16 text-center text-sm text-[#A89A90]">No data</p>}
            </Card>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card title="Bestsellers (units)"><List testId="dash-bestsellers" empty="No sales recorded yet." rows={d.bestsellers.map((b: any) => ({ label: b.name, value: `${b.units} · ${money(b.revenue)}` }))} /></Card>
            <Card title="Most viewed"><List testId="dash-most-viewed" empty="No product views yet." rows={d.most_viewed.map((b: any) => ({ label: b.name || "—", value: b.count }))} /></Card>
            <Card title="Most added to cart"><List testId="dash-most-carted" empty="No add-to-cart events yet." rows={d.most_carted.map((b: any) => ({ label: b.name || "—", value: b.count }))} /></Card>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Recent orders" actions={<Link to="/admin/orders" className="text-xs underline">All orders</Link>}>
              {d.recent_orders.length ? <ul className="divide-y divide-[#EFE7DA] text-sm" data-testid="dash-recent-orders">{d.recent_orders.map((o: any) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2.5"><Link to={`/admin/orders/${o.id}`} className="font-mono text-xs underline">{o.order_number}</Link><span className="flex-1 truncate">{o.customer?.name}</span><StatusBadge status={o.status} /><span className="w-24 text-right">{money(o.total)}</span></li>
              ))}</ul> : <p className="text-sm text-[#A89A90]">No orders yet.</p>}
            </Card>
            <Card title="Recent inquiries" actions={<Link to="/admin/inquiries" className="text-xs underline">All inquiries</Link>}>
              {d.recent_inquiries.length ? <ul className="divide-y divide-[#EFE7DA] text-sm">{d.recent_inquiries.map((i: any) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-2.5"><span className="font-mono text-xs">{i.ref}</span><span className="flex-1 truncate">{i.subject}</span><StatusBadge status={i.status} /><span className="text-xs text-[#7A6960]">{fmtDate(i.created_at)}</span></li>
              ))}</ul> : <p className="text-sm text-[#A89A90]">No inquiries yet.</p>}
            </Card>
          </div>
        </div>
      )}
    </AdminPage>
  );
}
