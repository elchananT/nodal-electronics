import { db } from "./db";
import { pricedLine, shippingOptions, sumLines } from "./pricing";
import { Issues, asRecord } from "./validation";
import type { CartPriceResponse, PricedLine } from "./types";

export interface CartItemInput {
  productId: string;
  quantity: number;
}

const MAX_CART_LINES = 50;
const MAX_QUANTITY = 99;

/** Validates `{items:[{productId,quantity}]}` and merges duplicate product ids. */
export function parseCartItems(value: unknown, issues: Issues): CartItemInput[] {
  const body = asRecord(value, "body", issues);
  if (!body) return [];
  return parseItemsArray(body.items, "items", issues);
}

export function parseItemsArray(value: unknown, path: string, issues: Issues): CartItemInput[] {
  if (!Array.isArray(value) || value.length === 0) {
    issues.add(`${path}: must be a non-empty array`);
    return [];
  }
  if (value.length > MAX_CART_LINES) {
    issues.add(`${path}: must have at most ${MAX_CART_LINES} entries`);
    return [];
  }
  const merged = new Map<string, number>();
  value.forEach((entry, index) => {
    const item = asRecord(entry, `${path}[${index}]`, issues);
    if (!item) return;
    const productId = item.productId;
    const quantity = item.quantity;
    if (typeof productId !== "string" || productId.trim() === "") {
      issues.add(`${path}[${index}].productId: is required`);
      return;
    }
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      issues.add(`${path}[${index}].quantity: must be an integer from 1 to ${MAX_QUANTITY}`);
      return;
    }
    merged.set(productId.trim(), (merged.get(productId.trim()) ?? 0) + quantity);
  });
  return [...merged].map(([productId, quantity]) => ({ productId, quantity }));
}

/** Prices cart lines from the database. Unknown or unavailable lines are dropped with a reason. */
export async function priceCart(items: CartItemInput[]): Promise<CartPriceResponse> {
  const rows = await db.product.findMany({
    where: { id: { in: items.map((item) => item.productId) } },
    select: { id: true, slug: true, name: true, priceCents: true, stock: true },
  });
  const byId = new Map(rows.map((row) => [row.id, row]));
  const lines: PricedLine[] = [];
  const dropped: CartPriceResponse["dropped"] = [];

  for (const item of items) {
    const row = byId.get(item.productId);
    if (!row) {
      dropped.push({ productId: item.productId, reason: "Product not found" });
    } else if (row.stock <= 0) {
      dropped.push({ productId: item.productId, reason: `${row.name} is out of stock` });
    } else if (item.quantity > row.stock) {
      dropped.push({ productId: item.productId, reason: `Only ${row.stock} of ${row.name} left in stock` });
    } else {
      lines.push(pricedLine(row, item.quantity));
    }
  }

  const subtotalCents = sumLines(lines);
  return { lines, subtotalCents, shippingOptions: shippingOptions(subtotalCents), dropped };
}
