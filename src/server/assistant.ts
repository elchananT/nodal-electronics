import type { CategorySlug } from "../data/catalog";
import { CATEGORIES } from "../data/catalog";
import { db } from "./db";
import { toProduct } from "./mappers";
import { FEATURE_LABELS, hasSignal, parseIntent, productHasFeature, type FeatureId, type Intent } from "./assistant-intent";
import type { AssistantResponse, Product } from "./types";

const MAX_RESULTS = 3;
const MAX_MESSAGE_LENGTH = 500;

const GREETING_REPLY =
  "Hi, I can help you find a product. Try something like \"headphones under $200\" or browse the full range at /shop.";
const FALLBACK_REPLY =
  "I could not match that to our catalog. Try a category such as laptops or wearables, or browse everything at /shop.";

export function formatPrice(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
}

function categoryName(slug: CategorySlug): string {
  return CATEGORIES.find((category) => category.slug === slug)?.name ?? slug;
}

interface Scored {
  product: Product;
  featureHits: FeatureId[];
  nameHit: boolean;
}

function score(products: Product[], intent: Intent): Scored[] {
  return products
    .filter((product) => intent.category === undefined || product.category.slug === intent.category)
    .filter((product) => intent.budgetCents === undefined || product.priceCents <= intent.budgetCents)
    .map((product) => ({
      product,
      featureHits: intent.features.filter((feature) => productHasFeature(product, feature)),
      nameHit: intent.nameMatches.includes(product.slug),
    }));
}

const KINDS: { asked: RegExp; product: RegExp }[] = [
  { asked: /head ?phones?|earbuds?|earphones?|\bbuds?\b/i, product: /headphone|\bbuds\b|over-ear/i },
  { asked: /speakers?/i, product: /speaker/i },
];

function matchesAskedKind(text: string, product: Product): boolean {
  const asked = KINDS.filter((kind) => kind.asked.test(text));
  if (asked.length === 0) return true;
  const haystack = `${product.name} ${product.tagline}`;
  return asked.some((kind) => kind.product.test(haystack));
}

function rank(a: Scored, b: Scored): number {
  if (a.nameHit !== b.nameHit) return a.nameHit ? -1 : 1;
  if (a.featureHits.length !== b.featureHits.length) return b.featureHits.length - a.featureHits.length;
  if ((a.product.stock > 0) !== (b.product.stock > 0)) return a.product.stock > 0 ? -1 : 1;
  if (a.product.featured !== b.product.featured) return a.product.featured ? -1 : 1;
  return a.product.priceCents - b.product.priceCents;
}

function describeScope(intent: Intent): string {
  const parts: string[] = [];
  if (intent.category) parts.push(categoryName(intent.category).toLowerCase());
  if (intent.budgetCents !== undefined) parts.push(`under ${formatPrice(intent.budgetCents)}`);
  return parts.join(" ");
}

function buildReply(intent: Intent, results: Scored[], candidates: Scored[]): string {
  const scope = describeScope(intent);
  const label = scope === "" ? "" : ` ${scope}`;
  if (results.length === 0) {
    if (intent.budgetCents !== undefined && candidates.length === 0) {
      return `Nothing in our catalog${label === "" ? "" : ` for${label}`}. Try a higher budget or browse everything at /shop.`;
    }
    return `Nothing in our catalog matches that yet. Browse the full range at /shop.`;
  }
  const names = results.map(({ product }) => `${product.name} (${formatPrice(product.priceCents)})`);
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  const featureNames = intent.features.map((feature) => FEATURE_LABELS[feature]);
  const withoutFeature = intent.features.length > 0 && results.every(({ featureHits }) => featureHits.length === 0);
  if (withoutFeature) {
    return `None of our${label === "" ? " products" : label} is listed with ${featureNames.join(" or ")}; the closest are ${list}. Browse everything at /shop.`;
  }
  const named = results.some(({ nameHit }) => nameHit);
  const matchedFeatures = intent.features.filter((feature) => results.every(({ product }) => productHasFeature(product, feature)));
  const featureSuffix = matchedFeatures.length > 0 ? ` with ${matchedFeatures.map((feature) => FEATURE_LABELS[feature]).join(" and ")}` : "";
  const lead = named ? "Here is what matches that name" : `Best matches${label}${featureSuffix}`;
  return `${lead}: ${list}. Browse everything at /shop.`;
}

export async function answerMessage(message: string): Promise<AssistantResponse> {
  const text = message.trim();
  if (text === "" || text.length > MAX_MESSAGE_LENGTH) {
    return { reply: FALLBACK_REPLY, productSlugs: [] };
  }
  const rows = await db.product.findMany({ include: { category: true } });
  const products = rows.map(toProduct);
  const intent = parseIntent(
    text,
    products.map(({ slug, name }) => ({ slug, name })),
  );

  if (!hasSignal(intent)) {
    return { reply: intent.greeting ? GREETING_REPLY : FALLBACK_REPLY, productSlugs: [] };
  }

  const candidates = score(products, intent).filter(({ product }) => matchesAskedKind(text, product));
  const withFeatures = candidates.filter(({ featureHits }) => featureHits.length > 0);
  const named = candidates.filter(({ nameHit }) => nameHit);
  const featureFiltered = intent.features.length > 0 && withFeatures.length > 0 ? withFeatures : candidates;
  const pool = named.length > 0 ? named : featureFiltered;
  const results = [...pool].sort(rank).slice(0, MAX_RESULTS);

  return {
    reply: buildReply(intent, results, candidates),
    productSlugs: results.map(({ product }) => product.slug),
  };
}
