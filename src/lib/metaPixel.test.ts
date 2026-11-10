import {
  MetaPurchaseOrder,
  markMetaPurchasePending,
  trackMetaEventOnceForLocation,
  trackMetaPageView,
  trackMetaPurchase,
} from "./metaPixel";

declare const beforeEach: (fn: () => void) => void;
declare const test: (name: string, fn: () => void) => void;
declare function expect(actual: unknown): {
  toBe(expected: unknown): void;
  toBeTruthy(): void;
  toHaveLength(expected: number): void;
  toMatchObject(expected: object): void;
};

function queuedCalls(command: string) {
  return ((window.fbq?.queue || []) as unknown[][]).filter((call) => call[0] === command);
}

beforeEach(() => {
  localStorage.clear();
  document.querySelectorAll('script[src*="connect.facebook.net"]').forEach((script) => script.remove());
  window.fbq = undefined;
  window._fbq = undefined;
  window.__rafMetaPixelInitialized = undefined;
  window.__rafMetaPixelLastPageView = undefined;
  window.__rafMetaPixelLastEventTokens = undefined;
  window.__rafMetaPixelPurchaseIds = undefined;
  window.history.replaceState(null, "", "/");
});

const order = (overrides: Partial<MetaPurchaseOrder> = {}): MetaPurchaseOrder => ({
  id: "order-internal-1",
  status: "placed",
  total: 1250,
  payment: { method: "cod", status: "unpaid" },
  items: [{ product_id: "product-1", name: "Wooden tray", quantity: 2, unit_price: 600 }],
  ...overrides,
});

test("deduplicates React effect repeats and preserves private route PageView exclusions", () => {
  trackMetaEventOnceForLocation("ViewContent", "product-route-key", {
    content_ids: ["product-1"],
    content_type: "product",
  });
  trackMetaEventOnceForLocation("ViewContent", "product-route-key", {
    content_ids: ["product-1"],
    content_type: "product",
  });
  trackMetaPageView("account-route-key", "/account/orders/order-internal-1", "", "");
  trackMetaPageView("home-route-key", "/", "", "");
  trackMetaPageView("home-route-key", "/", "", "");

  expect(queuedCalls("init")).toHaveLength(1);
  expect(queuedCalls("track").filter((call) => call[1] === "ViewContent")).toHaveLength(1);
  expect(queuedCalls("track").filter((call) => call[1] === "PageView")).toHaveLength(1);
});

test("fires COD Purchase only after accepted order placement and only once", () => {
  expect(trackMetaPurchase(order(), "cod_order_placed")).toBe(true);
  expect(trackMetaPurchase(order(), "cod_order_placed")).toBe(false);

  const purchases = queuedCalls("track").filter((call) => call[1] === "Purchase");
  expect(purchases).toHaveLength(1);
  expect(purchases[0][2]).toMatchObject({
    content_ids: ["product-1"],
    content_name: "Wooden tray",
    content_type: "product",
    contents: [{ id: "product-1", quantity: 2, item_price: 600 }],
    value: 1250,
    currency: "BDT",
    num_items: 2,
  });
  expect((purchases[0][3] as { eventID?: string }).eventID).toBeTruthy();
});

test("waits for backend-confirmed non-COD payment and rejects failed or pending orders", () => {
  const bankOrder = order({ payment: { method: "bank_transfer", status: "awaiting_payment" } });
  expect(trackMetaPurchase(bankOrder, "verified_payment")).toBe(false);
  expect(trackMetaPurchase(order({ payment: { method: "bank_transfer", status: "paid" } }), "verified_payment")).toBe(false);
  expect(trackMetaPurchase(order({ status: "cancelled" }), "cod_order_placed")).toBe(false);
  expect(queuedCalls("track").filter((call) => call[1] === "Purchase")).toHaveLength(0);
  expect(markMetaPurchasePending(bankOrder)).toBe(true);

  bankOrder.payment!.status = "paid";
  window.history.replaceState(null, "", "/account/orders/order-internal-1");
  expect(trackMetaPurchase(bankOrder, "verified_payment")).toBe(false);
  window.history.replaceState(null, "", "/track-order");
  expect(trackMetaPurchase(bankOrder, "verified_payment")).toBe(true);
  expect(trackMetaPurchase(bankOrder, "verified_payment")).toBe(false);
  expect(queuedCalls("track").filter((call) => call[1] === "Purchase")).toHaveLength(1);
});
