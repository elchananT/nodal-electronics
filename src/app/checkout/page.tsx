import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/checkout-view";

export const metadata: Metadata = { title: "Checkout", description: "Place a demo order. No payment is taken." };

export default function CheckoutPage() {
  return <CheckoutView />;
}
