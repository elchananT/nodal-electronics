"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Liquid } from "liquid-gooey";
import { useMounted } from "@/components/site/hooks";
import { Reveal } from "@/components/site/reveal";
import { ErrorState } from "@/components/site/states";
import { CATEGORIES } from "@/lib/site";
import { formatHours, formatWeight, money } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useCatalog } from "@/lib/use-catalog";
import { cn } from "@/lib/utils";

type MetricKey = "battery" | "weight" | "price";
const METRICS: Record<MetricKey, { label: string; value: (p: Product) => number | null; fmt: (n: number) => string; better: "high" | "low"; note: string }> = {
  battery: { label: "Battery", value: (p) => p.battery?.hours ?? null, fmt: formatHours, better: "high", note: "Longest first" },
  weight: { label: "Weight", value: (p) => p.weightGrams ?? null, fmt: formatWeight, better: "low", note: "Lightest first" },
  price: { label: "Price", value: (p) => p.priceCents, fmt: (n) => money(n, true), better: "low", note: "Lowest first" },
};
const ORDER: MetricKey[] = ["battery", "weight", "price"];
const ROW = 72; // px per row
const SLOTS = 7;
const TAB_W = 112;

export function SpecLab() {
  const { items, error, retry } = useCatalog();
  const [metric, setMetric] = useState<MetricKey>("battery");
  const [cat, setCat] = useState<string>("all");
  const m = METRICS[metric];
  const mounted = useMounted();

  const ranked = useMemo(() => {
    if (!items) return [];
    return items
      .filter((p) => (cat === "all" || p.category.slug === cat) && m.value(p) != null)
      .sort((a, b) => (m.better === "high" ? m.value(b)! - m.value(a)! : m.value(a)! - m.value(b)!))
      .slice(0, SLOTS);
  }, [items, cat, m]);

  const rank = new Map(ranked.map((p, i) => [p.id, i]));
  const max = ranked.reduce((n, p) => Math.max(n, m.value(p)!), 1);

  return (
    <section id="lab" aria-labelledby="lab-h" className="relative z-10 mx-2 rounded-[var(--radius-section)] bg-cream px-4 py-20 text-ink md:mx-4 md:px-8 md:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="min-w-0">
          <Reveal>
            <p className="eyebrow mb-5 text-plasma-deep">Spec lab</p>
            <h2 id="lab-h" className="text-section">
              Numbers, <span className="serif-accent text-arc-deep">side by side.</span>
            </h2>
            <p className="mt-6 max-w-sm text-lg leading-relaxed text-ink/70">Every figure comes straight from the catalog.</p>
          </Reveal>

          <Reveal delay={0.1} className="mt-10">
            <div className="relative w-fit max-w-full rounded-full bg-ink p-1" style={{ width: TAB_W * 3 + 8, height: 52 }}>
              {mounted && <Liquid fill="#f4efe6" blur={8} contrast={16} style={{ position: "absolute", left: 4, top: 4, width: TAB_W * 3, height: 44, pointerEvents: "none" }}>
                <Liquid.Item effect="move" style={{ position: "absolute", left: 0, top: 0 }}>
                  <div
                    aria-hidden
                    style={{ width: TAB_W, height: 44, borderRadius: 999, transform: `translateX(${ORDER.indexOf(metric) * TAB_W}px)`, transition: "transform .7s cubic-bezier(.16,1,.3,1)" }}
                  />
                </Liquid.Item>
              </Liquid>}
              <div role="tablist" aria-label="Metric" className="relative z-10 flex">
                {ORDER.map((k) => (
                  <button
                    key={k}
                    role="tab"
                    aria-selected={metric === k}
                    onClick={() => setMetric(k)}
                    style={{ width: TAB_W, height: 44 }}
                    className={cn("rounded-full text-[0.95rem] font-medium transition-colors duration-500", metric === k ? "text-ink" : "text-cream/75 hover:text-cream", !mounted && metric === k && "bg-cream")}
                  >
                    {METRICS[k].label}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Category">
            {[{ slug: "all", name: "All" }, ...CATEGORIES].map((c) => (
              <button
                key={c.slug}
                onClick={() => setCat(c.slug)}
                aria-pressed={cat === c.slug}
                className={cn(
                  "rounded-full border px-4 py-2 text-[0.9rem] transition-colors duration-300",
                  cat === c.slug ? "border-ink bg-ink text-cream" : "border-ink/15 text-ink/75 hover:border-ink/40 hover:text-ink",
                )}
              >
                {c.name}
              </button>
            ))}
          </Reveal>
        </div>

        <Reveal delay={0.1} className="min-w-0">
          <div className="rounded-[2.4rem] bg-ink p-5 text-cream shadow-[0_50px_100px_-50px_rgba(12,13,16,.7)] md:p-8">
            <div className="mb-4 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-cream/60">
              <span>{m.label}</span>
              <span>{m.note}</span>
            </div>
            {error ? (
              <ErrorState message={error} onRetry={retry} />
            ) : !items ? (
              <div className="space-y-3" style={{ height: ROW * SLOTS }} aria-hidden>
                {Array.from({ length: SLOTS }).map((_, i) => <div key={i} className="skeleton" style={{ height: ROW - 12 }} />)}
              </div>
            ) : (
              <ul className="relative" style={{ height: ROW * SLOTS }}>
                {ranked.length === 0 && <li className="absolute inset-0 grid place-items-center text-cream/65">No products with this spec here.</li>}
                {items.map((p) => {
                  const r = rank.get(p.id);
                  const shown = r != null;
                  const v = shown ? m.value(p)! : 0;
                  return (
                    <li
                      key={p.id}
                      className="absolute inset-x-0 top-0 transition-[transform,opacity] duration-[900ms] ease-[var(--ease-out-expo)]"
                      style={{ height: ROW, transform: `translateY(${(r ?? SLOTS) * ROW}px)`, opacity: shown ? 1 : 0, pointerEvents: shown ? "auto" : "none", visibility: shown ? "visible" : "hidden", transitionProperty: "transform, opacity, visibility" }}
                    >
                      <Link href={`/product/${p.slug}`} tabIndex={shown ? 0 : -1} className="group flex h-full items-center gap-4 rounded-2xl px-2 hover:bg-cream/[0.04]">
                        <span className="room relative block size-12 shrink-0 overflow-hidden rounded-xl">
                          <Image src={p.images.cutout} alt="" fill sizes="48px" className="object-contain p-1" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-3">
                            <span className="truncate font-medium">{p.name}</span>
                            <span className={cn("shrink-0 font-mono text-sm tabular-nums", r === 0 ? "text-plasma-2" : "text-cream/80")}>{m.fmt(v)}</span>
                          </span>
                          <span className="mt-2 block h-2 overflow-hidden rounded-full bg-cream/10">
                            <span
                              className={cn("block h-full origin-left rounded-full transition-transform duration-[1100ms] ease-[var(--ease-out-expo)]", r === 0 ? "bg-gradient-to-r from-plasma to-plasma-2" : "bg-gradient-to-r from-arc-deep to-arc")}
                              style={{ width: "100%", transform: `scaleX(${shown ? Math.max(Math.sqrt(v / max), 0.04) : 0})` }}
                            />
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
