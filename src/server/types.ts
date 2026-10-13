// Public API shapes. The frontend codes against these; keep them in sync with docs/BRIEF.md.

export type SpecValue = string | number;
export type ProductBadge = "New" | "Low stock";

export interface CategoryRef {
  slug: string;
  name: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: CategoryRef;
  priceCents: number;
  compareAtCents?: number;
  stock: number;
  featured: boolean;
  badge?: ProductBadge;
  images: { cutout: string; scene?: string };
  specs: Record<string, SpecValue>;
  highlights: string[];
  battery?: { hours: number };
  weightGrams?: number;
  description: string;
  createdAt: string;
}

export interface ProductDetail extends Product {
  related: Product[];
}

export interface CategoryFacet {
  slug: string;
  name: string;
  count: number;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  facets: {
    categories: CategoryFacet[];
    priceMin: number;
    priceMax: number;
  };
}

export type ShippingMethod = "standard" | "express";

export interface ShippingOption {
  method: ShippingMethod;
  label: string;
  priceCents: number;
  minDays: number;
  maxDays: number;
}

export interface PricedLine {
  productId: string;
  slug: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface CartPriceResponse {
  lines: PricedLine[];
  subtotalCents: number;
  shippingOptions: ShippingOption[];
  dropped: { productId: string; reason: string }[];
}

export type OrderStatus = "placed";

export interface Order {
  id: string;
  status: OrderStatus;
  createdAt: string;
  customer: { name: string; email: string };
  shipping: Address & { method: ShippingMethod };
  delivery: { minDays: number; maxDays: number };
  lines: PricedLine[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
}

export interface AssistantResponse {
  reply: string;
  productSlugs: string[];
}

export interface ApiError {
  error: string;
  details?: unknown;
}
