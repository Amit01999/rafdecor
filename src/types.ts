export interface Img { url: string; alt?: string; public_id?: string | null; source_url?: string }
export interface Variant { id: string; name?: string; sku?: string; attributes: Record<string, string>; price: number; sale_price?: number | null; image?: Img; effective_price: number; on_sale: boolean; in_stock: boolean; available: number | null }
export interface Product {
  id: string; slug: string; name: string; short_description: string; description?: string; category_ids: string[]; featured: boolean;
  sku?: string; price: number; sale_price?: number | null; attributes: { name: string; values: string[] }[]; variants: Variant[]; images: Img[];
  specs: { label: string; value: string }[]; dimensions?: string; materials?: string; shipping_charge: number; price_min: number; price_max: number;
  on_sale: boolean; in_stock: boolean; available: number | null; low_stock: boolean; created_at: string; categories?: { id: string; name: string; slug: string }[];
  rating?: { average: number; count: number } | null;
}
export interface Category { id: string; name: string; slug: string; description?: string; image?: string; parent_id?: string | null; featured?: boolean; product_count?: number; status?: string; sort_order?: number }
export interface CartLine { product_id: string; variant_id?: string | null; quantity: number }
export interface QuoteLine extends CartLine { slug: string; name: string; variant_label?: string; image?: string; unit_price: number; regular_price: number; line_total: number; available: number | null; valid: boolean }
export interface Quote { lines: QuoteLine[]; issues: { product_id: string; variant_id?: string; code: string; message: string }[]; subtotal: number; discount: number; shipping: number; total: number; coupon?: { code: string; valid: boolean; message: string } | null }
export interface User { id: string; email: string; name: string; phone?: string; role: string; is_staff: boolean; permissions: string[] }
