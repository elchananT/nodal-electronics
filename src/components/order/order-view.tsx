"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { ApiError, getOrder } from "@/lib/api";
import { money } from "@/lib/format";
import { SITE } from "@/lib/site";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PrimaryButton } from "@/components/site/primary-button";
import { EmptyState, ErrorState } from "@/components/site/states";
import { Totals } from "@/components/site/order-summary";

const STEPS = ["Order placed", "Packed", "Shipped", "Delivered"];

export function OrderView({ id }: { id: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [tick, setTick] = useState(0);
  const [placed, setPlaced] = useState("");

  useEffect(() => {
    const ac = new AbortController();
    getOrder(id, ac.signal).then(
      (o) => {
        setOrder(o);
        setPlaced(new Date(o.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }));
      },
      (e: ApiError) => { if (e.name !== "AbortError") setError(e); },
    );
    return () => ac.abort();
  }, [id, tick]);

  if (error) {
    return (
      <div className="px-6 pb-10 pt-40">
        {error.status === 404 ? <EmptyState title="Order not found" body="Check the link from your confirmation." /> : <ErrorState message={error.message} onRetry={() => { setError(null); setTick((t) => t + 1); }} />}
      </div>
    );
  }
  if (!order) return <div className="mx-auto max-w-3xl px-6 pt-36"><div className="skeleton h-[28rem]" aria-hidden /></div>;

  const s = order.shipping;
  return (
    <div className="mx-auto max-w-4xl px-6 pb-10 pt-32 md:px-12">
      <p className="eyebrow mb-4 text-arc-2">{SITE.demoNote}</p>
      <h1 className="text-page">Thank you, <span className="serif-accent text-gradient-light">{order.customer.name.split(" ")[0]}.</span></h1>
      <p className="mt-4 text-lg text-cream/75">
        Order <span className="font-mono text-cream">{order.id}</span>{placed && <> placed {placed}</>}. Delivery in {order.delivery.minDays}–{order.delivery.maxDays} business days. Nothing real will ship.
      </p>

      <ol className="mt-12 grid grid-cols-4 gap-2" aria-label="Order status">
        {STEPS.map((l, i) => (
          <li key={l} className="min-w-0">
            <div className="flex items-center">
              <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", i === 0 ? "bg-plasma text-ink" : "border border-cream/20 text-cream/40")}>
                {i === 0 ? <Check className="size-4" strokeWidth={3} /> : <span className="font-mono text-xs">{i + 1}</span>}
              </span>
              {i < STEPS.length - 1 && <span className={cn("ml-2 h-px flex-1", i === 0 ? "bg-gradient-to-r from-plasma to-cream/15" : "bg-cream/15")} />}
            </div>
            <p className={cn("mt-3 truncate text-sm", i === 0 ? "text-cream" : "text-cream/55")}>{l}</p>
          </li>
        ))}
      </ol>

      <div className="mt-12 grid gap-8 md:grid-cols-[1.4fr_1fr]">
        <section aria-label="Items" className="rounded-[2rem] border border-cream/10 bg-ink-2/60 p-6">
          <ul className="divide-y divide-cream/10">
            {order.lines.map((l) => (
              <li key={l.productId} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <span className="min-w-0">
                  <Link href={`/product/${l.slug}`} className="block truncate font-medium hover:underline">{l.name}</Link>
                  <span className="font-mono text-xs text-cream/60">{l.quantity} × {money(l.unitPriceCents)}</span>
                </span>
                <span className="font-mono">{money(l.lineTotalCents)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-cream/10 pt-6">
            <Totals subtotalCents={order.subtotalCents} shippingCents={order.shippingCents} totalCents={order.totalCents} shippingLabel={s.method === "express" ? "Express" : "Standard"} />
          </div>
        </section>
        <section aria-label="Delivery details" className="h-fit rounded-[2rem] border border-cream/10 bg-ink-2/60 p-6 text-cream/85">
          <p className="eyebrow mb-3 text-cream/55">Ship to</p>
          <address className="not-italic leading-relaxed">
            {order.customer.name}<br />{s.line1}<br />{s.line2 && <>{s.line2}<br /></>}{s.city}, {s.region} {s.postalCode}<br />{s.country}
          </address>
          <p className="eyebrow mb-3 mt-6 text-cream/55">Contact</p>
          <p className="break-all">{order.customer.email}</p>
        </section>
      </div>
      <div className="mt-10"><PrimaryButton href="/shop" size="lg">Continue shopping</PrimaryButton></div>
    </div>
  );
}
