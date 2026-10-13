import type { Prisma } from "@prisma/client";
import { CATEGORY_SLUGS, type CategorySlug } from "../data/catalog";
import { db } from "./db";
import { NotFoundError } from "./errors";
import { toProduct, type ProductRowWithCategory } from "./mappers";
import { Issues, queryInt } from "./validation";
import type { CategoryFacet, ProductDetail, ProductListResponse } from "./types";

export const SORT_KEYS = ["featured", "price-asc", "price-desc", "newest", "battery"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

const MAX_PRICE_CENTS = 100_000_000;
const RELATED_LIMIT = 4;

export interface ProductListQuery {
  category?: CategorySlug;
  q?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  inStock: boolean;
  sort: SortKey;
  page: number;
  pageSize: number;
}

export function parseProductListQuery(params: URLSearchParams): ProductListQuery {
  const issues = new Issues();

  const categoryRaw = params.get("category")?.trim() ?? "";
  let category: CategorySlug | undefined;
  if (categoryRaw !== "") {
    if ((CATEGORY_SLUGS as readonly string[]).includes(categoryRaw)) {
      category = categoryRaw as CategorySlug;
    } else {
      issues.add(`category: must be one of ${CATEGORY_SLUGS.join(", ")}`);
    }
  }

  const sortRaw = params.get("sort") ?? "featured";
  let sort: SortKey = "featured";
  if ((SORT_KEYS as readonly string[]).includes(sortRaw)) {
    sort = sortRaw as SortKey;
  } else {
    issues.add(`sort: must be one of ${SORT_KEYS.join(", ")}`);
  }

  const q = params.get("q")?.trim() ?? "";
  const minPriceCents = queryInt(params.get("minPrice"), "minPrice", issues, { min: 0, max: MAX_PRICE_CENTS });
  const maxPriceCents = queryInt(params.get("maxPrice"), "maxPrice", issues, { min: 0, max: MAX_PRICE_CENTS });
  if (minPriceCents !== undefined && maxPriceCents !== undefined && minPriceCents > maxPriceCents) {
    issues.add("minPrice: must be less than or equal to maxPrice");
  }

  const page = queryInt(params.get("page"), "page", issues, { min: 1, max: 100_000 }) ?? 1;
  const pageSize = queryInt(params.get("pageSize"), "pageSize", issues, { min: 1, max: 48 }) ?? 12;

  const inStockRaw = params.get("inStock");
  if (inStockRaw !== null && inStockRaw !== "" && inStockRaw !== "true" && inStockRaw !== "false") {
    issues.add("inStock: must be true or false");
  }

  issues.throwIfAny();
  return {
    category,
    q: q === "" ? undefined : q,
    minPriceCents,
    maxPriceCents,
    inStock: inStockRaw === "true",
    sort,
    page,
    pageSize,
  };
}

export function sortOrder(sort: SortKey): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "featured":
      return [{ featured: "desc" }, { createdAt: "desc" }];
    case "price-asc":
      return [{ priceCents: "asc" }, { name: "asc" }];
    case "price-desc":
      return [{ priceCents: "desc" }, { name: "asc" }];
    case "newest":
      return [{ createdAt: "desc" }, { name: "asc" }];
    case "battery":
      return [{ batteryHours: { sort: "desc", nulls: "last" } }, { name: "asc" }];
  }
}

/** Filters that apply to every listing: search text, price range and stock. Category is applied separately. */
function baseWhere(query: ProductListQuery): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};
  if (query.q) {
    where.OR = [
      { name: { contains: query.q } },
      { tagline: { contains: query.q } },
      { description: { contains: query.q } },
    ];
  }
  if (query.minPriceCents !== undefined || query.maxPriceCents !== undefined) {
    where.priceCents = { gte: query.minPriceCents, lte: query.maxPriceCents };
  }
  if (query.inStock) where.stock = { gt: 0 };
  return where;
}

export async function listProducts(query: ProductListQuery): Promise<ProductListResponse> {
  const filters = baseWhere(query);
  const itemWhere: Prisma.ProductWhereInput = query.category
    ? { AND: [filters, { category: { slug: query.category } }] }
    : filters;

  const [rows, total, matchingForFacets, categories, priceBounds] = await Promise.all([
    db.product.findMany({
      where: itemWhere,
      orderBy: sortOrder(query.sort),
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { category: true },
    }),
    db.product.count({ where: itemWhere }),
    db.product.findMany({ where: filters, select: { category: { select: { slug: true } } } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.product.aggregate({ _min: { priceCents: true }, _max: { priceCents: true } }),
  ]);

  const countsBySlug = new Map<string, number>();
  for (const row of matchingForFacets) {
    countsBySlug.set(row.category.slug, (countsBySlug.get(row.category.slug) ?? 0) + 1);
  }
  const facetCategories: CategoryFacet[] = categories.map((category) => ({
    slug: category.slug,
    name: category.name,
    count: countsBySlug.get(category.slug) ?? 0,
  }));

  return {
    items: rows.map(toProduct),
    total,
    page: query.page,
    pageSize: query.pageSize,
    facets: {
      categories: facetCategories,
      priceMin: priceBounds._min.priceCents ?? 0,
      priceMax: priceBounds._max.priceCents ?? 0,
    },
  };
}

export async function getProductDetail(slug: string): Promise<ProductDetail> {
  const row = await db.product.findUnique({ where: { slug }, include: { category: true } });
  if (!row) throw new NotFoundError("Product not found");

  const relatedRows: ProductRowWithCategory[] = await db.product.findMany({
    where: { categoryId: row.categoryId, NOT: { id: row.id } },
    orderBy: sortOrder("featured"),
    take: RELATED_LIMIT,
    include: { category: true },
  });

  return { ...toProduct(row), related: relatedRows.map(toProduct) };
}
