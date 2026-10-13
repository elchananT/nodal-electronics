"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { getProducts, type ProductQuery } from "@/lib/api";
import type { ProductList } from "@/lib/types";
import { CATEGORIES } from "@/lib/site";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ProductCard, ProductCardSkeleton } from "@/components/site/product-card";
import { EmptyState, ErrorState } from "@/components/site/states";

const SORTS = [
  { v: "featured", l: "Featured" },
  { v: "newest", l: "Newest" },
  { v: "price-asc", l: "Price, low to high" },
  { v: "price-desc", l: "Price, high to low" },
  { v: "battery", l: "Battery life" },
];
const PAGE_SIZE = 12;

export function ShopSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] px-6 pb-10 pt-32 md:px-12">
      <div className="skeleton mb-10 h-16 w-64" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    </div>
  );
}

function intParam(v: string | null) {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

export function ShopView() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  /* URL is the source of truth. Prices live in the URL as whole dollars. */
  const category = sp.get("category") ?? "";
  const q = sp.get("q") ?? "";
  const sort = SORTS.some((s) => s.v === sp.get("sort")) ? sp.get("sort")! : "featured";
  const inStock = sp.get("inStock") === "true";
  const minUsd = intParam(sp.get("min"));
  const maxUsd = intParam(sp.get("max"));
  const page = Math.max(1, intParam(sp.get("page")) ?? 1);

  const [data, setData] = useState<ProductList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const facetsRef = useRef<ProductList["facets"] | null>(null);

  const update = useCallback(
    (patch: Record<string, string | number | boolean | null | undefined>, resetPage = true) => {
      const p = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === undefined || v === "" || v === false) p.delete(k);
        else p.set(k, String(v));
      }
      if (resetPage && !("page" in patch)) p.delete("page");
      if (p.get("sort") === "featured") p.delete("sort");
      const s = p.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [sp, router, pathname],
  );

  const query: ProductQuery = useMemo(
    () => ({
      category: category || undefined,
      q: q || undefined,
      minPrice: minUsd != null ? minUsd * 100 : undefined,
      maxPrice: maxUsd != null ? maxUsd * 100 : undefined,
      inStock: inStock || undefined,
      sort,
      page,
      pageSize: PAGE_SIZE,
    }),
    [category, q, minUsd, maxUsd, inStock, sort, page],
  );
  const queryKey = JSON.stringify(query);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    getProducts(JSON.parse(queryKey) as ProductQuery, ac.signal).then(
      (r) => {
        setData(r);
        setError(null);
        setLoading(false);
        if (!facetsRef.current || !category) facetsRef.current = r.facets;
      },
      (e: Error) => {
        if (e.name === "AbortError") return;
        setError(e.message);
        setLoading(false);
      },
    );
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, retryTick]);

  /* search box: local text, debounced into the URL */
  const [qText, setQText] = useState(q);
  useEffect(() => setQText(q), [q]);
  useEffect(() => {
    if (qText === q) return;
    const t = setTimeout(() => update({ q: qText.trim() }), 350);
    return () => clearTimeout(t);
  }, [qText, q, update]);

  /* price range: local while dragging, committed after a pause */
  const facets = data?.facets ?? facetsRef.current;
  const lo = facets ? Math.floor(facets.priceMin / 100) : 0;
  const hi = facets ? Math.ceil(facets.priceMax / 100) : 2000;
  const [range, setRange] = useState<[number, number]>([minUsd ?? lo, maxUsd ?? hi]);
  useEffect(() => setRange([minUsd ?? lo, maxUsd ?? hi]), [minUsd, maxUsd, lo, hi]);
  const commitRange = (r: [number, number]) => {
    update({ min: r[0] > lo ? r[0] : null, max: r[1] < hi ? r[1] : null });
  };
  const rangeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRange = (r: [number, number]) => {
    setRange(r);
    if (rangeTimer.current) clearTimeout(rangeTimer.current);
    rangeTimer.current = setTimeout(() => commitRange(r), 450);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const activeFilters =
    (category ? 1 : 0) + (q ? 1 : 0) + (minUsd != null || maxUsd != null ? 1 : 0) + (inStock ? 1 : 0);
  const clearAll = () => update({ category: null, q: null, min: null, max: null, inStock: null });
  const catName = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;

  const filterPanel = (
    <div className="space-y-8">
      <div>
        <p className="eyebrow mb-3 text-cream/60">Category</p>
        <ul className="space-y-1">
          {[{ slug: "", name: "All products" }, ...CATEGORIES].map((c) => {
            const count = c.slug ? facets?.categories.find((f) => f.slug === c.slug)?.count : facets?.categories.reduce((n, f) => n + f.count, 0);
            const on = category === c.slug;
            return (
              <li key={c.slug || "all"}>
                <button
                  onClick={() => update({ category: c.slug || null })}
                  aria-pressed={on}
                  className={cn("flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors", on ? "bg-cream text-ink" : "text-cream/80 hover:bg-cream/5")}
                >
                  <span>{c.name}</span>
                  {count != null && <span className={cn("font-mono text-xs", on ? "text-ink/70" : "text-cream/55")}>{count}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <p className="eyebrow mb-3 text-cream/60">Price</p>
        <div className="mb-1 flex justify-between font-mono text-sm">
          <span>{money(range[0] * 100, true)}</span>
          <span>{money(range[1] * 100, true)}</span>
        </div>
        <div className="relative h-6">
          <div className="absolute inset-x-0 top-[10.5px] h-[3px] rounded-full bg-cream/15" />
          <div
            className="absolute top-[10.5px] h-[3px] rounded-full bg-gradient-to-r from-plasma to-arc"
            style={{ left: `${((range[0] - lo) / Math.max(hi - lo, 1)) * 100}%`, right: `${100 - ((range[1] - lo) / Math.max(hi - lo, 1)) * 100}%` }}
          />
          <input type="range" className="range" min={lo} max={hi} step={10} value={range[0]} aria-label="Minimum price"
            onChange={(e) => onRange([Math.min(Number(e.target.value), range[1] - 10), range[1]])} />
          <input type="range" className="range" min={lo} max={hi} step={10} value={range[1]} aria-label="Maximum price"
            onChange={(e) => onRange([range[0], Math.max(Number(e.target.value), range[0] + 10)])} />
        </div>
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-cream/5">
        <span className="text-cream/85">In stock only</span>
        <input type="checkbox" checked={inStock} onChange={(e) => update({ inStock: e.target.checked })} className="size-5 accent-[#ff3d81]" />
      </label>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1440px] px-6 pb-10 pt-32 md:px-12">
      <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <h1 className="text-page">
          {category ? catName(category) : <>The <span className="serif-accent text-gradient-light">shop.</span></>}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative block">
            <span className="sr-only">Search the shop</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-cream/55" />
            <input
              type="search"
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              placeholder="Search"
              className="h-12 w-44 rounded-full border border-cream/15 bg-transparent pl-10 pr-4 text-cream placeholder:text-cream/50 focus:border-arc focus:outline-none sm:w-56"
            />
          </label>
          <label className="relative block">
            <span className="sr-only">Sort by</span>
            <select
              value={sort}
              onChange={(e) => update({ sort: e.target.value })}
              className="h-12 appearance-none rounded-full border border-cream/15 bg-ink-2 pl-5 pr-10 text-cream focus:border-arc focus:outline-none"
            >
              {SORTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
            <ChevronRight className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 rotate-90 text-cream/60" />
          </label>
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
            className="flex h-12 items-center gap-2 rounded-full border border-cream/15 px-5 text-cream/90 lg:hidden"
          >
            <SlidersHorizontal className="size-4" /> Filters{activeFilters > 0 && <span className="font-mono text-xs text-arc-2">{activeFilters}</span>}
          </button>
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[15rem_1fr] xl:gap-14">
        <aside className={cn("lg:block", filtersOpen ? "block" : "hidden")} aria-label="Filters">
          <div className="rounded-[2rem] border border-cream/10 bg-ink-2/60 p-5 lg:sticky lg:top-28 lg:border-0 lg:bg-transparent lg:p-0">{filterPanel}</div>
        </aside>

        <div className="min-w-0">
          <div className="mb-6 flex min-h-10 flex-wrap items-center gap-2" aria-live="polite">
            <span className="mr-2 font-mono text-sm text-cream/65">{data ? `${data.total} ${data.total === 1 ? "product" : "products"}` : ""}</span>
            {category && <Chip onClear={() => update({ category: null })}>{catName(category)}</Chip>}
            {q && <Chip onClear={() => update({ q: null })}>&ldquo;{q}&rdquo;</Chip>}
            {(minUsd != null || maxUsd != null) && <Chip onClear={() => update({ min: null, max: null })}>{money((minUsd ?? lo) * 100, true)} – {money((maxUsd ?? hi) * 100, true)}</Chip>}
            {inStock && <Chip onClear={() => update({ inStock: null })}>In stock</Chip>}
            {activeFilters > 1 && <button onClick={clearAll} className="px-2 text-sm text-cream/65 underline-offset-4 hover:text-cream hover:underline">Clear all</button>}
          </div>

          {error ? (
            <ErrorState message={error} onRetry={() => setRetryTick((t) => t + 1)} />
          ) : !data ? (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-10 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <li key={i}><ProductCardSkeleton /></li>)}
            </ul>
          ) : data.items.length === 0 ? (
            <EmptyState title="Nothing matches" body="Try a wider price range or remove a filter." href="/shop" cta="Clear filters" />
          ) : (
            <ul className={cn("grid grid-cols-2 gap-x-4 gap-y-10 transition-opacity duration-300 xl:grid-cols-3", loading && "opacity-60")}>
              {data.items.map((p, i) => (
                <li key={p.id}><ProductCard product={p} priority={i < 3} /></li>
              ))}
            </ul>
          )}

          {data && totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-2">
              <button onClick={() => update({ page: page - 1 }, false)} disabled={page <= 1} aria-label="Previous page" className="grid size-11 place-items-center rounded-full border border-cream/15 disabled:opacity-30"><ChevronLeft className="size-5" /></button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => update({ page: i + 1 }, false)} aria-current={page === i + 1 ? "page" : undefined} className={cn("grid size-11 place-items-center rounded-full font-mono text-sm", page === i + 1 ? "bg-cream text-ink" : "text-cream/75 hover:bg-cream/10")}>{i + 1}</button>
              ))}
              <button onClick={() => update({ page: page + 1 }, false)} disabled={page >= totalPages} aria-label="Next page" className="grid size-11 place-items-center rounded-full border border-cream/15 disabled:opacity-30"><ChevronRight className="size-5" /></button>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-cream/10 py-1 pl-3.5 pr-1 text-sm">
      {children}
      <button onClick={onClear} aria-label="Remove filter" className="grid size-7 place-items-center rounded-full hover:bg-cream/15"><X className="size-3.5" /></button>
    </span>
  );
}
