import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopView, ShopSkeleton } from "@/components/shop/shop-view";

export const metadata: Metadata = {
  title: "Shop",
  description: "Phones, audio, laptops, wearables, cameras and accessories. Filter by category, price and availability.",
};

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopView />
    </Suspense>
  );
}
