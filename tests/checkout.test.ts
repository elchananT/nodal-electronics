import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { setupTestDatabase } from "./helpers/test-db";

let teardown: () => Promise<void>;
let checkout: typeof import("../src/server/checkout");
let errors: typeof import("../src/server/errors");
let idBySlug: Map<string, string>;

const SHIPPING = {
  line1: "1 Main St",
  city: "Springfield",
  region: "IL",
  postalCode: "62701",
  country: "US",
};
const CUSTOMER = { name: "Ada Lovelace", email: "ada@example.com" };

async function stockOf(slug: string): Promise<number> {
  const { db } = await import("../src/server/db");
  return (await db.product.findUniqueOrThrow({ where: { slug } })).stock;
}

async function setStock(slug: string, stock: number): Promise<void> {
  const { db } = await import("../src/server/db");
  await db.product.update({ where: { slug }, data: { stock } });
}

before(async () => {
  teardown = await setupTestDatabase();
  checkout = await import("../src/server/checkout");
  errors = await import("../src/server/errors");
  const { db } = await import("../src/server/db");
  const rows = await db.product.findMany({ select: { id: true, slug: true } });
  idBySlug = new Map(rows.map((row) => [row.slug, row.id]));
});

after(async () => {
  await teardown();
});

function input(items: { slug: string; quantity: number }[], method: "standard" | "express" = "standard") {
  return {
    items: items.map((item) => ({ productId: idBySlug.get(item.slug) as string, quantity: item.quantity })),
    customer: CUSTOMER,
    shipping: SHIPPING,
    method,
  };
}

describe("order creation", () => {
  it("recomputes totals server-side and waives standard shipping above $75", async () => {
    const order = await checkout.createOrder(
      input([
        { slug: "halo-anc-headphones", quantity: 1 },
        { slug: "pebble-buds", quantity: 1 },
      ]),
    );
    assert.match(order.id, /^NDL-[A-Z0-9]{10}$/);
    assert.equal(order.status, "placed");
    assert.equal(order.subtotalCents, 37800);
    assert.equal(order.shippingCents, 0);
    assert.equal(order.totalCents, 37800);
    assert.deepEqual(order.delivery, { minDays: 3, maxDays: 5 });
  });

  it("charges $6.90 standard shipping at or below the threshold and $18 express", async () => {
    const standard = await checkout.createOrder(input([{ slug: "slab-140-charger", quantity: 1 }]));
    assert.equal(standard.shippingCents, 690);
    assert.equal(standard.totalCents, 6900 + 690);
    const express = await checkout.createOrder(input([{ slug: "slab-140-charger", quantity: 1 }], "express"));
    assert.equal(express.shippingCents, 1800);
    const free = await checkout.createOrder(input([{ slug: "pebble-buds", quantity: 1 }]));
    assert.equal(free.shippingCents, 0);
    assert.deepEqual(express.delivery, { minDays: 1, maxDays: 2 });
  });

  it("snapshots line names and prices and decrements stock", async () => {
    const before = await stockOf("cairn-speaker");
    const order = await checkout.createOrder(input([{ slug: "cairn-speaker", quantity: 2 }]));
    assert.equal(order.lines[0].name, "Cairn Portable Speaker");
    assert.equal(order.lines[0].unitPriceCents, 14900);
    assert.equal(order.lines[0].lineTotalCents, 29800);
    assert.equal(await stockOf("cairn-speaker"), before - 2);
    const fetched = await checkout.getOrder(order.id);
    assert.deepEqual(fetched, order);
  });

  it("rejects an order that lacks stock for one line and changes nothing", async () => {
    await setStock("vault-ssd", 1);
    const beforeHalo = await stockOf("halo-anc-headphones");
    await assert.rejects(
      checkout.createOrder(
        input([
          { slug: "halo-anc-headphones", quantity: 1 },
          { slug: "vault-ssd", quantity: 5 },
        ]),
      ),
      (error: unknown) =>
        error instanceof errors.StockConflictError &&
        error.lines.length === 1 &&
        error.lines[0].slug === "vault-ssd" &&
        error.lines[0].available === 1 &&
        error.message.includes("Vault SSD 2 TB (wanted 5, 1 left)"),
    );
    assert.equal(await stockOf("halo-anc-headphones"), beforeHalo);
    assert.equal(await stockOf("vault-ssd"), 1);
    await setStock("vault-ssd", 3);
  });

  it("allows exactly one of two concurrent checkouts for the last unit", async () => {
    for (let round = 0; round < 3; round += 1) {
      await setStock("meridian-16-studio", 1);
      const results = await Promise.allSettled([
        checkout.createOrder(input([{ slug: "meridian-16-studio", quantity: 1 }])),
        checkout.createOrder(input([{ slug: "meridian-16-studio", quantity: 1 }])),
      ]);
      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");
      assert.equal(fulfilled.length, 1, `round ${round}: expected one success`);
      assert.equal(rejected.length, 1, `round ${round}: expected one failure`);
      assert.ok(rejected[0].status === "rejected" && rejected[0].reason instanceof errors.StockConflictError);
      assert.equal(await stockOf("meridian-16-studio"), 0);
    }
  });

  it("returns NotFoundError for malformed or unknown order ids", async () => {
    await assert.rejects(checkout.getOrder("NDL-DOESNOTEXIST"), errors.NotFoundError);
    await assert.rejects(checkout.getOrder("../etc/passwd"), errors.NotFoundError);
  });
});

describe("checkout validation", () => {
  it("lists every invalid field at once", () => {
    assert.throws(
      () =>
        checkout.parseCheckoutInput({
          items: [{ productId: "x", quantity: 1 }],
          customer: { name: "", email: "not-an-email" },
          shipping: { line1: "1 Main", city: "X", region: "IL", postalCode: "abc", country: "US" },
          method: "overnight",
        }),
      (error: unknown) => {
        if (!(error instanceof errors.ValidationError)) return false;
        const text = error.issues.join(" | ");
        return (
          text.includes("customer.name") &&
          text.includes("customer.email") &&
          text.includes("shipping.postalCode") &&
          text.includes("method")
        );
      },
    );
  });

  it("accepts a non-US postal code with a generic pattern", () => {
    const parsed = checkout.parseCheckoutInput({
      items: [{ productId: "x", quantity: 1 }],
      customer: CUSTOMER,
      shipping: { line1: "10 High St", city: "London", region: "England", postalCode: "SW1A 1AA", country: "GB" },
      method: "express",
    });
    assert.equal(parsed.shipping.country, "GB");
  });
});
