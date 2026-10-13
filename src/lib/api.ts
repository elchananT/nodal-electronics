import type { Order, Product, ProductList, ProductWithRelated } from "./types";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  } catch {
    throw new ApiError("Can't reach the store right now. Check your connection and try again.", 0);
  }
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    const b = body as { error?: string; details?: unknown } | null;
    throw new ApiError(b?.error ?? `Request failed (${res.status})`, res.status, b?.details);
  }
  return body as T;
}

export type ProductQuery = {
  category?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export function productsUrl(q: ProductQuery) {
  const p = new URLSearchParams();
  if (q.category) p.set("category", q.category);
  if (q.q) p.set("q", q.q);
  if (q.minPrice != null) p.set("minPrice", String(q.minPrice));
  if (q.maxPrice != null) p.set("maxPrice", String(q.maxPrice));
  if (q.inStock) p.set("inStock", "true");
  if (q.sort) p.set("sort", q.sort);
  if (q.page) p.set("page", String(q.page));
  if (q.pageSize) p.set("pageSize", String(q.pageSize));
  const s = p.toString();
  return `/api/products${s ? `?${s}` : ""}`;
}

export const getProducts = (q: ProductQuery, signal?: AbortSignal) => request<ProductList>(productsUrl(q), { signal });
export const getProduct = (slug: string, signal?: AbortSignal) =>
  request<ProductWithRelated>(`/api/products/${encodeURIComponent(slug)}`, { signal });
export const getOrder = (id: string, signal?: AbortSignal) => request<Order>(`/api/orders/${encodeURIComponent(id)}`, { signal });
export const askAssistant = (message: string) =>
  request<{ reply: string; productSlugs: string[] }>("/api/assistant", { method: "POST", body: JSON.stringify({ message }) });
export const priceCart = (items: { productId: string; quantity: number }[]) =>
  request<unknown>("/api/cart/price", { method: "POST", body: JSON.stringify({ items }) });
export const placeOrder = (payload: unknown) => request<Order>("/api/orders", { method: "POST", body: JSON.stringify(payload) });

/* ── whole catalog, fetched once and shared (spec lab, assistant cards, search) ── */
let catalogPromise: Promise<Product[]> | null = null;
export function getCatalog(): Promise<Product[]> {
  if (!catalogPromise) {
    catalogPromise = (async () => {
      const first = await getProducts({ sort: "featured", pageSize: 50 });
      let items = first.items;
      let page = first.page;
      while (items.length < first.total && page < 10) {
        page += 1;
        const next = await getProducts({ sort: "featured", pageSize: 50, page });
        if (!next.items.length) break;
        items = items.concat(next.items);
      }
      return items;
    })().catch((e) => {
      catalogPromise = null;
      throw e;
    });
  }
  return catalogPromise;
}
