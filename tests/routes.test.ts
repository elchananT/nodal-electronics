import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { NextRequest } from "next/server";
import { setupTestDatabase } from "./helpers/test-db";

let teardown: () => Promise<void>;
let ordersRoute: typeof import("../src/app/api/orders/route");
let productsRoute: typeof import("../src/app/api/products/route");
let assistantRoute: typeof import("../src/app/api/assistant/route");
let pricingRoute: typeof import("../src/app/api/cart/price/route");

before(async () => {
  teardown = await setupTestDatabase();
  ordersRoute = await import("../src/app/api/orders/route");
  productsRoute = await import("../src/app/api/products/route");
  assistantRoute = await import("../src/app/api/assistant/route");
  pricingRoute = await import("../src/app/api/cart/price/route");
});

after(async () => {
  await teardown();
});

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("HTTP status mapping", () => {
  it("returns 400 with {error, details} for an invalid checkout body", async () => {
    const response = await ordersRoute.POST(jsonRequest("http://test/api/orders", { items: [] }));
    assert.equal(response.status, 400);
    const body = (await response.json()) as { error: string; details: string[] };
    assert.equal(body.error, "Invalid request");
    assert.ok(body.details.length > 0);
  });

  it("returns 400 for malformed JSON", async () => {
    const request = new Request("http://test/api/cart/price", { method: "POST", body: "{nope" });
    const response = await pricingRoute.POST(request);
    assert.equal(response.status, 400);
  });

  it("returns 201 for a valid order and 409 when the stock is gone", async () => {
    const { db } = await import("../src/server/db");
    const product = await db.product.findUniqueOrThrow({ where: { slug: "tern-watch" } });
    const body = {
      items: [{ productId: product.id, quantity: 1 }],
      customer: { name: "Grace Hopper", email: "grace@example.com" },
      shipping: { line1: "2 Harbor Rd", city: "Portsmouth", region: "NH", postalCode: "03801", country: "US" },
      method: "express",
    };
    const created = await ordersRoute.POST(jsonRequest("http://test/api/orders", body));
    assert.equal(created.status, 201);
    const order = (await created.json()) as { id: string; totalCents: number };
    assert.equal(order.totalCents, 29900 + 1800);

    await db.product.update({ where: { id: product.id }, data: { stock: 0 } });
    const conflict = await ordersRoute.POST(jsonRequest("http://test/api/orders", body));
    assert.equal(conflict.status, 409);
    const conflictBody = (await conflict.json()) as { error: string; details: { slug: string }[] };
    assert.match(conflictBody.error, /Not enough stock: Tern Watch/);
    assert.equal(conflictBody.details[0].slug, "tern-watch");
  });

  it("serves the product list and assistant with 200", async () => {
    const list = await productsRoute.GET(new NextRequest("http://test/api/products?category=laptops"));
    assert.equal(list.status, 200);
    const assistant = await assistantRoute.POST(jsonRequest("http://test/api/assistant", { message: "hi" }));
    assert.equal(assistant.status, 200);
  });
});
