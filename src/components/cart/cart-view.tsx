"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { MAX_QTY, useCart } from "@/lib/cart";
import { money } from "@/lib/format";
import { SITE } from "@/lib/site";
import { PrimaryButton } from "@/components/site/primary-button";
import { ProductImage } from "@/components/site/product-image";
import { QtyStepper } from "@/components/site/qty-stepper";
import { EmptyState } from "@/components/site/states";
import { Totals, shippingFor } from "@/components/site/order-summary";

export function CartView() {
  const cart = useCart();
  const ship = shippingFor("standard", cart.subtotalCents, cart.shippingOptions);
  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-10 pt-32 md:px-12">
      <h1 className="text-page mb-10">Your <span className="serif-accent text-gradient-light">cart.</span></h1>
      {!cart.ready ? (
        <div className="skeleton h-64" aria-hidden />
      ) : cart.lines.length === 0 ? (
        <EmptyState title="Your cart is empty" body="Nothing here yet." />
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
          <div>
            {cart.notice && (
              <div role="status" className="mb-4 flex items-start justify-between gap-3 rounded-2xl bg-arc/10 px-4 py-3 text-arc-2">
                <span>{cart.notice}</span>
                <button onClick={cart.dismissNotice} aria-label="Dismiss"><X className="size-4" /></button>
              </div>
            )}
            <ul className="space-y-4">
              <AnimatePresence initial={false}>
                {cart.lines.map((l) => (
                  <motion.li key={l.productId} layout exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="flex gap-4 rounded-[2rem] border border-cream/10 bg-ink-2/60 p-3 sm:gap-6 sm:p-4">
                    <Link href={`/product/${l.slug}`} className="room relative block size-28 shrink-0 overflow-hidden rounded-[1.4rem] sm:size-36">
                      <ProductImage src={l.image} alt={l.name} sizes="144px" className="p-3" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                      <div className="flex justify-between gap-3">
                        <div className="min-w-0">
                          <Link href={`/product/${l.slug}`} className="block font-[family-name:var(--font-display)] text-xl font-medium leading-tight hover:underline">{l.name}</Link>
                          <p className="mt-1 font-mono text-xs uppercase tracking-[0.1em] text-cream/55">{l.category}</p>
                        </div>
                        <p className="shrink-0 font-mono">{money(l.priceCents * l.quantity)}</p>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <QtyStepper value={l.quantity} onChange={(n) => cart.setQty(l.productId, n)} max={Math.min(MAX_QTY, Math.max(l.stock, 1))} label={l.name} />
                        <button onClick={() => cart.remove(l.productId)} className="px-2 py-1 text-sm text-cream/65 underline-offset-4 hover:text-cream hover:underline" aria-label={`Remove ${l.name}`}>Remove</button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
          <aside className="h-fit rounded-[2rem] border border-cream/10 bg-ink-2/60 p-6 lg:sticky lg:top-28">
            <h2 className="mb-5 text-2xl font-medium">Summary</h2>
            <Totals subtotalCents={cart.subtotalCents} shippingCents={ship.cents} shippingLabel={ship.label} />
            <p className="mt-4 text-sm text-cream/60">
              Free standard shipping over {money(SITE.freeShippingOverCents, true)}. Express is chosen at checkout.
            </p>
            <div className="mt-6"><PrimaryButton href="/checkout" size="lg" full>Checkout</PrimaryButton></div>
            <Link href="/shop" className="mt-4 block text-center text-sm text-cream/70 underline-offset-4 hover:text-cream hover:underline">Keep shopping</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
