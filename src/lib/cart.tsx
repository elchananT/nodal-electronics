"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { priceCart } from "./api";
import type { Product, ShippingOption } from "./types";

const KEY = "nodal.cart.v1";
export const MAX_QTY = 10;

/** What we remember per line: enough to render instantly, re-synced from the server on load. */
export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  category: string;
  priceCents: number;
  stock: number;
  quantity: number;
  /** set by the server when a line can't be fulfilled */
  issue?: string;
};

type Ctx = {
  lines: CartLine[];
  count: number;
  subtotalCents: number;
  shippingOptions: ShippingOption[];
  ready: boolean;
  syncing: boolean;
  open: boolean;
  setOpen: (o: boolean) => void;
  add: (p: Product, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  resync: () => void;
  notice: string | null;
  dismissNotice: () => void;
};

const CartContext = createContext<Ctx | null>(null);

function validate(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const out: CartLine[] = [];
  const seen = new Set<string>();
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const l = r as Record<string, unknown>;
    if (typeof l.productId !== "string" || typeof l.slug !== "string" || typeof l.name !== "string") continue;
    if (typeof l.priceCents !== "number" || !Number.isFinite(l.priceCents) || l.priceCents < 0) continue;
    const q = Math.floor(Number(l.quantity));
    if (!Number.isFinite(q) || q < 1 || seen.has(l.productId)) continue;
    seen.add(l.productId);
    out.push({
      productId: l.productId,
      slug: l.slug,
      name: l.name,
      image: typeof l.image === "string" ? l.image : `/products/${l.slug}.webp`,
      category: typeof l.category === "string" ? l.category : "",
      priceCents: Math.round(l.priceCents),
      stock: typeof l.stock === "number" ? l.stock : MAX_QTY,
      quantity: Math.min(q, MAX_QTY),
    });
  }
  return out;
}

/* The server's pricing response is read defensively: lines may be keyed by productId, with the
   unit price under a few plausible names. Unknown shapes fall back to the stored snapshot. */
type AnyRec = Record<string, unknown>;
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
function readPriced(res: unknown) {
  const r = (res ?? {}) as AnyRec;
  const lines = (Array.isArray(r.lines) ? r.lines : Array.isArray(r.items) ? r.items : []) as AnyRec[];
  const dropped = (Array.isArray(r.dropped) ? r.dropped : Array.isArray(r.removed) ? r.removed : Array.isArray(r.unavailable) ? r.unavailable : []) as AnyRec[];
  const shipping = (Array.isArray(r.shippingOptions) ? r.shippingOptions : Array.isArray(r.shipping) ? r.shipping : []) as ShippingOption[];
  return { lines, dropped, shipping };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const linesRef = useRef(lines);
  linesRef.current = lines;

  /* load once; every field is validated because localStorage is user-editable */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(validate(JSON.parse(raw)));
    } catch {
      /* storage blocked or corrupt: start empty */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines.map(({ issue: _i, ...l }) => l)));
    } catch {
      /* ignore */
    }
  }, [lines, ready]);

  /* other tabs */
  useEffect(() => {
    const on = (e: StorageEvent) => {
      if (e.key !== KEY || !e.newValue) return;
      try {
        setLines(validate(JSON.parse(e.newValue)));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", on);
    return () => window.removeEventListener("storage", on);
  }, []);

  const resync = useCallback(async () => {
    const cur = linesRef.current;
    if (!cur.length) {
      setShippingOptions([]);
      return;
    }
    setSyncing(true);
    try {
      const res = await priceCart(cur.map((l) => ({ productId: l.productId, quantity: l.quantity })));
      const { lines: priced, dropped, shipping } = readPriced(res);
      const byId = new Map<string, AnyRec>();
      priced.forEach((p) => {
        const id = (p.productId ?? (p.product as AnyRec | undefined)?.id) as string | undefined;
        if (id) byId.set(id, p);
      });
      const droppedIds = new Map<string, string>();
      dropped.forEach((d) => {
        const id = d.productId as string | undefined;
        if (id) droppedIds.set(id, String(d.reason ?? "Unavailable"));
      });
      let changed: string | null = null;
      const next: CartLine[] = [];
      for (const l of linesRef.current) {
        if (droppedIds.has(l.productId)) {
          changed = `${l.name} was removed: ${droppedIds.get(l.productId)}.`;
          continue;
        }
        const p = byId.get(l.productId);
        if (!p) {
          next.push(l);
          continue;
        }
        const unit = num(p.unitPriceCents) ?? num(p.priceCents) ?? num(p.unitPrice) ?? l.priceCents;
        const qty = Math.min(num(p.quantity) ?? l.quantity, l.quantity);
        if (unit !== l.priceCents) changed = `The price of ${l.name} was updated.`;
        if (qty < l.quantity) changed = `Only ${qty} of ${l.name} left in stock.`;
        const stock = num(p.stock) ?? l.stock;
        next.push({ ...l, priceCents: unit, quantity: Math.max(1, qty), stock });
      }
      setLines(next);
      if (shipping.length) setShippingOptions(shipping);
      if (changed) setNotice(changed);
    } catch {
      /* offline: keep the snapshot; checkout re-validates on the server anyway */
    } finally {
      setSyncing(false);
    }
  }, []);

  /* re-price once the stored cart has loaded */
  useEffect(() => {
    if (ready && linesRef.current.length) void resync();
  }, [ready, resync]);

  const add = useCallback((p: Product, qty = 1) => {
    setLines((cur) => {
      const found = cur.find((l) => l.productId === p.id);
      const cap = Math.min(MAX_QTY, Math.max(p.stock, 1));
      if (found) return cur.map((l) => (l.productId === p.id ? { ...l, quantity: Math.min(l.quantity + qty, cap), stock: p.stock } : l));
      return [
        ...cur,
        {
          productId: p.id,
          slug: p.slug,
          name: p.name,
          image: p.images.cutout,
          category: p.category.name,
          priceCents: p.priceCents,
          stock: p.stock,
          quantity: Math.min(qty, cap),
        },
      ];
    });
    setOpen(true);
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setLines((cur) =>
      cur.flatMap((l) => {
        if (l.productId !== id) return [l];
        if (qty < 1) return [];
        return [{ ...l, quantity: Math.min(qty, MAX_QTY, Math.max(l.stock, 1)) }];
      }),
    );
  }, []);
  const remove = useCallback((id: string) => setLines((cur) => cur.filter((l) => l.productId !== id)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<Ctx>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotalCents: lines.reduce((n, l) => n + l.priceCents * l.quantity, 0),
      shippingOptions,
      ready,
      syncing,
      open,
      setOpen,
      add,
      setQty,
      remove,
      clear,
      resync,
      notice,
      dismissNotice: () => setNotice(null),
    }),
    [lines, shippingOptions, ready, syncing, open, add, setQty, remove, clear, resync, notice],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart must be used inside <CartProvider>");
  return c;
}
