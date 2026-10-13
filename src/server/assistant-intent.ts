// Deterministic intent parser for the product finder. No LLM calls: every signal maps to a catalog fact.
import type { CategorySlug } from "../data/catalog";
import type { Product } from "./types";

export interface Intent {
  budgetCents?: number;
  category?: CategorySlug;
  features: FeatureId[];
  nameMatches: string[];
  greeting: boolean;
}

export type FeatureId = "noise-cancelling" | "waterproof" | "battery" | "lightweight" | "120hz" | "portable";

const CATEGORY_PATTERNS: { slug: CategorySlug; pattern: RegExp }[] = [
  { slug: "audio", pattern: /\b(headphones?|earbuds?|buds?|speakers?|audio|headsets?)\b/ },
  { slug: "phones-tablets", pattern: /\b(phones?|smartphones?|tablets?|mobiles?)\b/ },
  { slug: "laptops", pattern: /\b(laptops?|notebooks?|computers?)\b/ },
  { slug: "wearables", pattern: /\b(watch|watches|smartwatch|rings?|wearables?)\b/ },
  { slug: "cameras", pattern: /\b(cameras?|action cams?|mirrorless)\b/ },
  { slug: "smart-home", pattern: /\b(smart home|hubs?)\b/ },
  { slug: "accessories", pattern: /\b(keyboards?|ssds?|drives?|chargers?|accessor(y|ies))\b/ },
];

const FEATURE_PATTERNS: { id: FeatureId; pattern: RegExp }[] = [
  { id: "noise-cancelling", pattern: /\b(noise[- ]?(cancel\w*|canc\w*)|anc)\b/ },
  { id: "waterproof", pattern: /\b(waterproof|water[- ]?resist\w*|ip\d{2})\b/ },
  { id: "battery", pattern: /\b(battery|battery life|long[- ]lasting|lasts? (long|all day))\b/ },
  { id: "lightweight", pattern: /\b(light|lightweight|light weight)\b/ },
  { id: "120hz", pattern: /\b120\s?hz\b/ },
  { id: "portable", pattern: /\b(portable|travel|on the go)\b/ },
];

const BUDGET_PATTERN =
  /\b(under|below|less than|max(?:imum)?|up to|within|budget(?: of)?)\s*\$?\s*(\d{1,6}(?:\.\d{1,2})?)\b|<\s*\$?\s*(\d{1,6})\b/;

// Words that describe a category or feature rather than a product, so they never count as a name match.
const GENERIC_NAME_WORDS = new Set([
  "headphones", "speaker", "portable", "phone", "tablet", "laptop", "studio", "watch", "camera", "action",
  "mini", "keyboard", "buds", "smart", "charger", "slab", "gan", "hub", "ssd", "tablet", "ring", "pro",
]);

function distinctiveWords(name: string): string[] {
  return name
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length >= 4 && !GENERIC_NAME_WORDS.has(word));
}

const GREETING_PATTERN = /^\s*(hi|hello|hey|yo|good (morning|afternoon|evening))\b[\s!.?]*$/;

export function parseIntent(message: string, productNames: { slug: string; name: string }[]): Intent {
  const text = message.toLowerCase().trim();

  const budgetMatch = BUDGET_PATTERN.exec(text);
  const budgetDollars = budgetMatch ? Number(budgetMatch[2] ?? budgetMatch[3]) : undefined;

  const category = CATEGORY_PATTERNS.find(({ pattern }) => pattern.test(text))?.slug;
  const features = FEATURE_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(({ id }) => id);
  const nameMatches = productNames
    .filter(({ name }) => distinctiveWords(name).some((word) => new RegExp(`\\b${word}\\b`).test(text)))
    .map(({ slug }) => slug);

  return {
    budgetCents: budgetDollars === undefined || Number.isNaN(budgetDollars) ? undefined : Math.round(budgetDollars * 100),
    category,
    features,
    nameMatches,
    greeting: GREETING_PATTERN.test(text),
  };
}

export function hasSignal(intent: Intent): boolean {
  return (
    intent.budgetCents !== undefined ||
    intent.category !== undefined ||
    intent.features.length > 0 ||
    intent.nameMatches.length > 0
  );
}

/** Whether a product actually has the feature, judged from its catalog fields only. */
export function productHasFeature(product: Product, feature: FeatureId): boolean {
  const specs = product.specs;
  const copy = [product.name, product.tagline, product.description, ...product.highlights].join(" ").toLowerCase();
  const waterSpec = typeof specs["Water resistance"] === "string" ? specs["Water resistance"] : "";
  switch (feature) {
    case "noise-cancelling":
      return /^yes/i.test(String(specs["Noise cancelling"] ?? "")) || copy.includes("noise cancel");
    case "waterproof":
      return waterSpec !== "" && !/not rated/i.test(waterSpec);
    case "battery":
      return product.battery !== undefined;
    case "lightweight":
      return product.weightGrams !== undefined && product.weightGrams <= 300;
    case "120hz":
      return /120\s?hz/i.test(String(specs.Display ?? "")) || copy.includes("120 hz") || copy.includes("120hz");
    case "portable":
      return copy.includes("portable") || /portable/i.test(String(specs.Type ?? ""));
  }
}

export const FEATURE_LABELS: Record<FeatureId, string> = {
  "noise-cancelling": "noise cancelling",
  waterproof: "water resistance",
  battery: "long battery life",
  lightweight: "a light build",
  "120hz": "a 120 Hz screen",
  portable: "portability",
};
