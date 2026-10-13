import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = { title: "Cart", description: "Review your cart." };

export default function CartPage() {
  return <CartView />;
}
