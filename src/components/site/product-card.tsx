"use client";

import Link from "next/link";
import { Check, Plus, Scale } from "lucide-react";
import { motion } from "motion/react";
import { useCart } from "@/lib/cart";
import { MAX_COMPARE, useCompare } from "@/lib/compare";
import { money } from "@/lib/format";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductImage } from "./product-image";

export function Badge({ children, tone = "plasma" }: { children: React.ReactNode; tone?: "plasma" | "arc" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.12em]",
        tone === "plasma" ? "bg-plasma/15 text-plasma-2" : "bg-arc/15 text-arc-2",
      )}
    >
      {children}
    </span>
  );
}

export function ProductCard({ product: p, priority, className }: { product: Product; priority?: boolean; className?: string }) {
  const cart = useCart();
  const compare = useCompare();
  const inCompare = compare.has(p.slug);
  const out = p.stock <= 0;
  const onSale = p.compareAtCents && p.compareAtCents > p.priceCents;

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="room relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-cream/[0.06] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:-translate-y-1">
        <div className="room-floor" />
        <div className="absolute left-4 top-4 z-10 flex gap-2">
          {p.badge && <Badge tone={p.badge === "New" ? "arc" : "plasma"}>{p.badge}</Badge>}
          {out && <Badge>Sold out</Badge>}
        </div>
        <button
          type="button"
          onClick={() => compare.toggle(p.slug)}
          disabled={!inCompare && compare.slugs.length >= MAX_COMPARE}
          aria-pressed={inCompare}
          aria-label={inCompare ? `Remove ${p.name} from compare` : `Add ${p.name} to compare`}
          title={!inCompare && compare.slugs.length >= MAX_COMPARE ? "Compare is full (3)" : undefined}
          className={cn(
            "absolute right-3 top-3 z-20 grid size-10 place-items-center rounded-full transition-colors disabled:opacity-30",
            inCompare ? "bg-arc text-ink" : "text-cream/60 hover:bg-cream/10 hover:text-cream",
          )}
        >
          <Scale className="size-[18px]" strokeWidth={1.8} />
        </button>
        <motion.div className="absolute inset-[9%] top-[12%] bottom-[16%] transition-transform duration-[1.4s] ease-[var(--ease-out-expo)] group-hover:scale-[1.06] group-hover:[animation:float-y_5s_ease-in-out_infinite]">
          <ProductImage src={p.images.cutout} alt={`${p.name}`} sizes="(min-width:1024px) 22vw, (min-width:640px) 45vw, 90vw" priority={priority} />
        </motion.div>
        <button
          type="button"
          onClick={() => cart.add(p)}
          disabled={out}
          aria-label={`Add ${p.name} to cart`}
          className="absolute bottom-4 right-4 z-20 grid size-11 place-items-center rounded-full bg-cream text-ink transition-all duration-500 ease-[var(--ease-spring)] hover:scale-110 disabled:opacity-40 disabled:hover:scale-100 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:focus-visible:translate-y-0 sm:focus-visible:opacity-100"
        >
          <Plus className="size-5" strokeWidth={2.2} />
        </button>
      </div>
      <div className="flex items-start justify-between gap-3 px-2 pt-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-medium leading-tight tracking-[-0.01em]">
            <Link href={`/product/${p.slug}`} className="after:absolute after:inset-0 after:z-10 after:rounded-[2rem] after:content-['']">
              {p.name}
            </Link>
          </h3>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-cream/55">{p.category.name}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-[0.95rem]">{money(p.priceCents, true)}</p>
          {onSale && <p className="font-mono text-xs text-cream/50 line-through">{money(p.compareAtCents!, true)}</p>}
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden>
      <div className="skeleton aspect-[4/5] rounded-[2rem]" />
      <div className="flex justify-between px-2 pt-4">
        <div className="space-y-2"><div className="skeleton h-5 w-36" /><div className="skeleton h-3 w-20" /></div>
        <div className="skeleton h-5 w-14" />
      </div>
    </div>
  );
}

export function AddedCheck() {
  return <Check className="size-4" />;
}
