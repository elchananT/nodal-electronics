"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { Check, ChevronRight, Scale, Truck } from "lucide-react";
import { ApiError, getProduct } from "@/lib/api";
import { MAX_QTY, useCart } from "@/lib/cart";
import { MAX_COMPARE, useCompare } from "@/lib/compare";
import { money } from "@/lib/format";
import { SITE } from "@/lib/site";
import type { ProductWithRelated } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge, ProductCard } from "@/components/site/product-card";
import { PrimaryButton } from "@/components/site/primary-button";
import { ProductImage } from "@/components/site/product-image";
import { QtyStepper } from "@/components/site/qty-stepper";
import { EmptyState, ErrorState } from "@/components/site/states";
import { Reveal } from "@/components/site/reveal";

export function ProductSkeleton() {
  return (
    <div className="mx-auto grid max-w-[1440px] gap-10 px-6 pb-16 pt-32 md:px-12 lg:grid-cols-2">
      <div className="skeleton aspect-square rounded-[2.5rem]" />
      <div className="space-y-5 pt-6">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton h-16 w-3/4" />
        <div className="skeleton h-6 w-1/2" />
        <div className="skeleton h-10 w-32" />
        <div className="skeleton h-40 w-full" />
      </div>
    </div>
  );
}

function Stage({ src, name }: { src: string; name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 80, damping: 20 });
  const sy = useSpring(my, { stiffness: 80, damping: 20 });
  const rx = useTransform(sy, (v) => v * -6);
  const ry = useTransform(sx, (v) => v * 8);
  const tx = useTransform(sx, (v) => v * 14);
  const ty = useTransform(sy, (v) => v * 10);
  return (
    <div
      ref={ref}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = ref.current!.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
        my.set(((e.clientY - r.top) / r.height) * 2 - 1);
      }}
      onPointerLeave={() => { mx.set(0); my.set(0); }}
      className="room relative aspect-square overflow-hidden rounded-[2.5rem] border border-cream/[0.06] [perspective:1200px]"
    >
      <div className="room-floor" />
      <motion.div style={{ rotateX: rx, rotateY: ry, x: tx, y: ty }} className="absolute inset-[10%] bottom-[14%]">
        <ProductImage src={src} alt={name} sizes="(min-width:1024px) 48vw, 100vw" priority />
      </motion.div>
    </div>
  );
}

export function ProductView({ slug }: { slug: string }) {
  const cart = useCart();
  const compare = useCompare();
  const [p, setP] = useState<ProductWithRelated | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [qty, setQty] = useState(1);
  const [tick, setTick] = useState(0);
  const buyRef = useRef<HTMLDivElement>(null);
  const [buyVisible, setBuyVisible] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    setP(null);
    setError(null);
    setQty(1);
    getProduct(slug, ac.signal).then(
      (r) => { setP(r); document.title = `${r.name} — Nodal`; },
      (e: ApiError) => { if (e.name !== "AbortError") setError(e); },
    );
    return () => ac.abort();
  }, [slug, tick]);

  useEffect(() => {
    const el = buyRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setBuyVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [p]);

  if (error) {
    return (
      <div className="px-6 pb-10 pt-40">
        {error.status === 404 ? (
          <EmptyState title="That product doesn't exist" body="It may have been renamed or removed." />
        ) : (
          <ErrorState message={error.message} onRetry={() => setTick((t) => t + 1)} />
        )}
      </div>
    );
  }
  if (!p) return <ProductSkeleton />;

  const out = p.stock <= 0;
  const maxQty = Math.min(MAX_QTY, Math.max(p.stock, 1));
  const inCompare = compare.has(p.slug);
  const onSale = p.compareAtCents && p.compareAtCents > p.priceCents;
  const stockText = out ? "Sold out" : p.stock <= 5 ? `Only ${p.stock} left` : "In stock";

  return (
    <div className="pb-10">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-6 pt-28 md:px-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:pt-32">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="lg:sticky lg:top-28 lg:self-start">
          <Stage src={p.images.cutout} name={p.name} />
        </motion.div>

        <div className="min-w-0 lg:pt-6">
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-cream/60">
            <Link href="/shop" className="hover:text-cream">Shop</Link>
            <ChevronRight className="size-3" />
            <Link href={`/shop?category=${p.category.slug}`} className="hover:text-cream">{p.category.name}</Link>
          </nav>
          <div className="mb-4 flex gap-2">
            {p.badge && <Badge tone={p.badge === "New" ? "arc" : "plasma"}>{p.badge}</Badge>}
          </div>
          <h1 className="text-page">{p.name}</h1>
          <p className="mt-4 max-w-md text-xl text-cream/75">{p.tagline}</p>

          <div className="mt-8 flex items-baseline gap-4">
            <span className="font-mono text-3xl">{money(p.priceCents)}</span>
            {onSale && <span className="font-mono text-lg text-cream/50 line-through">{money(p.compareAtCents!)}</span>}
          </div>
          <p className={cn("mt-2 flex items-center gap-2 text-sm", out ? "text-plasma-2" : p.stock <= 5 ? "text-plasma-2" : "text-cream/65")}>
            <i className={cn("size-1.5 rounded-full", out || p.stock <= 5 ? "bg-plasma" : "bg-arc")} /> {stockText}
          </p>

          <ul className="mt-8 space-y-3">
            {p.highlights.map((h) => (
              <li key={h} className="flex gap-3 text-cream/85"><Check className="mt-1 size-4 shrink-0 text-arc" />{h}</li>
            ))}
          </ul>

          <div ref={buyRef} className="mt-10 flex flex-wrap items-center gap-3">
            <QtyStepper value={qty} onChange={(n) => setQty(Math.min(Math.max(n, 1), maxQty))} max={maxQty} label={p.name} className="h-14 [&_button]:size-11" />
            <PrimaryButton size="lg" type="button" disabled={out} onClick={() => cart.add(p, qty)}>
              {out ? "Sold out" : `Add to cart · ${money(p.priceCents * qty, true)}`}
            </PrimaryButton>
            <button
              type="button"
              onClick={() => compare.toggle(p.slug)}
              disabled={!inCompare && compare.slugs.length >= MAX_COMPARE}
              aria-pressed={inCompare}
              className={cn("flex h-14 items-center gap-2 rounded-full border px-6 transition-colors disabled:opacity-40", inCompare ? "border-arc bg-arc/10 text-arc-2" : "border-cream/20 text-cream/85 hover:border-cream/50")}
            >
              <Scale className="size-4" /> {inCompare ? "In compare" : "Compare"}
            </button>
          </div>
          {inCompare && compare.slugs.length > 1 && (
            <Link href={`/compare?items=${compare.slugs.join(",")}`} className="mt-4 inline-block text-arc-2 underline-offset-4 hover:underline">
              Open comparison ({compare.slugs.length})
            </Link>
          )}
          <p className="mt-6 flex items-center gap-2 text-sm text-cream/65">
            <Truck className="size-4" /> Free standard shipping over {money(SITE.freeShippingOverCents, true)}. {SITE.demoNote}.
          </p>
        </div>
      </div>

      <section aria-labelledby="specs" className="mx-auto mt-20 grid max-w-[1440px] gap-10 px-6 md:px-12 lg:mt-28 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <Reveal>
          <h2 id="specs" className="text-section">Specs</h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-cream/75">{p.description}</p>
        </Reveal>
        <Reveal delay={0.08}>
          <dl className="divide-y divide-cream/10 rounded-[2rem] border border-cream/10 bg-ink-2/60 px-6 py-2 md:px-8">
            {Object.entries(p.specs).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6 py-4">
                <dt className="text-cream/65">{k}</dt>
                <dd className="text-right font-mono text-[0.95rem]">{String(v)}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      {p.related.length > 0 && (
        <section aria-labelledby="related" className="mx-auto mt-24 max-w-[1440px] px-6 md:px-12 lg:mt-32">
          <Reveal><h2 id="related" className="text-section mb-10">More in <span className="serif-accent text-gradient-light">{p.category.name.toLowerCase()}.</span></h2></Reveal>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {p.related.slice(0, 4).map((r) => <li key={r.id}><ProductCard product={r} /></li>)}
          </ul>
        </section>
      )}

      {/* sticky buy bar, phones only, once the main buttons scroll away */}
      <div
        className={cn(
          "fixed inset-x-3 bottom-3 z-40 flex items-center justify-between gap-3 rounded-full border border-cream/10 bg-ink-2/95 py-2 pl-6 pr-2 shadow-[0_20px_60px_-10px_rgba(0,0,0,.8)] backdrop-blur-md transition-all duration-500 lg:hidden",
          buyVisible ? "pointer-events-none translate-y-24 opacity-0" : "translate-y-0 opacity-100",
        )}
        aria-hidden={buyVisible}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{p.name}</p>
          <p className="font-mono text-sm text-cream/75">{money(p.priceCents)}</p>
        </div>
        <PrimaryButton type="button" disabled={out} onClick={() => cart.add(p, qty)} tabIndex={buyVisible ? -1 : 0}>
          {out ? "Sold out" : "Add to cart"}
        </PrimaryButton>
      </div>
    </div>
  );
}
