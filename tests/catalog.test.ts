import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { CATEGORIES, CATEGORY_SLUGS, PRODUCTS } from "../src/data/catalog";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("catalog integrity", () => {
  it("contains exactly the 16 briefed products", () => {
    assert.equal(PRODUCTS.length, 16);
  });

  it("has unique slugs and names", () => {
    assert.equal(new Set(PRODUCTS.map((p) => p.slug)).size, 16);
    assert.equal(new Set(PRODUCTS.map((p) => p.name)).size, 16);
  });

  it("uses only known categories and each category is defined", () => {
    const defined = new Set(CATEGORIES.map((c) => c.slug));
    assert.deepEqual([...defined].sort(), [...CATEGORY_SLUGS].sort());
    for (const product of PRODUCTS) {
      assert.ok(defined.has(product.category), `${product.slug} has unknown category ${product.category}`);
    }
  });

  it("stores money as positive integer cents and stock as non-negative integers", () => {
    for (const product of PRODUCTS) {
      assert.ok(Number.isInteger(product.priceCents) && product.priceCents > 0, `${product.slug} price`);
      if (product.compareAtCents !== undefined) {
        assert.ok(Number.isInteger(product.compareAtCents) && product.compareAtCents > product.priceCents);
      }
      assert.ok(Number.isInteger(product.stock) && product.stock >= 0, `${product.slug} stock`);
    }
  });

  it("matches the brief's badges, featured flags and low stock", () => {
    assert.equal(PRODUCTS.filter((p) => p.featured).length, 4);
    assert.equal(PRODUCTS.filter((p) => p.badge === "New").length, 2);
    const lowStock = PRODUCTS.filter((p) => p.badge === "Low stock");
    assert.equal(lowStock.length, 1);
    assert.equal(lowStock[0].stock, 3);
  });

  it("gives every product 3 to 4 highlights and a real description", () => {
    for (const product of PRODUCTS) {
      assert.ok(product.highlights.length >= 3 && product.highlights.length <= 4, `${product.slug} highlights`);
      assert.ok(product.description.length > 80, `${product.slug} description too short`);
      assert.ok(product.tagline.length > 0, `${product.slug} tagline`);
    }
  });

  it("uses one spec dictionary per category", () => {
    const keysByCategory = new Map<string, string>();
    for (const product of PRODUCTS) {
      const keys = Object.keys(product.specs).sort().join("|");
      const previous = keysByCategory.get(product.category);
      if (previous === undefined) keysByCategory.set(product.category, keys);
      else assert.equal(keys, previous, `${product.slug} spec keys differ within ${product.category}`);
    }
  });

  it("has a cutout image on disk for every product", () => {
    for (const product of PRODUCTS) {
      const file = path.join(ROOT, "public", "products", `${product.slug}.webp`);
      assert.ok(existsSync(file), `missing ${file}`);
    }
  });
});
