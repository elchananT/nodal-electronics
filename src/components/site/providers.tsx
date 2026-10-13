"use client";

import type { ReactNode } from "react";
import { CartProvider } from "@/lib/cart";
import { CompareProvider } from "@/lib/compare";
import { Nav } from "./nav";
import { Footer } from "./footer";
import { CartDrawer } from "./cart-drawer";
import { SearchOverlay } from "./search-overlay";
import { SearchProvider } from "./search-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <CompareProvider>
        <SearchProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-cream focus:px-4 focus:py-2 focus:text-ink">
            Skip to content
          </a>
          <Nav />
          <main id="main">{children}</main>
          <Footer />
          <CartDrawer />
          <SearchOverlay />
        </SearchProvider>
      </CompareProvider>
    </CartProvider>
  );
}
