import type { Metadata } from "next";
import { PrimaryButton } from "@/components/site/primary-button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[80svh] max-w-3xl flex-col items-start justify-center px-6 pt-24">
      <p className="eyebrow mb-4 text-plasma-2">404</p>
      <h1 className="text-page">This page <span className="serif-accent text-gradient-light">isn&apos;t here.</span></h1>
      <p className="mt-5 max-w-md text-lg text-cream/70">The link may be old, or the page may have moved.</p>
      <div className="mt-8"><PrimaryButton href="/shop" size="lg">Back to the shop</PrimaryButton></div>
    </div>
  );
}
