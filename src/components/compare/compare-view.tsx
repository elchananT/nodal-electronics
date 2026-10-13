"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, X } from "lucide-react";
import { MAX_COMPARE, useCompare } from "@/lib/compare";
import { useCart } from "@/lib/cart";
import { useCatalog } from "@/lib/use-catalog";
import { formatHours, formatWeight, money } from "@/lib/format";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PrimaryButton } from "@/components/site/primary-button";
import { ProductImage } from "@/components/site/product-image";
import { EmptyState, ErrorState } from "@/components/site/states";

type Row = { label: string; cell: (p: Product) => string; score?: (p: Product) => number | null; better?: "high" | "low" };

export function CompareView() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const compare = useCompare();
  const cart = useCart();
  const { items, error, retry } = useCatalog();

  const urlSlugs = useMemo(
    () => (sp.get("items") ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, MAX_COMPARE),
    [sp],
  );
  const slugs = urlSlugs.length ? urlSlugs : compare.slugs;

  /* keep the URL shareable and the saved list in step with it */
  useEffect(() => {
    if (urlSlugs.length) {
      if (urlSlugs.join() !== compare.slugs.join()) compare.set(urlSlugs);
    } else if (compare.slugs.length) {
      router.replace(`${pathname}?items=${compare.slugs.join(",")}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSlugs.join(), compare.slugs.join()]);

  const setSlugs = (next: string[]) => {
    compare.set(next);
    router.replace(next.length ? `${pathname}?items=${next.join(",")}` : pathname, { scroll: false });
  };

  const products = useMemo(
    () => (items ? slugs.map((s) => items.find((p) => p.slug === s)).filter((p): p is Product => !!p) : []),
    [items, slugs],
  );

  const rows: Row[] = useMemo(() => {
    const base: Row[] = [
      { label: "Price", cell: (p) => money(p.priceCents), score: (p) => p.priceCents, better: "low" },
      { label: "Battery", cell: (p) => (p.battery ? formatHours(p.battery.hours) : "—"), score: (p) => p.battery?.hours ?? null, better: "high" },
      { label: "Weight", cell: (p) => (p.weightGrams ? formatWeight(p.weightGrams) : "—"), score: (p) => p.weightGrams ?? null, better: "low" },
    ];
    const skip = new Set(["battery", "weight"]);
    const keys = Array.from(new Set(products.flatMap((p) => Object.keys(p.specs)))).filter((k) => !skip.has(k.toLowerCase()));
    return [...base, ...keys.map((k): Row => ({ label: k, cell: (p) => (p.specs[k] != null ? String(p.specs[k]) : "—") }))];
  }, [products]);

  const winner = (r: Row) => {
    if (!r.score || products.length < 2) return null;
    const vals = products.map((p) => r.score!(p));
    const present = vals.filter((v): v is number => v != null);
    if (present.length < 2) return null;
    const best = r.better === "high" ? Math.max(...present) : Math.min(...present);
    if (present.every((v) => v === best)) return null;
    return best;
  };

  const addable = (items ?? []).filter((p) => !slugs.includes(p.slug));

  return (
    <div className="mx-auto max-w-[1440px] px-6 pb-10 pt-32 md:px-12">
      <h1 className="text-page mb-10">Compare <span className="serif-accent text-gradient-light">side by side.</span></h1>

      {error ? (
        <ErrorState message={error} onRetry={retry} />
      ) : !items ? (
        <div className="skeleton h-96" aria-hidden />
      ) : products.length === 0 ? (
        <>
          <EmptyState title="Nothing to compare yet" body="Add up to three products with the scale icon on any product." />
        </>
      ) : (
        <div className="overflow-x-auto rounded-[2rem] border border-cream/10 bg-ink-2/50 [scrollbar-width:thin]">
          <table className="w-full min-w-[40rem] border-collapse text-left">
            <caption className="sr-only">Product comparison</caption>
            <thead>
              <tr>
                <th scope="col" className="sticky left-0 z-10 w-36 bg-ink-2 p-4 align-bottom md:w-48" />
                {products.map((p) => (
                  <th key={p.id} scope="col" className="min-w-[13rem] p-4 align-top font-normal">
                    <div className="room relative aspect-[5/4] overflow-hidden rounded-[1.6rem]">
                      <div className="room-floor" />
                      <button onClick={() => setSlugs(slugs.filter((s) => s !== p.slug))} aria-label={`Remove ${p.name} from comparison`} className="absolute right-2 top-2 z-10 grid size-9 place-items-center rounded-full text-cream/70 hover:bg-cream/10 hover:text-cream"><X className="size-4" /></button>
                      <div className="absolute inset-[10%]"><ProductImage src={p.images.cutout} alt="" sizes="260px" /></div>
                    </div>
                    <Link href={`/product/${p.slug}`} className="mt-4 block font-[family-name:var(--font-display)] text-xl font-medium leading-tight hover:underline">{p.name}</Link>
                    <p className="mt-1 text-sm text-cream/65">{p.category.name}</p>
                    <div className="mt-3">
                      <button onClick={() => cart.add(p)} disabled={p.stock <= 0} className="rounded-full border border-cream/20 px-4 py-2 text-sm hover:border-cream/50 disabled:opacity-40">{p.stock <= 0 ? "Sold out" : "Add to cart"}</button>
                    </div>
                  </th>
                ))}
                {products.length < MAX_COMPARE && (
                  <th scope="col" className="min-w-[13rem] p-4 align-top font-normal">
                    <label className="relative flex aspect-[5/4] cursor-pointer flex-col items-center justify-center gap-2 rounded-[1.6rem] border border-dashed border-cream/20 text-cream/70 transition-colors focus-within:border-arc hover:border-cream/45">
                      <Plus className="size-6" />
                      <span className="text-sm">Add a product</span>
                      <select
                        aria-label="Add a product to compare"
                        value=""
                        onChange={(e) => e.target.value && setSlugs([...slugs, e.target.value])}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      >
                        <option value="">Add a product</option>
                        {addable.map((p) => <option key={p.id} value={p.slug}>{p.name}</option>)}
                      </select>
                    </label>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const best = winner(r);
                return (
                  <tr key={r.label} className="border-t border-cream/10">
                    <th scope="row" className="sticky left-0 z-10 bg-ink-2 p-4 text-sm font-normal text-cream/65">{r.label}</th>
                    {products.map((p) => {
                      const win = best != null && r.score!(p) === best;
                      return (
                        <td key={p.id} className={cn("p-4 font-mono text-[0.92rem]", win && "text-plasma-2")}>
                          <span className="inline-flex items-center gap-2">
                            {win && <i aria-hidden className="size-1.5 rounded-full bg-plasma" />}
                            {r.cell(p)}
                            {win && <span className="sr-only"> (best)</span>}
                          </span>
                        </td>
                      );
                    })}
                    {products.length < MAX_COMPARE && <td />}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {products.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-3">
          <PrimaryButton href="/shop">Keep browsing</PrimaryButton>
          <button onClick={() => setSlugs([])} className="rounded-full px-5 text-cream/70 underline-offset-4 hover:text-cream hover:underline">Clear comparison</button>
        </div>
      )}
    </div>
  );
}
