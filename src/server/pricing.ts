// Money rules. All amounts are integer cents. Tax is not applied (demo store).
import type { PricedLine, ShippingMethod, ShippingOption } from "./types";

export const FREE_STANDARD_SHIPPING_OVER_CENTS = 7500;

const SHIPPING_RULES: Record<ShippingMethod, { label: string; standardCents: number; minDays: number; maxDays: number }> = {
  standard: { label: "Standard shipping", standardCents: 690, minDays: 3, maxDays: 5 },
  express: { label: "Express shipping", standardCents: 1800, minDays: 1, maxDays: 2 },
};

export const SHIPPING_METHODS = Object.keys(SHIPPING_RULES) as ShippingMethod[];

/** Standard is free when the subtotal is strictly over $75. Express is always $18. */
export function shippingCostCents(method: ShippingMethod, subtotalCents: number): number {
  if (method === "standard" && subtotalCents > FREE_STANDARD_SHIPPING_OVER_CENTS) return 0;
  return SHIPPING_RULES[method].standardCents;
}

export function shippingOptions(subtotalCents: number): ShippingOption[] {
  return SHIPPING_METHODS.map((method) => ({
    method,
    label: SHIPPING_RULES[method].label,
    priceCents: shippingCostCents(method, subtotalCents),
    minDays: SHIPPING_RULES[method].minDays,
    maxDays: SHIPPING_RULES[method].maxDays,
  }));
}

export function deliveryWindow(method: ShippingMethod): { minDays: number; maxDays: number } {
  return { minDays: SHIPPING_RULES[method].minDays, maxDays: SHIPPING_RULES[method].maxDays };
}

export function pricedLine(
  product: { id: string; slug: string; name: string; priceCents: number },
  quantity: number,
): PricedLine {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    unitPriceCents: product.priceCents,
    quantity,
    lineTotalCents: product.priceCents * quantity,
  };
}

export function sumLines(lines: PricedLine[]): number {
  return lines.reduce((total, line) => total + line.lineTotalCents, 0);
}
