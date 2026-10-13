"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Search, ShoppingBag } from "lucide-react";
import { Link000 } from "@/components/ui/skiper-ui/skiper40";
import { NAV_LINKS, SITE } from "@/lib/site";
import { useCart } from "@/lib/cart";
import { useCompare } from "@/lib/compare";
import { cn } from "@/lib/utils";
import { InView, LazyMetalBadge } from "./lazy";
import { LogoMark } from "./logo";
import { useSearch } from "./search-context";

export function Nav() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const cart = useCart();
  const compare = useCompare();
  const search = useSearch();

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > prev && y > 400 && !menu);
    setScrolled(y > 40);
  });

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-4"
      animate={{ y: hidden ? -110 : 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <nav
        aria-label="Primary"
        className={cn(
          "relative flex w-full max-w-6xl items-center justify-between gap-3 rounded-full border py-2 pl-3 pr-2 transition-all duration-700 sm:pl-4",
          scrolled || menu ? "border-cream/10 bg-ink/85 shadow-[0_20px_60px_-20px_rgba(0,0,0,.7)] backdrop-blur-md" : "border-transparent bg-transparent",
        )}
      >
        <Link href="/" className="group flex items-center gap-2.5 text-cream" aria-label={`${SITE.name} home`}>
          <LogoMark priority className="size-9 transition-transform duration-500 ease-[var(--ease-spring)] group-hover:-rotate-6 group-hover:scale-105" />
          <span className="font-[family-name:var(--font-display)] text-[1.2rem] font-semibold tracking-[-0.02em]">Nodal</span>
        </Link>

        <ul className="hidden items-center gap-7 text-[0.92rem] text-cream/75 md:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link000 href={l.href} className="transition-colors hover:text-cream">
                {l.label}
                {l.href === "/compare" && compare.slugs.length > 0 && (
                  <span className="ml-1.5 font-mono text-[11px] text-arc-2">{compare.slugs.length}</span>
                )}
              </Link000>
            </li>
          ))}
          <li className="flex h-[25px] w-[45px] items-center">
            <Link href="/shop?sort=newest" aria-label="New arrivals" className="block rounded-full">
              <InView idle margin="0px" fallback={<span className="block h-[25px] w-[45px] rounded-full bg-cream/90" />}>
                <LazyMetalBadge />
              </InView>
            </Link>
          </li>
        </ul>

        <div className="flex items-center gap-1">
          <button
            onClick={() => search.setOpen(true)}
            aria-label="Search products"
            className="grid size-11 place-items-center rounded-full text-cream/80 transition-colors hover:bg-cream/5 hover:text-cream"
          >
            <Search className="size-5" strokeWidth={1.8} />
          </button>
          <button
            onClick={() => cart.setOpen(true)}
            aria-label={`Open cart, ${cart.count} item${cart.count === 1 ? "" : "s"}`}
            className="relative grid size-11 place-items-center rounded-full text-cream/80 transition-colors hover:bg-cream/5 hover:text-cream"
          >
            <ShoppingBag className="size-5" strokeWidth={1.8} />
            <AnimatePresence>
              {cart.count > 0 && (
                <motion.span
                  key={cart.count}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 18 }}
                  className="absolute right-1 top-1 grid min-w-[18px] place-items-center rounded-full bg-plasma px-1 text-[10.5px] font-semibold leading-[18px] text-ink"
                >
                  {cart.count}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button
            className="grid size-11 place-items-center rounded-full text-cream md:hidden"
            onClick={() => setMenu((o) => !o)}
            aria-expanded={menu}
            aria-label="Menu"
          >
            <span className="relative block h-3 w-5">
              <span className={cn("absolute left-0 top-0 h-px w-5 bg-cream transition-transform", menu && "translate-y-1.5 rotate-45")} />
              <span className={cn("absolute bottom-0 left-0 h-px w-5 bg-cream transition-transform", menu && "-translate-y-1.5 -rotate-45")} />
            </span>
          </button>
        </div>

        <AnimatePresence>
          {menu && (
            <motion.ul
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              className="absolute inset-x-0 top-[calc(100%+10px)] flex flex-col gap-1 rounded-[2rem] border border-cream/10 bg-ink-2/95 p-3 backdrop-blur-xl md:hidden"
            >
              {[...NAV_LINKS, { href: "/shop?sort=newest", label: "New arrivals" }].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={() => setMenu(false)} className="block rounded-2xl px-4 py-3 text-lg text-cream/85 hover:bg-cream/5">
                    {l.label}
                  </Link>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
}
