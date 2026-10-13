"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { useCatalog } from "@/lib/use-catalog";
import { CATEGORIES } from "@/lib/site";

export function CategoryRail() {
  const { items } = useCatalog();
  const count = (slug: string) => (items ? items.filter((p) => p.category.slug === slug).length : null);
  return (
    <section aria-labelledby="cats" className="relative bg-ink py-16 md:py-24">
      <div className="mx-auto max-w-[1440px] px-6 md:px-12">
        <Reveal className="mb-10 flex items-end justify-between gap-6">
          <h2 id="cats" className="text-section max-w-xl">
            Seven <span className="serif-accent text-gradient-light">aisles.</span>
          </h2>
          <Link href="/shop" className="hidden items-center gap-1.5 text-cream/75 underline-offset-4 hover:text-cream hover:underline sm:flex">
            All products <ArrowUpRight className="size-4" />
          </Link>
        </Reveal>
      </div>
      <ul
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 [scrollbar-width:none] md:gap-5 md:px-12 [&::-webkit-scrollbar]:hidden"
      >
        {CATEGORIES.map((c, i) => (
          <li key={c.slug} className="snap-start">
            <Reveal delay={i * 0.05} y={30}>
              <Link href={`/shop?category=${c.slug}`} className="group room relative block h-[19rem] w-[14.5rem] overflow-hidden rounded-[2.2rem] border border-cream/[0.06] md:h-[22rem] md:w-[15.5rem]">
                <div className="room-floor" />
                <div className="absolute inset-x-[10%] top-[10%] bottom-[30%] transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-110 group-hover:-rotate-2">
                  <Image src={`/products/${c.hero}.webp`} alt="" fill sizes="250px" className="object-contain" />
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                  <div>
                    <p className="text-xl font-medium leading-tight">{c.name}</p>
                    <p className="mt-1 h-4 font-mono text-[11px] uppercase tracking-[0.12em] text-cream/60">
                      {count(c.slug) != null ? `${count(c.slug)} ${count(c.slug) === 1 ? "product" : "products"}` : ""}
                    </p>
                  </div>
                  <span className="grid size-10 place-items-center rounded-full bg-cream/10 transition-colors duration-500 group-hover:bg-cream group-hover:text-ink">
                    <ArrowUpRight className="size-5" />
                  </span>
                </div>
              </Link>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
