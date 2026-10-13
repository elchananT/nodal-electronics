import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderView } from "@/components/order/order-view";

export const metadata: Metadata = { title: "Order", description: "Your demo order.", robots: { index: false } };

async function Inner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderView id={id} />;
}

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-6 pt-36"><div className="skeleton h-96" /></div>}>
      <Inner params={params} />
    </Suspense>
  );
}
