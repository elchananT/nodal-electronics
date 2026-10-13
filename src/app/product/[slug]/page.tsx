import type { Metadata } from "next";
import { Suspense } from "react";
import { PRODUCTS } from "@/data/catalog";
import { ProductView, ProductSkeleton } from "@/components/product/product-view";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = PRODUCTS.find((p) => p.slug === slug);
  if (!product) return { title: "Product", description: "Specs, highlights and availability." };
  return { title: product.name, description: product.tagline };
}

async function Inner({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductView slug={slug} />;
}

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <Inner params={params} />
    </Suspense>
  );
}
