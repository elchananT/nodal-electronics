import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { setupTestDatabase } from "./helpers/test-db";

let teardown: () => Promise<void>;
let pricing: typeof import("../src/server/pricing");
let cart: typeof import("../src/server/cart");
let productIdBySlug: Map<string, string>;

before(async () => {
  teardown = await setupTestDatabase();
  pricing = await import("../src/server/pricing");
  cart = await import("../src/server/cart");
  const { db } = await import("../src/server/db");
  const rows = await db.product.findMany({ select: { id: true, slug: true } });
  productIdBySlug = new Map(rows.map((row) => [row.slug, row.id]));
});

after(async () => {
  await teardown();
});

describe("shipping rules", () => {
  it("charges standard shipping at $6.90 up to and including $75", () => {
    assert.equal(pricing.shippingCostCents("standard", 7500), 690);
    assert.equal(pricing.shippingCostCents("standard", 1000), 690);
  });

  it("makes standard shipping free strictly over $75", () => {
    assert.equal(pricing.shippingCostCents("standard", 7501), 0);
  });

  it("always charges $18 for express", () => {
    assert.equal(pricing.shippingCostCents("express", 0), 1800);
    assert.equal(pricing.shippingCostCents("express", 100000), 1800);
  });

  it("returns both options with delivery windows", () => {
    const options = pricing.shippingOptions(6900);
    assert.deepEqual(
      options.map((o) => [o.method, o.priceCents, o.minDays, o.maxDays]),
      [
        ["standard", 690, 3, 5],
        ["express", 1800, 1, 2],
      ],
    );
  });
});

describe("cart pricing", () => {
  it("prices known lines from the database and drops unknown ones with a reason", async () => {
    const pebble = productIdBySlug.get("pebble-buds") as string;
    const result = await cart.priceCart([
      { productId: pebble, quantity: 2 },
      { productId: "does-not-exist", quantity: 1 },
    ]);
    assert.equal(result.lines.length, 1);
    assert.equal(result.lines[0].unitPriceCents, 12900);
    assert.equal(result.subtotalCents, 25800);
    assert.deepEqual(result.dropped, [{ productId: "does-not-exist", reason: "Product not found" }]);
  });

  it("drops a line whose quantity exceeds stock, naming the remaining stock", async () => {
    const { db } = await import("../src/server/db");
    const id = productIdBySlug.get("vault-ssd") as string;
    const result = await cart.priceCart([{ productId: id, quantity: 5 }]);
    assert.equal(result.lines.length, 0);
    assert.match(result.dropped[0].reason, /Only 3 of Vault SSD 2 TB left in stock/);
    assert.ok(await db.product.findUnique({ where: { id } }));
  });

  it("merges duplicate product ids when parsing", async () => {
    const { Issues } = await import("../src/server/validation");
    const id = productIdBySlug.get("pebble-buds") as string;
    const issues = new Issues();
    const items = cart.parseCartItems({ items: [{ productId: id, quantity: 1 }, { productId: id, quantity: 2 }] }, issues);
    assert.deepEqual(items, [{ productId: id, quantity: 3 }]);
  });
});
