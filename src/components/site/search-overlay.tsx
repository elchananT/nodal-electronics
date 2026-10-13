"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Search, X } from "lucide-react";
import { getProducts } from "@/lib/api";
import { money } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductImage } from "./product-image";
import { useSearch } from "./search-context";

export function SearchOverlay() {
  const { open, setOpen } = useSearch();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Product[] | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    window.__lenis?.stop();
    const on = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", on);
    return () => {
      document.removeEventListener("keydown", on);
      window.__lenis?.start();
    };
  }, [open, setOpen]);

  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setItems(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ac = new AbortController();
    const t = setTimeout(() => {
      getProducts({ q: term, pageSize: 6 }, ac.signal).then(
        (r) => { setItems(r.items); setError(false); setLoading(false); },
        (e) => { if (e.name !== "AbortError") { setError(true); setLoading(false); } },
      );
    }, 180);
    return () => { clearTimeout(t); ac.abort(); };
  }, [q]);

  const close = () => setOpen(false);
  const submit = () => {
    const term = q.trim();
    close();
    router.push(term ? `/shop?q=${encodeURIComponent(term)}` : "/shop");
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center px-3 pt-[10vh]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-ink/80" onClick={close} aria-hidden />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search products"
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-cream/10 bg-ink-2 shadow-[0_40px_120px_-30px_rgba(0,0,0,.9)]"
          >
            <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex items-center gap-3 px-5">
              <Search className="size-5 shrink-0 text-cream/60" />
              <input
                ref={input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products"
                aria-label="Search products"
                className="h-16 min-w-0 flex-1 bg-transparent text-lg text-cream outline-none placeholder:text-cream/50"
              />
              <button type="button" onClick={close} aria-label="Close search" className="grid size-10 place-items-center rounded-full text-cream/70 hover:bg-cream/10">
                <X className="size-5" />
              </button>
            </form>
            <div data-lenis-prevent className="max-h-[50vh] overflow-y-auto border-t border-cream/10 p-2">
              {error ? (
                <p role="alert" className="px-4 py-6 text-cream/70">Search is unavailable right now. Try again in a moment.</p>
              ) : loading && !items ? (
                <div className="space-y-2 p-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-16" />)}</div>
              ) : items && items.length === 0 ? (
                <p className="px-4 py-6 text-cream/70">No products match &ldquo;{q.trim()}&rdquo;.</p>
              ) : items ? (
                <ul>
                  {items.map((p) => (
                    <li key={p.id}>
                      <Link href={`/product/${p.slug}`} onClick={close} className="flex items-center gap-4 rounded-2xl p-2 hover:bg-cream/5 focus-visible:bg-cream/5">
                        <span className="room relative block size-14 shrink-0 overflow-hidden rounded-xl"><ProductImage src={p.images.cutout} alt="" sizes="56px" className="p-1" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{p.name}</span>
                          <span className="block truncate text-sm text-cream/60">{p.category.name}</span>
                        </span>
                        <span className="font-mono text-sm">{money(p.priceCents)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-5 text-cream/60">Headphones, laptops, cameras…</p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
