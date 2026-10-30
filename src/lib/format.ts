export const money = (n?: number | null) =>
  n == null ? "—" : `৳${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const fmtDate = (d?: string, withTime = false) =>
  d ? new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}) }) : "—";

export const STATUS_LABELS: Record<string, string> = {
  placed: "Order placed", confirmed: "Confirmed", processing: "Processing", packaging: "Packaging", dispatched: "Dispatched",
  out_for_delivery: "Out for delivery", delivered: "Delivered", cancelled: "Cancelled", returned: "Returned", refunded: "Refunded",
  unpaid: "Unpaid", awaiting_payment: "Awaiting transfer", paid: "Paid", partially_paid: "Partially paid", partially_refunded: "Partially refunded",
  new: "New", open: "Open", awaiting_customer: "Awaiting customer", resolved: "Resolved", closed: "Closed",
  draft: "Draft", published: "Published", archived: "Archived", active: "Active", pending: "Pending", approved: "Approved", rejected: "Rejected",
};

export const STATUS_TONE: Record<string, string> = {
  placed: "bg-amber-50 text-amber-800 border-amber-200", confirmed: "bg-sky-50 text-sky-800 border-sky-200",
  processing: "bg-sky-50 text-sky-800 border-sky-200", packaging: "bg-sky-50 text-sky-800 border-sky-200",
  dispatched: "bg-indigo-50 text-indigo-800 border-indigo-200", out_for_delivery: "bg-indigo-50 text-indigo-800 border-indigo-200",
  delivered: "bg-emerald-50 text-emerald-800 border-emerald-200", paid: "bg-emerald-50 text-emerald-800 border-emerald-200",
  published: "bg-emerald-50 text-emerald-800 border-emerald-200", active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  resolved: "bg-emerald-50 text-emerald-800 border-emerald-200", approved: "bg-emerald-50 text-emerald-800 border-emerald-200",
  cancelled: "bg-red-50 text-red-800 border-red-200", returned: "bg-red-50 text-red-800 border-red-200", refunded: "bg-red-50 text-red-800 border-red-200",
  rejected: "bg-red-50 text-red-800 border-red-200", unpaid: "bg-stone-100 text-stone-700 border-stone-200",
  awaiting_payment: "bg-amber-50 text-amber-800 border-amber-200", new: "bg-amber-50 text-amber-800 border-amber-200",
};

export const sessionId = () => {
  let s = localStorage.getItem("rd_sid");
  if (!s) {
    s = (crypto as any).randomUUID ? crypto.randomUUID().replace(/-/g, "") : String(Date.now()) + Math.random().toString(36).slice(2);
    localStorage.setItem("rd_sid", s);
  }
  return s;
};

export const cldImg = (url?: string, w = 800) =>
  url && url.includes("res.cloudinary.com") ? url.replace("/upload/", `/upload/f_auto,q_auto,c_limit,w_${w}/`) : url || "";
