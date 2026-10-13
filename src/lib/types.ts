export type Category = { slug: string; name: string };

export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: Category;
  priceCents: number;
  compareAtCents?: number | null;
  stock: number;
  featured: boolean;
  badge?: "New" | "Low stock" | null;
  images: { cutout: string; scene?: string | null };
  specs: Record<string, string | number>;
  highlights: string[];
  battery?: { hours: number } | null;
  weightGrams?: number | null;
  description: string;
  createdAt: string;
};

export type ProductWithRelated = Product & { related: Product[] };

export type Facets = {
  categories: { slug: string; name: string; count: number }[];
  priceMin: number;
  priceMax: number;
};

export type ProductList = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  facets: Facets;
};

export type CartItem = { productId: string; quantity: number };

export type ShippingMethod = "standard" | "express";

export type ShippingOption = {
  method: ShippingMethod;
  label?: string;
  name?: string;
  priceCents?: number;
  costCents?: number;
  days?: string;
  eta?: string;
};

export type OrderLine = {
  productId: string;
  productName: string;
  unitPriceCents: number;
  quantity: number;
  slug?: string;
};

export type Order = {
  id: string;
  status: string;
  customerName?: string;
  customerEmail?: string;
  customer?: { name: string; email: string };
  shipping?: Record<string, string>;
  method: string;
  shippingCents: number;
  subtotalCents: number;
  totalCents: number;
  createdAt: string;
  lines: OrderLine[];
};
