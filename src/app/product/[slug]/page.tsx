import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductView, ProductSkeleton } from "@/components/product/product-view";

export const metadata: Metadata = {
  title: "Product",
  description: "Specs, highlights and availability.",
};

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
