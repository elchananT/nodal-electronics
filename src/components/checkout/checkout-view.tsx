"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, placeOrder } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/format";
import { SITE } from "@/lib/site";
import type { ShippingMethod } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LazyMetalButton } from "@/components/site/lazy";
import { ProductImage } from "@/components/site/product-image";
import { EmptyState } from "@/components/site/states";
import { Totals, shippingFor } from "@/components/site/order-summary";

const COUNTRIES = [
  ["US", "United States"], ["CA", "Canada"], ["GB", "United Kingdom"], ["DE", "Germany"], ["FR", "France"],
  ["ES", "Spain"], ["IT", "Italy"], ["NL", "Netherlands"], ["IL", "Israel"], ["AU", "Australia"],
] as const;

type Form = { name: string; email: string; line1: string; line2: string; city: string; region: string; postalCode: string; country: string };
type Errors = Partial<Record<keyof Form, string>>;
const EMPTY: Form = { name: "", email: "", line1: "", line2: "", city: "", region: "", postalCode: "", country: "US" };

function validate(f: Form): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name = "Enter your full name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "Enter a valid email address";
  if (!f.line1.trim()) e.line1 = "Enter a street address";
  if (!f.city.trim()) e.city = "Enter a city";
  if (!f.region.trim()) e.region = "Enter a state or region";
  const z = f.postalCode.trim();
  if (f.country === "US" ? !/^\d{5}(-\d{4})?$/.test(z) : !/^[A-Za-z0-9][A-Za-z0-9 -]{1,8}[A-Za-z0-9]$/.test(z)) {
    e.postalCode = f.country === "US" ? "Use a ZIP code like 10001" : "Enter a valid postal code";
  }
  return e;
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm text-cream/75">{label}</label>
      {children}
      <p id={`${id}-err`} role={error ? "alert" : undefined} className="mt-1.5 min-h-5 text-sm text-plasma-2">{error ?? ""}</p>
    </div>
  );
}

const input = "h-13 w-full rounded-2xl border bg-ink-2 px-4 text-cream placeholder:text-cream/40 transition-colors focus:outline-none";

export function CheckoutView() {
  const cart = useCart();
  const router = useRouter();
  const [f, setF] = useState<Form>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<keyof Form, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<Errors>({});
  const [method, setMethod] = useState<ShippingMethod>("standard");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const done = useRef(false);

  const { resync, ready } = cart;
  useEffect(() => { if (ready) void resync(); }, [ready, resync]);

  const errors = { ...validate(f), ...serverErrors };
  const show = (k: keyof Form) => (touched[k] ? errors[k] : serverErrors[k]);
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setF((p) => ({ ...p, [k]: e.target.value }));
    if (serverErrors[k]) setServerErrors((s) => ({ ...s, [k]: undefined }));
  };
  const props = (k: keyof Form, autoComplete: string) => ({
    id: k,
    name: k,
    value: f[k],
    autoComplete,
    onChange: set(k),
    onBlur: () => setTouched((t) => ({ ...t, [k]: true })),
    "aria-invalid": show(k) ? true : undefined,
    "aria-describedby": `${k}-err`,
    className: cn(input, show(k) ? "border-plasma" : "border-cream/15 focus:border-arc"),
  });

  const std = shippingFor("standard", cart.subtotalCents, cart.shippingOptions);
  const exp = shippingFor("express", cart.subtotalCents, cart.shippingOptions);
  const chosen = method === "express" ? exp : std;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, line1: true, city: true, region: true, postalCode: true });
    setFormError(null);
    const v = validate(f);
    if (Object.keys(v).length) {
      const first = Object.keys(v)[0];
      document.getElementById(first)?.focus();
      return;
    }
    setBusy(true);
    try {
      const order = await placeOrder({
        items: cart.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        customer: { name: f.name.trim(), email: f.email.trim() },
        shipping: { line1: f.line1.trim(), ...(f.line2.trim() ? { line2: f.line2.trim() } : {}), city: f.city.trim(), region: f.region.trim(), postalCode: f.postalCode.trim(), country: f.country },
        method,
      });
      done.current = true;
      cart.clear();
      router.push(`/order/${order.id}`);
    } catch (err) {
      const a = err as ApiError;
      if (a.status === 409) {
        setFormError("Some items just sold out or are low on stock. We've updated your cart, please review it.");
        void cart.resync();
      } else if (a.status === 400 && Array.isArray(a.details)) {
        const next: Errors = {};
        for (const d of a.details as string[]) {
          const m = /^(?:customer|shipping)\.(\w+): (.+)$/.exec(d);
          if (m && m[1] in EMPTY) next[m[1] as keyof Form] = m[2];
        }
        setServerErrors(next);
        setFormError(Object.keys(next).length ? "Please fix the highlighted fields." : a.message);
      } else {
        setFormError(a.message || "We couldn't place your order. Please try again.");
      }
      setBusy(false);
    }
  };

  if (!cart.ready) return <div className="mx-auto max-w-[1100px] px-6 pt-36"><div className="skeleton h-96" aria-hidden /></div>;
  if (cart.lines.length === 0 && !done.current) {
    return <div className="px-6 pb-10 pt-40"><EmptyState title="Your cart is empty" body="Add something before checking out." /></div>;
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-10 pt-32 md:px-12">
      <h1 className="text-page mb-3">Checkout</h1>
      <p className="mb-10 text-cream/70">{SITE.demoNote}. No card details are asked for or stored.</p>

      <form onSubmit={submit} noValidate className="grid gap-12 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
        <div className="space-y-10">
          <fieldset>
            <legend className="mb-5 text-2xl font-medium">Contact</legend>
            <div className="grid gap-x-5 sm:grid-cols-2">
              <Field id="name" label="Full name" error={show("name")}><input {...props("name", "name")} /></Field>
              <Field id="email" label="Email" error={show("email")}><input type="email" inputMode="email" {...props("email", "email")} /></Field>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-5 text-2xl font-medium">Shipping address</legend>
            <Field id="line1" label="Address" error={show("line1")}><input {...props("line1", "address-line1")} /></Field>
            <Field id="line2" label="Apartment, suite (optional)"><input {...props("line2", "address-line2")} /></Field>
            <div className="grid gap-x-5 sm:grid-cols-2">
              <Field id="city" label="City" error={show("city")}><input {...props("city", "address-level2")} /></Field>
              <Field id="region" label="State / region" error={show("region")}><input {...props("region", "address-level1")} /></Field>
              <Field id="postalCode" label="Postal code" error={show("postalCode")}><input inputMode="text" {...props("postalCode", "postal-code")} /></Field>
              <Field id="country" label="Country">
                <select {...props("country", "country")}>
                  {COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
                </select>
              </Field>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-5 text-2xl font-medium">Delivery</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {([["standard", std], ["express", exp]] as const).map(([m, s]) => (
                <label key={m} className={cn("flex cursor-pointer items-center justify-between gap-4 rounded-[1.5rem] border p-5 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-arc", method === m ? "border-cream bg-cream/[0.05]" : "border-cream/15 hover:border-cream/35")}>
                  <span className="flex items-center gap-3">
                    <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} className="size-4 accent-[#ff3d81]" />
                    <span>
                      <span className="block font-medium">{s.label}</span>
                      <span className="block text-sm text-cream/65">{s.minDays}–{s.maxDays} business days</span>
                    </span>
                  </span>
                  <span className="font-mono">{s.cents === 0 ? "Free" : money(s.cents)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <aside className="h-fit rounded-[2rem] border border-cream/10 bg-ink-2/60 p-6 lg:sticky lg:top-28">
          <h2 className="mb-5 text-2xl font-medium">Order summary</h2>
          <ul className="mb-6 space-y-4">
            {cart.lines.map((l) => (
              <li key={l.productId} className="flex items-center gap-4">
                <span className="room relative block size-16 shrink-0 overflow-hidden rounded-xl"><ProductImage src={l.image} alt="" sizes="64px" className="p-1.5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{l.name}</span>
                  <span className="block font-mono text-xs text-cream/60">Qty {l.quantity}</span>
                </span>
                <span className="font-mono text-sm">{money(l.priceCents * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <Totals subtotalCents={cart.subtotalCents} shippingCents={chosen.cents} shippingLabel={chosen.label} />
          {formError && <p role="alert" className="mt-5 rounded-2xl bg-plasma/10 px-4 py-3 text-plasma-2">{formError}{" "}{formError.includes("cart") && <Link href="/cart" className="underline">Review cart</Link>}</p>}
          <div className="mt-6 flex justify-center">
            <LazyMetalButton busy={busy}>{busy ? "Placing order…" : "Place demo order"}</LazyMetalButton>
          </div>
          <p className="mt-4 text-center text-sm text-cream/60">{SITE.demoNote}.</p>
        </aside>
      </form>
    </div>
  );
}
