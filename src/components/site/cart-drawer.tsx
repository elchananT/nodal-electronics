"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ShoppingBag, X } from "lucide-react";
import { MAX_QTY, useCart } from "@/lib/cart";
import { money } from "@/lib/format";
import { SITE } from "@/lib/site";
import { PrimaryButton } from "./primary-button";
import { ProductImage } from "./product-image";
import { QtyStepper } from "./qty-stepper";

export function CartDrawer() {
  const cart = useCart();
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!cart.open) return;
    lastFocus.current = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus();
    window.__lenis?.stop();
    const on = (e: KeyboardEvent) => {
      if (e.key === "Escape") cart.setOpen(false);
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>("a[href],button:not([disabled]),input,select,[tabindex]:not([tabindex='-1'])");
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", on);
    return () => {
      document.removeEventListener("keydown", on);
      window.__lenis?.start();
      lastFocus.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.open]);

  const left = Math.max(0, SITE.freeShippingOverCents - cart.subtotalCents);

  return (
    <AnimatePresence>
      {cart.open && (
        <div className="fixed inset-0 z-[70]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink/70"
            onClick={() => cart.setOpen(false)}
            aria-hidden
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="Your cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-y-2 right-2 flex w-[calc(100%-1rem)] max-w-[28rem] flex-col rounded-[2rem] border border-cream/10 bg-ink-2 shadow-[0_40px_120px_-30px_rgba(0,0,0,.8)]"
          >
            <div className="flex items-center justify-between px-6 pb-3 pt-5">
              <h2 className="text-2xl font-medium">Cart <span className="font-mono text-sm text-cream/60">{cart.count}</span></h2>
              <button ref={closeBtn} onClick={() => cart.setOpen(false)} aria-label="Close cart" className="grid size-11 place-items-center rounded-full text-cream/80 hover:bg-cream/10">
                <X className="size-5" />
              </button>
            </div>

            {cart.notice && (
              <div role="status" className="mx-6 mb-2 flex items-start justify-between gap-3 rounded-2xl bg-arc/10 px-4 py-3 text-sm text-arc-2">
                <span>{cart.notice}</span>
                <button onClick={cart.dismissNotice} aria-label="Dismiss" className="shrink-0 text-arc-2/80 hover:text-arc-2"><X className="size-4" /></button>
              </div>
            )}

            {cart.lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
                <span className="grid size-16 place-items-center rounded-full bg-cream/5"><ShoppingBag className="size-7 text-cream/60" strokeWidth={1.5} /></span>
                <p className="text-xl font-medium">Your cart is empty</p>
                <PrimaryButton href="/shop" onClick={() => cart.setOpen(false)}>Browse the shop</PrimaryButton>
              </div>
            ) : (
              <>
                <ul data-lenis-prevent className="flex-1 space-y-3 overflow-y-auto px-4 py-2">
                  <AnimatePresence initial={false}>
                    {cart.lines.map((l) => (
                      <motion.li
                        key={l.productId}
                        layout
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="flex gap-4 rounded-[1.5rem] bg-ink-3/70 p-3"
                      >
                        <Link href={`/product/${l.slug}`} onClick={() => cart.setOpen(false)} className="room relative block size-24 shrink-0 overflow-hidden rounded-[1.1rem]">
                          <ProductImage src={l.image} alt="" sizes="96px" className="p-2" />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div className="flex justify-between gap-2">
                            <Link href={`/product/${l.slug}`} onClick={() => cart.setOpen(false)} className="min-w-0 font-medium leading-tight hover:underline">{l.name}</Link>
                            <span className="shrink-0 font-mono text-sm">{money(l.priceCents * l.quantity)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <QtyStepper value={l.quantity} onChange={(n) => cart.setQty(l.productId, n)} max={Math.min(MAX_QTY, Math.max(l.stock, 1))} label={l.name} />
                            <button onClick={() => cart.remove(l.productId)} className="rounded-full px-2 py-1 text-sm text-cream/60 underline-offset-4 hover:text-cream hover:underline" aria-label={`Remove ${l.name}`}>Remove</button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                <div className="space-y-4 border-t border-cream/10 px-6 pb-6 pt-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-cream/70">Subtotal</span>
                    <span className="font-mono text-lg">{money(cart.subtotalCents)}</span>
                  </div>
                  <p className="text-sm text-cream/60">
                    {left > 0 ? `${money(left)} more for free standard shipping.` : "Standard shipping is free on this order."} No tax charged.
                  </p>
                  <PrimaryButton href="/checkout" size="lg" full onClick={() => cart.setOpen(false)}>Checkout</PrimaryButton>
                  <Link href="/cart" onClick={() => cart.setOpen(false)} className="block text-center text-sm text-cream/70 underline-offset-4 hover:text-cream hover:underline">View full cart</Link>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
