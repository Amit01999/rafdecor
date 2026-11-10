import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { ErrorBoundary } from "@/components/common";
import StoreLayout from "@/components/store/StoreLayout";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import ProductPage from "@/pages/Product";
import { CartPage, CheckoutPage } from "@/pages/Checkout";
import { OrderSuccess, TrackOrder } from "@/pages/Orders";
import { Login, Register, ForgotPassword, ResetPassword, ContactPage, ContentPage, NotFound } from "@/pages/Auth";
import { RequireAuth, AccountLayout, AccountOverview, AccountOrders, AccountOrderDetail, AccountWishlist, AccountAddresses, AccountInquiries, AccountProfile } from "@/pages/account/Account";
import AdminLayout from "@/admin/AdminLayout";
import Dashboard from "@/admin/Dashboard";
import { AdminProducts, ProductEditor, AdminCategories, AdminInventory, AdminReviews } from "@/admin/Catalog";
import { AdminHomepageFeatured } from "@/admin/HomepageFeatured";
import { AdminOrders, AdminOrderDetail, AdminCustomers, AdminInquiries } from "@/admin/Operations";
import { AdminMarketing, AdminContent, AdminAnalytics, AdminStaff, AdminAudit, AdminMigration } from "@/admin/System";
import { trackMetaPageView } from "@/lib/metaPixel";

const StepRedirect = () => <Navigate to={`/product/${useParams().slug}`} replace />;

function MetaPixelPageViews() {
  const location = useLocation();

  useEffect(() => {
    trackMetaPageView(
      JSON.stringify([location.key, location.pathname, location.search, location.hash]),
      location.pathname,
      location.search,
      location.hash,
    );
  }, [location.key, location.pathname, location.search, location.hash]);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <MetaPixelPageViews />
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route element={<StoreLayout />}>
                <Route index element={<Home />} />
                <Route path="shop" element={<Shop />} />
                <Route path="product-category/:slug" element={<Shop />} />
                <Route path="product/:slug" element={<ProductPage />} />
                <Route path="step/:slug" element={<StepRedirect />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="checkout" element={<CheckoutPage />} />
                <Route path="order-success/:number" element={<OrderSuccess />} />
                <Route path="track-order" element={<TrackOrder />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="reset-password" element={<ResetPassword />} />
                <Route path="contact-us" element={<ContactPage />} />
                <Route path="my-account" element={<Navigate to="/account" replace />} />
                <Route path="account" element={<RequireAuth><AccountLayout /></RequireAuth>}>
                  <Route index element={<AccountOverview />} />
                  <Route path="orders" element={<AccountOrders />} />
                  <Route path="orders/:number" element={<AccountOrderDetail />} />
                  <Route path="wishlist" element={<AccountWishlist />} />
                  <Route path="addresses" element={<AccountAddresses />} />
                  <Route path="inquiries" element={<AccountInquiries />} />
                  <Route path="profile" element={<AccountProfile />} />
                </Route>
                {["privacy-policy", "refund_returns", "terms-and-conditions", "dmca"].map((s) => <Route key={s} path={s} element={<ContentPage slug={s} />} />)}
                <Route path="pages/:slug" element={<ContentPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="admin" element={<RequireAuth staff><AdminLayout /></RequireAuth>}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/:id" element={<ProductEditor />} />
                <Route path="homepage-featured" element={<AdminHomepageFeatured />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="inventory" element={<AdminInventory />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="orders/:id" element={<AdminOrderDetail />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="inquiries" element={<AdminInquiries />} />
                <Route path="marketing" element={<AdminMarketing />} />
                <Route path="content" element={<AdminContent />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="staff" element={<AdminStaff />} />
                <Route path="audit" element={<AdminAudit />} />
                <Route path="migration" element={<AdminMigration />} />
              </Route>
            </Routes>
            <Toaster position="bottom-right" toastOptions={{ style: { borderRadius: 2, background: "#FAF7F2", border: "1px solid #E6DDD0", color: "#2C1E18" } }} />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
