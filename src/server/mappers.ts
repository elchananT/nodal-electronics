import type { Category, Product as ProductRow } from "@prisma/client";
import type { Product, ProductBadge, SpecValue } from "./types";

export type ProductRowWithCategory = ProductRow & { category: Category };

function parseJson(raw: string, field: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Corrupt JSON in Product.${field}`);
  }
}

function isSpecValue(value: unknown): value is SpecValue {
  return typeof value === "string" || typeof value === "number";
}

function parseSpecs(raw: string): Record<string, SpecValue> {
  const value = parseJson(raw, "specs");
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Product.specs must be a JSON object");
  }
  const specs: Record<string, SpecValue> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (isSpecValue(entry)) specs[key] = entry;
  }
  return specs;
}

function parseStringList(raw: string, field: string): string[] {
  const value = parseJson(raw, field);
  if (!Array.isArray(value)) throw new Error(`Product.${field} must be a JSON array`);
  return value.filter((entry): entry is string => typeof entry === "string");
}

function parseCutout(raw: string): string {
  const value = parseJson(raw, "images");
  if (typeof value === "object" && value !== null && "cutout" in value && typeof value.cutout === "string") {
    return value.cutout;
  }
  throw new Error("Product.images must contain a cutout path");
}

function parseBadge(raw: string | null): ProductBadge | undefined {
  if (raw === "New" || raw === "Low stock") return raw;
  return undefined;
}

export function toProduct(row: ProductRowWithCategory): Product {
  const product: Product = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    category: { slug: row.category.slug, name: row.category.name },
    priceCents: row.priceCents,
    stock: row.stock,
    featured: row.featured,
    images: { cutout: parseCutout(row.images) },
    specs: parseSpecs(row.specs),
    highlights: parseStringList(row.highlights, "highlights"),
    description: row.description,
    createdAt: row.createdAt.toISOString(),
  };
  if (row.compareAtCents !== null) product.compareAtCents = row.compareAtCents;
  const badge = parseBadge(row.badge);
  if (badge && !(badge === "Low stock" && row.stock <= 0)) product.badge = badge;
  if (row.batteryHours !== null) product.battery = { hours: row.batteryHours };
  if (row.weightGrams !== null) product.weightGrams = row.weightGrams;
  return product;
}
