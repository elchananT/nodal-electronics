"use client";

import { money } from "@/lib/format";
import { SITE } from "@/lib/site";
import type { ShippingMethod, ShippingOption } from "@/lib/types";

/** Shipping rules mirror the server (it recomputes everything on checkout anyway). */
export function shippingFor(method: ShippingMethod, subtotalCents: number, options: ShippingOption[]) {
  const o = options.find((x) => x.method === method);
  if (o) return { cents: o.priceCents, label: o.label, minDays: o.minDays, maxDays: o.maxDays };
  if (method === "express") return { cents: 1800, label: "Express", minDays: 1, maxDays: 2 };
  return { cents: subtotalCents > SITE.freeShippingOverCents ? 0 : 690, label: "Standard", minDays: 3, maxDays: 5 };
}

export function Totals({ subtotalCents, shippingCents, totalCents, shippingLabel }: { subtotalCents: number; shippingCents: number | null; totalCents?: number; shippingLabel?: string }) {
  const total = totalCents ?? subtotalCents + (shippingCents ?? 0);
  return (
    <dl className="space-y-3 text-[0.97rem]">
      <div className="flex justify-between"><dt className="text-cream/70">Subtotal</dt><dd className="font-mono">{money(subtotalCents)}</dd></div>
      <div className="flex justify-between">
        <dt className="text-cream/70">Shipping{shippingLabel ? ` · ${shippingLabel}` : ""}</dt>
        <dd className="font-mono">{shippingCents == null ? "—" : shippingCents === 0 ? "Free" : money(shippingCents)}</dd>
      </div>
      <div className="flex justify-between"><dt className="text-cream/70">Tax</dt><dd className="font-mono text-cream/70">None</dd></div>
      <div className="flex items-baseline justify-between border-t border-cream/10 pt-4 text-lg"><dt>Total</dt><dd className="font-mono text-2xl">{money(total)}</dd></div>
    </dl>
  );
}
