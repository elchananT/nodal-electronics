"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { ProductCard, ProductCardSkeleton } from "@/components/site/product-card";
import { ErrorState } from "@/components/site/states";
import { useCatalog } from "@/lib/use-catalog";

export function Featured() {
  const { items, error, retry } = useCatalog();
  const featured = items?.filter((p) => p.featured).slice(0, 4);
  return (
    <section aria-labelledby="featured" className="relative bg-ink pb-24 pt-8 md:pb-32">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12">
        <Reveal className="mb-10 flex items-end justify-between gap-6">
          <h2 id="featured" className="text-section">
            Start <span className="serif-accent text-gradient-light">here.</span>
          </h2>
          <Link href="/shop" className="flex items-center gap-1.5 text-cream/75 underline-offset-4 hover:text-cream hover:underline">
            Shop all <ArrowUpRight className="size-4" />
          </Link>
        </Reveal>
        {error ? (
          <ErrorState message={error} onRetry={retry} />
        ) : (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {featured
              ? featured.map((p, i) => (
                  <li key={p.id}>
                    <Reveal delay={i * 0.07} y={36}><ProductCard product={p} /></Reveal>
                  </li>
                ))
              : [0, 1, 2, 3].map((i) => <li key={i}><ProductCardSkeleton /></li>)}
          </ul>
        )}
      </div>
    </section>
  );
}
