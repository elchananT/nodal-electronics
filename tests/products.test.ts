import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { setupTestDatabase } from "./helpers/test-db";

let teardown: () => Promise<void>;
let products: typeof import("../src/server/products");
let errors: typeof import("../src/server/errors");

before(async () => {
  teardown = await setupTestDatabase();
  products = await import("../src/server/products");
  errors = await import("../src/server/errors");
});

after(async () => {
  await teardown();
});

function list(query: string) {
  return products.listProducts(products.parseProductListQuery(new URLSearchParams(query)));
}

describe("GET /api/products service", () => {
  it("paginates 12 per page and reports the total", async () => {
    const first = await list("");
    assert.equal(first.total, 16);
    assert.equal(first.items.length, 12);
    assert.equal(first.page, 1);
    const second = await list("page=2");
    assert.equal(second.items.length, 4);
  });

  it("filters by category and reports facet counts that ignore the category filter", async () => {
    const audio = await list("category=audio");
    assert.equal(audio.total, 3);
    assert.ok(audio.items.every((item) => item.category.slug === "audio"));
    const counts = Object.fromEntries(audio.facets.categories.map((c) => [c.slug, c.count]));
    assert.equal(counts.audio, 3);
    assert.equal(counts.laptops, 2);
    assert.equal(audio.facets.categories.reduce((sum, c) => sum + c.count, 0), 16);
  });

  it("searches name, tagline and description", async () => {
    const result = await list("q=ridge");
    assert.deepEqual(result.items.map((i) => i.slug).sort(), ["ridge-12", "ridge-12-pro"]);
  });

  it("filters by a price range given in cents", async () => {
    const result = await list("minPrice=10000&maxPrice=20000");
    assert.ok(result.items.length > 0);
    assert.ok(result.items.every((i) => i.priceCents >= 10000 && i.priceCents <= 20000));
    assert.ok(result.items.some((i) => i.slug === "cairn-speaker"));
    assert.ok(!result.items.some((i) => i.slug === "meridian-16-studio"));
  });

  it("excludes out-of-stock products when inStock=true", async () => {
    const { db } = await import("../src/server/db");
    await db.product.update({ where: { slug: "slab-140-charger" }, data: { stock: 0 } });
    const inStock = await list("inStock=true");
    assert.ok(!inStock.items.some((i) => i.slug === "slab-140-charger"));
    assert.equal(inStock.total, 15);
    await db.product.update({ where: { slug: "slab-140-charger" }, data: { stock: 45 } });
  });

  it("sorts by price ascending and descending", async () => {
    const asc = await list("sort=price-asc&pageSize=48");
    const prices = asc.items.map((i) => i.priceCents);
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
    const desc = await list("sort=price-desc&pageSize=48");
    const descPrices = desc.items.map((i) => i.priceCents);
    assert.deepEqual(descPrices, [...descPrices].sort((a, b) => b - a));
  });

  it("sorts by battery hours descending with products lacking a battery last", async () => {
    const result = await list("sort=battery&pageSize=48");
    assert.equal(result.items[0].slug, "kite-75-keyboard");
    const withBattery = result.items.filter((i) => i.battery !== undefined).map((i) => i.battery?.hours ?? 0);
    assert.deepEqual(withBattery, [...withBattery].sort((a, b) => b - a));
    const firstWithout = result.items.findIndex((i) => i.battery === undefined);
    assert.ok(firstWithout > 0 && result.items.slice(firstWithout).every((i) => i.battery === undefined));
  });

  it("sorts newest first", async () => {
    const result = await list("sort=newest");
    assert.equal(result.items[0].slug, "loop-smart-ring");
  });

  it("maps JSON columns back to the Product shape", async () => {
    const result = await list("q=halo");
    const halo = result.items[0];
    assert.equal(halo.images.cutout, "/products/halo-anc-headphones.webp");
    assert.equal(halo.battery?.hours, 40);
    assert.equal(halo.weightGrams, 254);
    assert.equal(halo.badge, undefined);
    assert.ok(Array.isArray(halo.highlights) && halo.highlights.length >= 3);
    assert.equal(halo.specs.Battery, "40 h");
  });

  it("rejects bad query values with every issue listed", () => {
    assert.throws(
      () => products.parseProductListQuery(new URLSearchParams("sort=bogus&minPrice=abc")),
      (error: unknown) =>
        error instanceof errors.ValidationError &&
        error.issues.some((m) => m.startsWith("sort:")) &&
        error.issues.some((m) => m.startsWith("minPrice:")),
    );
    assert.throws(
      () => products.parseProductListQuery(new URLSearchParams("minPrice=500&maxPrice=100")),
      errors.ValidationError,
    );
  });
});

describe("GET /api/products/[slug] service", () => {
  it("returns the product with up to 4 same-category related products, excluding itself", async () => {
    const detail = await products.getProductDetail("halo-anc-headphones");
    assert.equal(detail.slug, "halo-anc-headphones");
    assert.ok(detail.related.length <= 4);
    assert.ok(detail.related.every((r) => r.category.slug === "audio" && r.slug !== detail.slug));
    assert.equal(detail.related.length, 2);
  });

  it("throws NotFoundError for an unknown slug", async () => {
    await assert.rejects(products.getProductDetail("no-such-product"), errors.NotFoundError);
  });
});
