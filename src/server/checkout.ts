import { randomInt } from "node:crypto";
import { Prisma } from "@prisma/client";
import { parseItemsArray, type CartItemInput } from "./cart";
import { db } from "./db";
import { NotFoundError, StockConflictError, ValidationError } from "./errors";
import { deliveryWindow, pricedLine, shippingCostCents, SHIPPING_METHODS, sumLines } from "./pricing";
import {
  Issues,
  asRecord,
  optionalString,
  oneOf,
  requiredCountry,
  requiredEmail,
  requiredPostalCode,
  requiredString,
} from "./validation";
import type { Address, Order, PricedLine, ShippingMethod } from "./types";

export interface CheckoutInput {
  items: CartItemInput[];
  customer: { name: string; email: string };
  shipping: Address;
  method: ShippingMethod;
}

const ORDER_ID_PREFIX = "NDL-";
const ORDER_ID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const ORDER_ID_PATTERN = /^NDL-[A-Z0-9]{10}$/;
const MAX_ATTEMPTS = 4;

export function parseCheckoutInput(value: unknown): CheckoutInput {
  const issues = new Issues();
  const body = asRecord(value, "body", issues);
  if (!body) {
    issues.throwIfAny();
  }
  const items = parseItemsArray(body?.items, "items", issues);

  const customer = asRecord(body?.customer, "customer", issues);
  const name = requiredString(customer?.name, "customer.name", issues, { max: 120 });
  const email = requiredEmail(customer?.email, "customer.email", issues);

  const shippingRaw = asRecord(body?.shipping, "shipping", issues);
  const line1 = requiredString(shippingRaw?.line1, "shipping.line1", issues, { max: 120 });
  const line2 = optionalString(shippingRaw?.line2, "shipping.line2", issues, { max: 120 });
  const city = requiredString(shippingRaw?.city, "shipping.city", issues, { max: 80 });
  const region = requiredString(shippingRaw?.region, "shipping.region", issues, { max: 80 });
  const country = requiredCountry(shippingRaw?.country, "shipping.country", issues);
  const postalCode = requiredPostalCode(shippingRaw?.postalCode, country, "shipping.postalCode", issues);

  const method = oneOf(body?.method, "method", SHIPPING_METHODS, issues);

  issues.throwIfAny();
  if (!name || !email || !line1 || !city || !region || !country || !postalCode || !method) {
    throw new ValidationError(["body: is incomplete"]);
  }
  return {
    items,
    customer: { name, email },
    shipping: { line1, line2, city, region, postalCode, country },
    method,
  };
}

export function generateOrderId(): string {
  let suffix = "";
  for (let i = 0; i < 10; i += 1) {
    suffix += ORDER_ID_ALPHABET[randomInt(ORDER_ID_ALPHABET.length)];
  }
  return `${ORDER_ID_PREFIX}${suffix}`;
}

function isRetryable(error: unknown): boolean {
  // P2034: transaction write conflict or SQLite busy. P2002: generated order id collided.
  return error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2034" || error.code === "P2002");
}

/** Creates an order. Stock is decremented inside the same transaction; any shortage rolls everything back. */
export async function createOrder(input: CheckoutInput): Promise<Order> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await placeOrder(input);
    } catch (error) {
      if (!isRetryable(error) || attempt >= MAX_ATTEMPTS) throw error;
    }
  }
}

async function placeOrder(input: CheckoutInput): Promise<Order> {
  return db.$transaction(async (tx) => {
    const productIds = input.items.map((item) => item.productId);
    const rows = await tx.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, slug: true, name: true, priceCents: true, stock: true },
    });
    const byId = new Map(rows.map((row) => [row.id, row]));

    const unknown = productIds.filter((id) => !byId.has(id));
    if (unknown.length > 0) {
      throw new ValidationError(unknown.map((id) => `items: unknown product ${id}`));
    }

    const shortages = input.items.flatMap((item) => {
      const row = byId.get(item.productId);
      if (!row || row.stock >= item.quantity) return [];
      return [{ productId: row.id, slug: row.slug, name: row.name, requested: item.quantity, available: row.stock }];
    });
    if (shortages.length > 0) throw new StockConflictError(shortages);

    const lines: PricedLine[] = [];
    for (const item of input.items) {
      const row = byId.get(item.productId);
      if (!row) continue;
      const decremented = await tx.product.updateMany({
        where: { id: row.id, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (decremented.count === 0) {
        const current = await tx.product.findUniqueOrThrow({ where: { id: row.id }, select: { stock: true } });
        throw new StockConflictError([
          { productId: row.id, slug: row.slug, name: row.name, requested: item.quantity, available: current.stock },
        ]);
      }
      lines.push(pricedLine(row, item.quantity));
    }

    const subtotalCents = sumLines(lines);
    const shippingCents = shippingCostCents(input.method, subtotalCents);
    const row = await tx.order.create({
      data: {
        id: generateOrderId(),
        customerName: input.customer.name,
        customerEmail: input.customer.email,
        shipLine1: input.shipping.line1,
        shipLine2: input.shipping.line2 ?? null,
        shipCity: input.shipping.city,
        shipRegion: input.shipping.region,
        shipPostalCode: input.shipping.postalCode,
        shipCountry: input.shipping.country,
        method: input.method,
        shippingCents,
        subtotalCents,
        totalCents: subtotalCents + shippingCents,
        lines: {
          create: lines.map((line) => ({
            productId: line.productId,
            productName: line.name,
            unitPriceCents: line.unitPriceCents,
            quantity: line.quantity,
          })),
        },
      },
      include: { lines: { include: { product: { select: { slug: true } } } } },
    });
    return mapOrder(row);
  });
}

export async function getOrder(id: string): Promise<Order> {
  if (!ORDER_ID_PATTERN.test(id)) throw new NotFoundError("Order not found");
  const row = await db.order.findUnique({
    where: { id },
    include: { lines: { include: { product: { select: { slug: true } } } } },
  });
  if (!row) throw new NotFoundError("Order not found");
  return mapOrder(row);
}

type OrderRow = Prisma.OrderGetPayload<{ include: { lines: { include: { product: { select: { slug: true } } } } } }>;

function mapOrder(row: OrderRow): Order {
  const method = SHIPPING_METHODS.find((candidate) => candidate === row.method);
  if (!method) throw new Error(`Unknown shipping method stored on order ${row.id}`);
  const shipping: Order["shipping"] = {
    line1: row.shipLine1,
    city: row.shipCity,
    region: row.shipRegion,
    postalCode: row.shipPostalCode,
    country: row.shipCountry,
    method,
  };
  if (row.shipLine2 !== null) shipping.line2 = row.shipLine2;
  return {
    id: row.id,
    status: "placed",
    createdAt: row.createdAt.toISOString(),
    customer: { name: row.customerName, email: row.customerEmail },
    shipping,
    delivery: deliveryWindow(method),
    lines: row.lines.map((line) => ({
      productId: line.productId,
      slug: line.product.slug,
      name: line.productName,
      unitPriceCents: line.unitPriceCents,
      quantity: line.quantity,
      lineTotalCents: line.unitPriceCents * line.quantity,
    })),
    subtotalCents: row.subtotalCents,
    shippingCents: row.shippingCents,
    totalCents: row.totalCents,
  };
}
