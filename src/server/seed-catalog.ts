import type { Prisma, PrismaClient } from "@prisma/client";
import { CATEGORIES, PRODUCTS, type CatalogProduct } from "../data/catalog";

function productFields(p: CatalogProduct): Omit<Prisma.ProductCreateInput, "slug"> {
  return {
    name: p.name,
    tagline: p.tagline,
    category: { connect: { slug: p.category } },
    priceCents: p.priceCents,
    compareAtCents: p.compareAtCents ?? null,
    stock: p.stock,
    featured: p.featured,
    badge: p.badge ?? null,
    images: JSON.stringify({ cutout: `/products/${p.slug}.webp` }),
    specs: JSON.stringify(p.specs),
    highlights: JSON.stringify(p.highlights),
    batteryHours: p.batteryHours ?? null,
    weightGrams: p.weightGrams ?? null,
    description: p.description,
    createdAt: new Date(p.createdAt),
  };
}

/** Idempotent: upserts categories and products by slug. Re-running resets catalog-owned fields, including stock. */
export async function seedCatalog(db: PrismaClient): Promise<{ categories: number; products: number }> {
  await db.$transaction(async (tx) => {
    for (const category of CATEGORIES) {
      await tx.category.upsert({
        where: { slug: category.slug },
        create: { slug: category.slug, name: category.name, sortOrder: category.sortOrder },
        update: { name: category.name, sortOrder: category.sortOrder },
      });
    }
    for (const product of PRODUCTS) {
      const fields = productFields(product);
      await tx.product.upsert({
        where: { slug: product.slug },
        create: { slug: product.slug, ...fields },
        update: fields,
      });
    }
  });
  return { categories: CATEGORIES.length, products: PRODUCTS.length };
}
