const META_PIXEL_ID = "1409835097977352";
const META_SAFE_QUERY_KEYS = new Set([
  "page", "sort", "category", "min_price", "max_price", "in_stock_only", "on_sale_only", "attr",
]);

type MetaPixel = ((command: string, ...args: unknown[]) => void) & {
  callMethod?: (command: string, ...args: unknown[]) => void;
  queue: IArguments[] | unknown[][];
  push: (...args: unknown[]) => void;
  loaded: boolean;
  version: string;
};

export type MetaContent = { id: string; quantity: number; item_price?: number };
export type MetaEventParameters = Record<string, unknown>;
export type MetaEventOptions = { eventID?: string };

export interface MetaPurchaseOrder {
  id: string;
  status: string;
  total: number;
  payment?: { method?: string; status?: string };
  items: Array<{ product_id: string; name?: string; quantity: number; unit_price: number }>;
}

export type MetaPurchaseSource = "cod_order_placed" | "verified_payment";

declare global {
  interface Window {
    fbq?: MetaPixel;
    _fbq?: MetaPixel;
    __rafMetaPixelInitialized?: boolean;
    __rafMetaPixelLastPageView?: string;
    __rafMetaPixelLastEventTokens?: Record<string, string>;
    __rafMetaPixelPurchaseIds?: Record<string, string>;
  }
}

function initializeMetaPixel() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  let fbq = window.fbq || window._fbq;
  if (!fbq) {
    const queue: unknown[][] = [];
    fbq = Object.assign(
      (command: string, ...args: unknown[]) => {
        if (fbq?.callMethod) fbq.callMethod(command, ...args);
        else queue.push([command, ...args]);
      },
      {
        queue,
        push: (...args: unknown[]) => queue.push(args),
        loaded: true,
        version: "2.0",
      },
    ) as MetaPixel;
    window.fbq = fbq;
    window._fbq = fbq;
  } else {
    window.fbq = fbq;
    window._fbq = fbq;
  }

  if (!window.__rafMetaPixelInitialized) {
    fbq("set", "autoConfig", false, META_PIXEL_ID);
    fbq("init", META_PIXEL_ID);
    window.__rafMetaPixelInitialized = true;
  }

  const scriptExists = Array.from(document.scripts).some((script) =>
    script.src.includes("connect.facebook.net") && script.src.includes("fbevents.js"),
  );
  if (!scriptExists) {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }
}

function hasSensitiveMetaLocation(pathname: string, search: string, hash: string) {
  const hasSensitiveQuery = Array.from(new URLSearchParams(search).keys()).some(
    (key) => !META_SAFE_QUERY_KEYS.has(key.toLowerCase()),
  );
  const hasSensitivePath = /^\/(?:reset-password|order-success|account|admin)(?:\/|$)/i.test(pathname);
  const hasSensitiveHash = /(?:token|secret|password|code)=/i.test(hash);
  return hasSensitivePath || hasSensitiveQuery || hasSensitiveHash;
}

export function trackMetaEvent(eventName: string, parameters?: MetaEventParameters, options?: MetaEventOptions) {
  if (typeof window === "undefined" || hasSensitiveMetaLocation(window.location.pathname, window.location.search, window.location.hash)) return;
  initializeMetaPixel();
  if (parameters || options) window.fbq?.("track", eventName, parameters || {}, ...(options ? [options] : []));
  else window.fbq?.("track", eventName);
}

export function trackMetaEventOnceForLocation(eventName: string, locationToken: string, parameters: MetaEventParameters) {
  if (typeof window === "undefined" || hasSensitiveMetaLocation(window.location.pathname, window.location.search, window.location.hash)) return false;
  const lastTokens = window.__rafMetaPixelLastEventTokens || (window.__rafMetaPixelLastEventTokens = {});
  if (lastTokens[eventName] === locationToken) return false;

  lastTokens[eventName] = locationToken;
  trackMetaEvent(eventName, parameters);
  return true;
}

export function markMetaPurchasePending(order: MetaPurchaseOrder) {
  if (typeof window === "undefined" || hasSensitiveMetaLocation(window.location.pathname, window.location.search, window.location.hash)
    || !order?.id || !order.payment?.method || order.payment.method === "cod"
    || order.payment.status === "paid" || ["cancelled", "returned", "refunded"].includes(order.status)) return false;

  try {
    const key = "rd_meta_pending_purchase_" + order.id;
    if (!window.localStorage.getItem(key)) window.localStorage.setItem(key, String(Date.now()));
    return true;
  } catch { return false; }
}

function newMetaEventId() {
  try {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  } catch { /* Use the local fallback when the browser does not expose randomUUID. */ }
  return `rd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function claimPurchaseEventId(orderId: string) {
  const sent = window.__rafMetaPixelPurchaseIds || (window.__rafMetaPixelPurchaseIds = {});
  if (sent[orderId]) return null;

  const key = `rd_meta_purchase_${orderId}`;
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) {
      sent[orderId] = existing;
      return null;
    }
    const eventID = newMetaEventId();
    window.localStorage.setItem(key, eventID);
    sent[orderId] = eventID;
    return eventID;
  } catch { return null; }
}

export function trackMetaPurchase(order: MetaPurchaseOrder, source: MetaPurchaseSource) {
  if (typeof window === "undefined" || hasSensitiveMetaLocation(window.location.pathname, window.location.search, window.location.hash)
    || !order?.id || !Array.isArray(order.items) || !order.items.length) return false;
  const payment = order.payment || {};
  const terminalOrder = ["cancelled", "returned", "refunded"].includes(order.status);
  const codOrderPlaced = source === "cod_order_placed" && payment.method === "cod" && !terminalOrder;
  let pendingPaymentKey: string | null = null;
  let verifiedPaymentStartedHere = false;
  if (source === "verified_payment" && payment.method !== "cod" && payment.status === "paid" && !terminalOrder) {
    pendingPaymentKey = "rd_meta_pending_purchase_" + order.id;
    try {
      const pendingSince = Number(window.localStorage.getItem(pendingPaymentKey));
      verifiedPaymentStartedHere = Number.isFinite(pendingSince) && pendingSince > 0;
    } catch { return false; }
  }
  const verifiedNonCodPayment = source === "verified_payment" && verifiedPaymentStartedHere;
  if (!codOrderPlaced && !verifiedNonCodPayment) return false;

  const eventID = claimPurchaseEventId(order.id);
  if (!eventID) return false;

  const items = order.items.map((item) => ({
    id: item.product_id,
    quantity: item.quantity,
    item_price: item.unit_price,
  }));
  const contentName = order.items.map((item) => item.name).filter(Boolean).join(", ");
  trackMetaEvent("Purchase", {
    content_ids: items.map((item) => item.id),
    ...(contentName ? { content_name: contentName } : {}),
    content_type: "product",
    contents: items,
    value: order.total,
    currency: "BDT",
    num_items: items.reduce((sum, item) => sum + item.quantity, 0),
  }, { eventID });
  if (pendingPaymentKey) {
    try { window.localStorage.removeItem(pendingPaymentKey); } catch { /* The purchase event is already queued. */ }
  }
  return true;
}

export function trackMetaPageView(locationToken: string, pathname: string, search: string, hash: string) {
  if (typeof window === "undefined" || window.__rafMetaPixelLastPageView === locationToken) return;

  window.__rafMetaPixelLastPageView = locationToken;

  // Meta receives the current URL with every event, so exclude reset tokens and order identifiers.
  if (hasSensitiveMetaLocation(pathname, search, hash)) return;

  initializeMetaPixel();
  trackMetaEvent("PageView");
}
