import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { setupTestDatabase } from "./helpers/test-db";

let teardown: () => Promise<void>;
let assistant: typeof import("../src/server/assistant");
let intentModule: typeof import("../src/server/assistant-intent");

before(async () => {
  teardown = await setupTestDatabase();
  assistant = await import("../src/server/assistant");
  intentModule = await import("../src/server/assistant-intent");
});

after(async () => {
  await teardown();
});

describe("assistant parser", () => {
  const names = [{ slug: "pebble-buds", name: "Pebble Buds" }];

  it("reads budgets written several ways", () => {
    assert.equal(intentModule.parseIntent("under $200", names).budgetCents, 20000);
    assert.equal(intentModule.parseIntent("below 300", names).budgetCents, 30000);
    assert.equal(intentModule.parseIntent("max 150", names).budgetCents, 15000);
  });

  it("maps synonyms to categories", () => {
    assert.equal(intentModule.parseIntent("earbuds", names).category, "audio");
    assert.equal(intentModule.parseIntent("a new phone", names).category, "phones-tablets");
    assert.equal(intentModule.parseIntent("smart ring", names).category, "wearables");
    assert.equal(intentModule.parseIntent("usb charger", names).category, "accessories");
  });

  it("detects feature keywords", () => {
    assert.deepEqual(intentModule.parseIntent("noise cancelling and waterproof", names).features, [
      "noise-cancelling",
      "waterproof",
    ]);
  });
});

describe("assistant answers", () => {
  it("answers a budget question with real products under the budget", async () => {
    const answer = await assistant.answerMessage("headphones under $200");
    assert.deepEqual(answer.productSlugs, ["pebble-buds"]);
    assert.match(answer.reply, /Pebble Buds \(\$129\)/);
    assert.match(answer.reply, /\/shop/);
  });

  it("answers a category question with only that category", async () => {
    const answer = await assistant.answerMessage("show me laptops");
    assert.ok(answer.productSlugs.length > 0 && answer.productSlugs.length <= 3);
    assert.ok(answer.productSlugs.every((slug) => slug === "meridian-14" || slug === "meridian-16-studio"));
  });

  it("keeps the result list at three products or fewer", async () => {
    const answer = await assistant.answerMessage("phone or tablet");
    assert.ok(answer.productSlugs.length <= 3);
  });

  it("falls back politely for unknown requests", async () => {
    const answer = await assistant.answerMessage("what is the weather in Paris");
    assert.deepEqual(answer.productSlugs, []);
    assert.match(answer.reply, /\/shop/);
  });

  it("greets politely without products", async () => {
    const answer = await assistant.answerMessage("hello");
    assert.deepEqual(answer.productSlugs, []);
    assert.match(answer.reply, /\/shop/);
  });

  it("never invents a product name", async () => {
    const answer = await assistant.answerMessage("waterproof camera");
    assert.deepEqual(answer.productSlugs, ["orbit-action-cam"]);
    assert.match(answer.reply, /Orbit Action Cam \(\$329\)/);
  });

  it("keeps headphone questions to headphones and earbuds, not other audio products", async () => {
    const answer = await assistant.answerMessage("headphones under $300");
    assert.ok(answer.productSlugs.length > 0);
    assert.ok(!answer.productSlugs.includes("cairn-speaker"));
    assert.ok(answer.productSlugs.every((slug) => ["halo-anc-headphones", "pebble-buds"].includes(slug)));
  });
});
